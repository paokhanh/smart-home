const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const House = require('../models/House');
const PowerConsumption = require('../models/PowerConsumption');

// POST /api/power-stats/record
// Backend receives power stats from ESP32 via MQTT bridge
router.post('/record', async (req, res) => {
  try {
    const { houseId, deviceId, lightWh, fanWh, cameraWh, totalWh } = req.body;
    
    if (!houseId || !deviceId) {
      return res.status(400).json({ error: 'Missing houseId or deviceId' });
    }

    // Find or create today's record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await PowerConsumption.findOne({
      houseId,
      deviceId,
      date: today
    });

    if (record) {
      // Update existing record
      record.lightWh = (record.lightWh || 0) + (lightWh || 0);
      record.fanWh = (record.fanWh || 0) + (fanWh || 0);
      record.cameraWh = (record.cameraWh || 0) + (cameraWh || 0);
      record.totalWh = record.lightWh + record.fanWh + record.cameraWh;
      record.timestamp = new Date();
    } else {
      // Create new record
      record = new PowerConsumption({
        houseId,
        deviceId,
        lightWh: lightWh || 0,
        fanWh: fanWh || 0,
        cameraWh: cameraWh || 0,
        totalWh: totalWh || 0,
        date: today
      });
    }

    await record.save();
    res.json({ success: true, message: 'Power stats recorded', record });
  } catch (error) {
    console.error('Error recording power stats:', error);
    res.status(500).json({ error: 'Failed to record power stats' });
  }
});

// GET /api/power-stats/:houseId
// Get power consumption stats for a house (all devices, all time)
router.get('/:houseId', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const { startDate, endDate, deviceId } = req.query;

    // Verify user has access to this house
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }

    let query = { houseId };
    
    if (deviceId) {
      query.deviceId = deviceId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const stats = await PowerConsumption.find(query)
      .sort({ date: -1 })
      .limit(90); // Last 90 days

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching power stats:', error);
    res.status(500).json({ error: 'Failed to fetch power stats' });
  }
});

// GET /api/power-stats/:houseId/today
// Get today's power consumption (for dashboard real-time display)
router.get('/:houseId/today', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await PowerConsumption.find({
      houseId,
      date: today
    }).sort({ timestamp: -1 });

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching today power stats:', error);
    res.status(500).json({ error: 'Failed to fetch today power stats' });
  }
});

// GET /api/power-stats/:houseId/summary
// Get summary statistics (daily totals, averages)
router.get('/:houseId/summary', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const stats = await PowerConsumption.aggregate([
      {
        $match: {
          houseId: mongoose.Types.ObjectId(houseId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { date: '$date', deviceId: '$deviceId' },
          totalWh: { $sum: '$totalWh' },
          lightWh: { $sum: '$lightWh' },
          fanWh: { $sum: '$fanWh' },
          cameraWh: { $sum: '$cameraWh' }
        }
      },
      {
        $sort: { '_id.date': -1 }
      }
    ]);

    // Calculate averages
    const totalByDevice = {};
    stats.forEach(stat => {
      const device = stat._id.deviceId;
      if (!totalByDevice[device]) {
        totalByDevice[device] = { totalWh: 0, lightWh: 0, fanWh: 0, cameraWh: 0, count: 0 };
      }
      totalByDevice[device].totalWh += stat.totalWh;
      totalByDevice[device].lightWh += stat.lightWh;
      totalByDevice[device].fanWh += stat.fanWh;
      totalByDevice[device].cameraWh += stat.cameraWh;
      totalByDevice[device].count++;
    });

    const averages = {};
    for (const [device, data] of Object.entries(totalByDevice)) {
      averages[device] = {
        avgDaily: data.totalWh / data.count,
        totalWh: data.totalWh,
        lightWh: data.lightWh,
        fanWh: data.fanWh,
        cameraWh: data.cameraWh
      };
    }

    res.json({ stats, averages, period: days });
  } catch (error) {
    console.error('Error fetching power summary:', error);
    res.status(500).json({ error: 'Failed to fetch power summary' });
  }
});

module.exports = router;
