// module.exports = router;
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const deviceCtrl = require('../controllers/deviceController');
const { publishCommand, getMQTTClient, getLatestTelemetry } = require('../services/mqttService');
const House = require('../models/House');

// ==================== ESP32 Compatible Routes (Dashboard) ====================
// Đặt routes cụ thể trước để tránh conflict với routes có param động

// GET /api/devices/:houseId/status - Lấy trạng thái thiết bị từ MQTT cache
router.get('/:houseId/status', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    
    // Verify house exists
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Get latest telemetry from MQTT cache
    const telemetry = getLatestTelemetry(houseId);
    const espTele = telemetry['esp32_device_1'] || {};
    
    // Map ESP32 device states to frontend format
    const devices = {
      den: { 
        state: espTele.devices?.light ? 'on' : 'off', 
        brightness: espTele.devices?.light_brightness ?? null 
      },
      quat: { 
        state: espTele.devices?.fan ? 'on' : 'off', 
        speed: espTele.devices?.fan_speed ?? null 
      },
      dieuHoa: { 
        state: espTele.devices?.ac ? 'on' : 'off', 
        temp: espTele.devices?.ac_temp ?? null 
      },
      camera: { 
        state: espTele.devices?.camera ? 'on' : 'off' 
      }
    };
    
    // Sensor data from ESP32
    const sensors = {
      temperature: espTele.sensors?.temperature ?? null,
      humidity: espTele.sensors?.humidity ?? null,
      light_intensity: espTele.sensors?.light_intensity ?? null,
      gas_level: espTele.sensors?.gas_level ?? null,
      motion: espTele.sensors?.motion ?? null
    };
    
    res.json({ 
      status: 'ok', 
      mqtt_connected: !!getMQTTClient()?.connected, 
      devices, 
      sensors, 
      raw: espTele 
    });
  } catch (error) {
    console.error('Error getting device status:', error);
    res.status(500).json({ error: 'Failed to get device status' });
  }
});

router.post('/:deviceId/control', authMiddleware, deviceCtrl.controlDevice);
// POST /api/devices/:houseId/:deviceId/toggle - Toggle device (ESP32 compatible)
router.post('/:houseId/:deviceId/toggle', authMiddleware, async (req, res) => {
  try {
    const { houseId, deviceId } = req.params;
    
    // Verify house exists
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Map frontend device IDs to ESP32 device names
    const deviceMap = {
      'den': 'light',
      'quat': 'fan',
      'dieuHoa': 'ac',
      'camera': 'camera'
    };
    
    const mqttDeviceName = deviceMap[deviceId];
    if (!mqttDeviceName) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }
    
    // Publish toggle command to MQTT
    const command = { device: mqttDeviceName, action: 'toggle' };
    const ok = publishCommand(houseId, 'esp32_device_1', command);
    
    if (!ok) {
      return res.status(503).json({ error: 'MQTT broker not connected' });
    }
    
    res.json({ success: true, message: `Toggled ${deviceId}`, command });
  } catch (error) {
    console.error('Error toggling device:', error);
    res.status(500).json({ error: 'Failed to toggle device' });
  }
});

// POST /api/devices/:houseId/:deviceId/set - Set device value (ESP32 compatible)
router.post('/:houseId/:deviceId/set', authMiddleware, async (req, res) => {
  try {
    const { houseId, deviceId } = req.params;
    const { value } = req.body;
    
    if (typeof value !== 'number') {
      return res.status(400).json({ error: 'Value must be a number' });
    }
    
    // Verify house exists
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Map to MQTT control parameter and clamp values
    let command;
    if (deviceId === 'den') {
      const v = Math.max(0, Math.min(100, value));
      command = { device: 'light_brightness', action: 'set', value: v };
    } else if (deviceId === 'quat') {
      const v = Math.max(0, Math.min(5, value));
      command = { device: 'fan_speed', action: 'set', value: v };
    } else if (deviceId === 'dieuHoa') {
      const v = Math.max(16, Math.min(30, value));
      command = { device: 'ac_temp', action: 'set', value: v };
    } else {
      return res.status(400).json({ error: 'Device does not support value setting' });
    }
    
    // Publish command to MQTT
    const ok = publishCommand(houseId, 'esp32_device_1', command);
    if (!ok) {
      return res.status(503).json({ error: 'MQTT broker not connected' });
    }
    
    res.json({ success: true, message: `Set ${deviceId} to ${command.value}`, command });
  } catch (error) {
    console.error('Error setting device:', error);
    res.status(500).json({ error: 'Failed to set device' });
  }
});

// ==================== Device Management Routes ====================

// POST /api/devices - Tạo thiết bị mới
router.post("/", authMiddleware, deviceCtrl.createDevice);

// GET /api/devices/house/:houseId - Lấy danh sách thiết bị theo nhà
router.get('/house/:houseId', authMiddleware, deviceCtrl.getDevicesByHouse);

// POST /api/devices/:deviceId/control - Điều khiển thiết bị (Device model based)
router.post('/:deviceId/control', authMiddleware, deviceCtrl.controlDevice);

// PUT /api/devices/:deviceId/telemetry - Cập nhật telemetry
router.put('/:deviceId/telemetry', authMiddleware, deviceCtrl.updateTelemetry);

// POST /api/devices/:deviceId/permissions/add - Thêm quyền
router.post('/:deviceId/permissions/add', authMiddleware, deviceCtrl.addPermission);

// POST /api/devices/:deviceId/permissions/remove - Xóa quyền
router.post('/:deviceId/permissions/remove', authMiddleware, deviceCtrl.removePermission);

module.exports = router;
