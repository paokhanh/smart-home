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

    // Check if hardwareId already exists
    const existingDevice = await Device.findOne({ hardwareId });
    if (existingDevice) {
      return res.status(400).json({ message: 'Device with this hardwareId already exists' });
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

    // Send device config to ESP32 so it can map hardwareId -> pin (optional)
    try {
      const configTopic = `house/${house._id}/device/esp32_device_1/config`;
      const payload = {
        action: 'add_device',
        device: {
          hardwareId: device.hardwareId,
          type: device.type,
          pin: device.pin,
          name: device.name
        },
        mqttCode: (await House.findById(houseId)).mqttCode
      };
      // Publish device config to ESP32 (best-effort)
      try {
        publish(configTopic, payload);
        console.log('📤 Published device config to ESP32:', payload );
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

// Control device (toggle or set)
exports.controlDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { action, value } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const house = await House.findById(device.houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Map to MQTT device name - support fixed types and custom devices
    const typeMap = { light: 'light', fan: 'fan', ac: 'ac', camera: 'camera' };
    const mqttDevice = typeMap[device.type] || device.hardwareId; // fallback to hardwareId for custom devices

    const command = { device: mqttDevice, action };
    if (action === 'set' && value !== undefined) command.value = value;

    const ok = publishCommand(
      house.mqttCode,
      'esp32_device_1',
      command
    );

    if (!ok) {
      return res.status(503).json({ error: 'MQTT not connected' });
    }

    res.json({ success: true, command });
  } catch (err) {
    console.error('❌ Control Error:', err);
    res.status(500).json({ error: err.message });
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
