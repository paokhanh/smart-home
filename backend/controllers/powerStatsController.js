const PowerConsumption = require('../models/PowerConsumption');
const Device = require('../models/Device');
// GET /api/power-stats/:houseId?date=2023-10-27&type=daily
exports.getPowerStats = async (req, res) => {
  try {
const { houseId } = req.params;
  const { date, type } = req.query;

  const target = new Date(date || new Date());

  let start, end;
  if (type === "monthly") {
     start = new Date(target.getFullYear(), target.getMonth(), 1);
     end = new Date(target.getFullYear(), target.getMonth() + 1, 0);
  } else {
     start = new Date(target.setHours(0,0,0,0));
     end = new Date(target.setHours(23,59,59,999));
  }

  const stats = await PowerConsumption.find({
      houseId,
      date: { $gte: start, $lte: end }
  });
  
  const devices = await Device.find({ houseId });
  const deviceMap = {};
  devices.forEach((d) => deviceMap[d.hardwareId] = d.name);

  const total = stats.reduce((s, i) => s + i.totalWh, 0);
  // Prepare per-device summary (now includes dieuHoa as a separate device)
  const sums = { den: 0, quat: 0, camera: 0, dieuHoa: 0, others: 0 };
  stats.forEach(i => {
    if (i.deviceId === 'den') sums.den += i.totalWh || 0;
    else if (i.deviceId === 'quat') sums.quat += i.totalWh || 0;
    else if (i.deviceId === 'camera') sums.camera += i.totalWh || 0;
    else if (i.deviceId === 'dieuHoa') sums.dieuHoa += i.totalWh || 0; // AC as a separate device
    else sums.others += i.totalWh || 0;
  });

  // Build response rows (include dieuHoa as a separate row for UI display)
  const rows = stats
    .map(i => ({
      deviceId: i.deviceId,
      deviceName: deviceMap[i.deviceId] || i.deviceId,
      totalWh: i.totalWh,
      timestamp: i.timestamp
    }));

  res.json({
    stats: rows,
    byDevice: {
      den: sums.den,
      quat: sums.quat,
      camera: sums.camera,
      dieuHoa: sums.dieuHoa
    },
    summary: { grandTotal: total }
  });

  } catch (error) {
    console.error("Error fetching power stats:", error);
    res.status(500).json({ error: error.message });
  }
};