const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const House = require('../models/House');
const powerCtrl = require('../controllers/powerStatsController');

// POST /api/power-stats/record
// Backend receives power stats from ESP32 via MQTT bridge
router.get('/:houseId', authMiddleware, powerCtrl.getPowerStats);


module.exports = router;
