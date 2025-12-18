const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { publish } = require('../services/mqttService');
const PowerConsumption = require('../models/PowerConsumption');
const House = require('../models/House');

// POST /api/debug/power/:mqttCode - publish a test power_stats message for given mqttCode
router.post('/power/:mqttCode', authMiddleware, async (req, res) => {
  try {
    const { mqttCode } = req.params;
    const payload = {
      type: 'power_stats',
      light_wh: req.body.light_wh || 0.5,
      fan_wh: req.body.fan_wh || 0,
      ac_wh: req.body.ac_wh || 0,
      camera_wh: req.body.camera_wh || 0,
      total_wh: req.body.total_wh || (req.body.light_wh || 0.5),
      custom: req.body.custom || {}
    };

    const topic = `house/${mqttCode}/device/esp32_device_1/power_stats`;
    publish(topic, payload);
    return res.json({ success: true, topic, payload });
  } catch (err) {
    console.error('Error publishing debug power_stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/debug/power-rows/:houseId - return power rows for a given house (_id)
router.get('/power-rows/:houseId', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const rows = await PowerConsumption.find({ houseId, timestamp: { $gte: start, $lte: end } }).lean();
    res.json({ rows });
  } catch (err) {
    console.error('Error fetching power rows:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/debug/power-rows-by-mqtt/:mqttCode - find house by mqttCode then return its power rows
router.get('/power-rows-by-mqtt/:mqttCode', authMiddleware, async (req, res) => {
  try {
    const { mqttCode } = req.params;
    const house = await House.findOne({ mqttCode });
    if (!house) return res.status(404).json({ error: 'House not found' });
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const rows = await PowerConsumption.find({ houseId: house._id, timestamp: { $gte: start, $lte: end } }).lean();
    res.json({ rows });
  } catch (err) {
    console.error('Error fetching power rows by mqtt:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
