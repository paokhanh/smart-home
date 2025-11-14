const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { publishCommand, getMQTTClient, getLatestTelemetry } = require('../services/mqttService');
const House = require('../models/House');

// POST /api/devices/:houseId/:deviceId/toggle
// Toggle device on/off
router.post('/:houseId/:deviceId/toggle', authMiddleware, async (req, res) => {
  try {
    const { houseId, deviceId } = req.params;
    console.log(`API: Toggle request received - house:${houseId} device:${deviceId} user:${req.user?._id}`);
    console.log('Request body:', req.body);
    // Verify user has access to this house
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Map device IDs to MQTT device names
    const deviceMap = {
      'den': 'light',
      'quat': 'fan',
      'dieuHoa': 'ac',  // map AC to its own device id 'ac'
      'camera': 'camera'
    };

    const mqttDeviceName = deviceMap[deviceId];
    if (!mqttDeviceName) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }

    // Publish toggle command to MQTT (use publishCommand helper)
    const command = { device: mqttDeviceName, action: 'toggle' };
    try {
      const ok = publishCommand(houseId, 'esp32_device_1', command);
      if (!ok) {
        console.error('Publish failed: MQTT not connected');
        return res.status(503).json({ error: 'MQTT broker not connected' });
      }
      console.log('Published command via publishCommand:', command);
      return res.json({ success: true, message: `Toggled ${deviceId}`, command });
    } catch (pubErr) {
      console.error('Publish exception:', pubErr);
      return res.status(500).json({ error: 'Publish error', details: pubErr.message });
    }

  } catch (error) {
    console.error('Error toggling device:', error);
    res.status(500).json({ error: 'Failed to toggle device' });
  }
});

// POST /api/devices/:houseId/:deviceId/set
// Set device value (brightness, speed, etc)
router.post('/:houseId/:deviceId/set', authMiddleware, async (req, res) => {
  try {
    const { houseId, deviceId } = req.params;
    const { value } = req.body;

    if (typeof value !== 'number') {
      return res.status(400).json({ error: 'Value must be a number' });
    }

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
      // AC temperature setpoint (map to ac_temp)
      const v = Math.max(16, Math.min(30, value));
      command = { device: 'ac_temp', action: 'set', value: v };
    } else {
      return res.status(400).json({ error: 'Device does not support value setting' });
    }

    try {
      const ok = publishCommand(houseId, 'esp32_device_1', command);
      if (!ok) {
        return res.status(503).json({ error: 'MQTT broker not connected' });
      }
      return res.json({ success: true, message: `Set ${deviceId} to ${command.value}`, command });
    } catch (pubErr) {
      console.error('Publish exception on set:', pubErr);
      return res.status(500).json({ error: 'Publish error', details: pubErr.message });
    }

  } catch (error) {
    console.error('Error setting device:', error);
    res.status(500).json({ error: 'Failed to set device' });
  }
});

// GET /api/devices/:houseId/status
// Get latest telemetry from MQTT (stored in memory)
router.get('/:houseId/status', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    // Return latest cached device state (from mqttService)
    const telemetry = getLatestTelemetry(houseId); // object keyed by deviceId (esp32_device_1)
    const espTele = telemetry['esp32_device_1'] || {};

    const devices = {
      den: { state: espTele.devices?.light ? 'on' : 'off', brightness: espTele.devices?.light_brightness ?? null },
      quat: { state: espTele.devices?.fan ? 'on' : 'off', speed: espTele.devices?.fan_speed ?? null },
      dieuHoa: { state: espTele.devices?.ac ? 'on' : 'off', temp: espTele.devices?.ac_temp ?? null },
      camera: { state: espTele.devices?.camera ? 'on' : 'off' }
    };

    res.json({ status: 'ok', mqtt_connected: !!getMQTTClient()?.connected, devices, raw: espTele });

  } catch (error) {
    console.error('Error getting device status:', error);
    res.status(500).json({ error: 'Failed to get device status' });
  }
});

module.exports = router;
