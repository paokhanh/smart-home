const Device = require('../models/Device');
const House = require('../models/House');
const { publish, publishCommand } = require('../services/mqttService'); // mqtt helper functions
const mongoose = require('mongoose');

exports.createDevice = async (req, res) => {
  try {
    const { name, hardwareId, type, houseId, location } = req.body;
    if (!name || !hardwareId || !houseId) {
      return res.status(400).json({ message: 'Missing required fields: name, hardwareId, houseId' });
    }

    // Ensure house exists
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }

    // Check if hardwareId already exists IN THIS HOUSE
    const existingDevice = await Device.findOne({ hardwareId, houseId });
    if (existingDevice) {
      return res.status(400).json({ message: 'Device with this hardwareId already exists in this house' });
    }

    const device = new Device({
      name,
      hardwareId,
      type: type || 'socket',
      location: location || '',
      houseId,
      owner: req.user._id,
      permissions: [req.user._id],
      mqttTopicSet: `devices/${hardwareId}/set`, // Format: devices/SOCK_998877/set
      pin: req.body.pin ? Number(req.body.pin) : undefined,
      status: 'offline'
    });

    await device.save();
    console.log(`✅ Device created: ${name} (${hardwareId}) in house ${houseId}`);

    // Automatically migrate legacy power records to this new hardwareId when appropriate
    // try {
    //   const PowerConsumption = require('../models/PowerConsumption');
    //   const legacyMap = { light: 'den', fan: 'quat', camera: 'camera', ac: 'dieuHoa', dieuHoa: 'dieuHoa' };
    //   const legacyKey = legacyMap[device.type];
    //   if (legacyKey) {
    //     const result = await PowerConsumption.updateMany(
    //       { houseId: device.houseId, deviceId: legacyKey },
    //       { $set: { deviceId: device.hardwareId } }
    //     );
    //     if (result.matchedCount > 0) {
    //       console.log(`🔁 Migrated ${result.matchedCount} legacy power records from '${legacyKey}' to '${device.hardwareId}'`);
    //     }
    //   }
    // } catch (migErr) {
    //   console.error('❌ Error migrating legacy power records:', migErr);
    // }

    // Send device config to ESP32 so it can map hardwareId -> pin (optional)
    try {
      // Firmware subscribes to config subtopics so we publish into a subtopic per device
      const configTopic = `device/esp32_device_1/config/add_device/${device.hardwareId}`;
      const payloadObj = {
        type: 'add_device',
        device: {
          hardwareId: device.hardwareId,
          type: device.type,
          pin: device.pin,
          name: device.name
        },
        houseId: house?.mqttCode
      };
      // Publish device config to ESP32 (best-effort, retained in case device reconnects)
      try {
        publish(configTopic, payloadObj, { retain: true });
        console.log('📤 Published retained device config to ESP32 (subtopic):', configTopic, payloadObj);
      } catch (pubErr) {
        console.error('❌ Publish error while sending device config:', pubErr);
      }
    } catch (err) {
      console.error('❌ Failed to publish device config to ESP32:', err);
    }
    return res.status(201).json(device);
  } catch (err) {
    console.error('Error creating device:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Get devices by house
exports.getDevicesByHouse = async (req, res) => {
  try {
    const devices = await Device.find({ houseId: req.params.houseId });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.controlDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { action, houseId } = req.body;

    console.log('🔧 controlDevice called', { deviceId, action, houseId });

    if (!houseId) {
      return res.status(400).json({ error: 'houseId is required' });
    }

    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ error: 'House not found' });

    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const command = {
      hardwareId: device.hardwareId,
      action
    };
    // include numeric value if provided (for 'set' actions)
    if (req.body.value !== undefined) command.value = req.body.value;

    // Use publishCommand to ensure topic = house/{houseId}/device/{deviceId}/control
    const ok = publishCommand(house.mqttCode, 'esp32_device_1', command);
    if (!ok) {
      return res.status(503).json({ error: 'MQTT broker not connected' });
    }

    res.json({ success: true, command });
  } catch (err) {
    console.error('Error in controlDevice:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};


// Update device telemetry/status (optional if you want backend to receive updates via MQTT and write to DB)
exports.updateTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    device.telemetry = req.body;
    if (req.body.state) device.status = req.body.state;
    await device.save();
    res.json(device);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Manage permissions (add/remove)
exports.addPermission = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userId } = req.body;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    // only owner or admin
    if (req.user.role !== 'Admin' && !device.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'No permission' });
    }
    if (!device.permissions.some(p => p.equals(userId))) {
      device.permissions.push(userId);
      await device.save();
    }
    res.json(device);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.removePermission = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userId } = req.body;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    if (req.user.role !== 'Admin' && !device.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'No permission' });
    }
    device.permissions = device.permissions.filter(p => !p.equals(userId));
    await device.save();
    res.json(device);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/devices/:deviceId - Xóa thiết bị (owner hoặc admin)
exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    // only owner or admin can delete
    if (req.user.role !== 'Admin' && !device.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'No permission to delete' });
    }

    // Remove device document
    await Device.deleteOne({ _id: deviceId });

    // Notify ESP to remove mapping (best-effort)
    try {
      const payload = {
        type: 'remove_device',
        device: { hardwareId: device.hardwareId }
      };
      // Publish a removal message (non-retained) to instruct ESP to drop mapping
      publish(`device/esp32_device_1/config/remove_device/${device.hardwareId}`, payload, { retain: false });
      // Also clear any retained add_device entry for this hardwareId (publish empty retained)
      publish(`device/esp32_device_1/config/add_device/${device.hardwareId}`, '', { retain: true });
      console.log('📤 Published device removal to ESP32 and cleared retained add:', payload);
    } catch (pubErr) {
      console.error('❌ Failed to publish device removal to ESP32:', pubErr);
    }

    res.json({ message: 'Device deleted' });
  } catch (err) {
    console.error('Error deleting device:', err);
    res.status(500).json({ message: err.message });
  }
};
