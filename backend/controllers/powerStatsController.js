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
      start = new Date(target.setHours(0, 0, 0, 0));
      end = new Date(target.setHours(23, 59, 59, 999));
    }

    const stats = await PowerConsumption.find({
      houseId,
      timestamp: { $gte: start, $lte: end }
    });

    const devices = await Device.find({ houseId });
    const deviceMap = {};
    devices.forEach((d) => deviceMap[d.hardwareId] = d.name);

    // Build set of valid device IDs.
    // Also apply heuristics on device name/hardwareId to detect type when `type` field is unset.
    const validIds = new Set();
    const typeToLegacy = { light: 'den', fan: 'quat', camera: 'camera', ac: 'dieuHoa', dieuHoa: 'dieuHoa' };
    const typesPresent = {};

    // Helper to detect type by name/hardwareId heuristics
    const detectTypeHints = (d) => {
      const hints = {};
      const name = (d.name || '').toLowerCase();
      const hw = (d.hardwareId || '').toLowerCase();
      if (/den|đèn|light|lamp/.test(name) || /den|light/.test(hw)) hints['light'] = true;
      if (/quat|fan/.test(name) || /quat|fan/.test(hw)) hints['fan'] = true;
      if (/dieuhoa|điều hòa|ac|air/.test(name) || /ac|dieuhoa/.test(hw)) hints['ac'] = true;
      if (/cam|camera/.test(name) || /cam|camera/.test(hw)) hints['camera'] = true;
      return hints;
    };

    devices.forEach(d => {
      if (d.hardwareId) {
        validIds.add(d.hardwareId);
      }
      if (d.type) {
        typesPresent[d.type] = (typesPresent[d.type] || 0) + 1;
      }
      // augment counts with heuristic hints
      const hints = detectTypeHints(d);
      for (const t of Object.keys(hints)) typesPresent[t] = (typesPresent[t] || 0) + 1;
    });

    // Add legacy keys only when there is NO DB device of that type.
    for (const [t, legacy] of Object.entries(typeToLegacy)) {
      if (!typesPresent[t]) validIds.add(legacy);
    }

    // Conservative auto-migration: if there is exactly one DB device of a given type
    // and legacy rows exist, migrate legacy rows to the single device's hardwareId.
    for (const [t, legacy] of Object.entries(typeToLegacy)) {
      const devicesOfType = devices.filter(d => (d.type === t) || (detectTypeHints(d)[t]));
      if (devicesOfType.length === 1) {
        const targetHw = devicesOfType[0].hardwareId;
        const legacyCount = stats.filter(s => s.deviceId === legacy).length;
        if (legacyCount > 0 && targetHw) {
          try {
            const res = await PowerConsumption.updateMany(
              { houseId, deviceId: legacy },
              { $set: { deviceId: targetHw } }
            );
            if (res.matchedCount > 0) {
              console.log(`🔁 Auto-migrated ${res.matchedCount} legacy '${legacy}' rows to device '${targetHw}'`);
              // reflect migration in-memory so filtering below treats them appropriately
              stats.forEach(s => { if (s.deviceId === legacy) s.deviceId = targetHw; });
              validIds.add(targetHw);
            }
          } catch (err) {
            console.error('❌ Error auto-migrating legacy power rows:', err);
          }
        }
      }
    }

    // Debug logs
    // console.log("Stats debug - House:", houseId);
    // console.log("Valid IDs:", Array.from(validIds));

    // Filter out orphan power records
    const orphans = [];
    const filtered = stats.filter(i => {
      // Check if deviceId is in validIds
      if (validIds.has(i.deviceId)) return true;

      // Fallback: If deviceId looks like a custom hardware ID but wasn't in DB, validIds won't have it.
      // But maybe we want to see it as orphan.
      orphans.push(i);
      return false;
    });

    if (orphans.length > 0) {
      console.log(`⚠️ PowerStats: ${orphans.length} orphan records found for house ${houseId}. IDs: ${orphans.map(o => o.deviceId).join(', ')}`);
    }

    const total = filtered.reduce((s, i) => s + i.totalWh, 0);

    // Prepare per-device summary
    const byDevice = {};
    filtered.forEach(i => {
      if (!byDevice[i.deviceId]) byDevice[i.deviceId] = 0;
      byDevice[i.deviceId] += i.totalWh || 0;
    });

    // Build response rows (include dieuHoa as a separate row for UI display)
    const rows = filtered
      .map(i => ({
        deviceId: i.deviceId,
        deviceName: deviceMap[i.deviceId] || i.deviceId,
        totalWh: i.totalWh,
        timestamp: i.timestamp
      }));

    res.json({
      stats: rows,
      byDevice,
      summary: {
        grandTotal: Object.values(byDevice).reduce((a, b) => a + b, 0)
      },
      orphans: orphans.map(o => ({
        deviceId: o.deviceId,
        totalWh: o.totalWh
      }))
    });

  } catch (error) {
    console.error("Error fetching power stats:", error);
    res.status(500).json({ error: error.message });
  }
};