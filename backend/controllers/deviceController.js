const Device = require('../models/Device');
const House = require('../models/House');
const { publishCommand } = require('../services/mqttService'); // assume you have mqtt client wrapper
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
      status: 'offline'
    });

    await device.save();
    console.log(`✅ Device created: ${name} (${hardwareId}) in house ${houseId}`);
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
    const { action, value, houseId } = req.body; 

    console.log(`🎮 Control Request: ID=${deviceId}, Action=${action}, House=${houseId}`);

    if (!houseId) return res.status(400).json({ error: 'House ID required' });

    // ... (Logic tìm kiếm thiết bị giữ nguyên như các bước trước) ...
    // Tóm tắt: Tìm trong Static Map -> Tìm trong DB -> Fallback

    let mqttDeviceName = null;
    const deviceMap = { 'den': 'light', 'quat': 'fan', 'dieuHoa': 'ac', 'camera': 'camera' };
    
    if (deviceMap[deviceId]) {
        mqttDeviceName = deviceMap[deviceId];
    } else {
        try {
            const device = await Device.findById(deviceId);
            if (device) mqttDeviceName = device.hardwareId; 
        } catch (dbErr) {
            console.log(`DB Lookup skipped: ${dbErr.message}`);
        }
    }

    if (!mqttDeviceName) mqttDeviceName = deviceId;

    let command = { device: mqttDeviceName, action };
    if (action === 'set') command.value = value;

    // KIỂM TRA TRƯỚC KHI GỌI HÀM ĐỂ TRÁNH LỖI 500 DO CRASH
    if (typeof publishCommand !== 'function') {
        console.error("CRITICAL ERROR: publishCommand is not a function. Check mqttService exports.");
        return res.status(500).json({ error: "Server internal error: MQTT service unavailable" });
    }

    const ok = publishCommand(houseId, 'esp32_device_1', command);
    
    if (!ok) return res.status(503).json({ error: 'MQTT broker not connected' });

    res.json({ success: true, command });

  } catch (error) {
    console.error('❌ Control Error:', error);
    res.status(500).json({ error: error.message });
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
