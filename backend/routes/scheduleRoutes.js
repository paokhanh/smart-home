const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/schedules/:houseId
// Lấy tất cả lịch trong 1 nhà
router.get('/:houseId', authMiddleware, async (req, res) => {
  try {
    const schedules = await Schedule.find({ houseId: req.params.houseId })
      .populate("deviceId", "name type"); // Lấy thêm tên và loại thiết bị
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching schedules" });
  }
});

// POST /api/schedules/:houseId
// Thêm lịch mới
router.post('/:houseId', authMiddleware, async (req, res) => {
  try {
    const { deviceId, startTime, endTime, days, action, isActive } = req.body;
    
    const newSched = new Schedule({
      houseId: req.params.houseId,
      deviceId,
      startTime, // VD: "07:00"
      endTime,   // VD: "08:00" (nếu có khoảng thời gian)
      days,      // VD: [1, 2, 3, 4, 5] (Thứ 2-6)
      action,    // VD: "ON" hoặc "OFF"
      isActive: isActive !== undefined ? isActive : true
    });

    await newSched.save();
    res.json({ message: "Schedule created", schedule: newSched });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Cannot create schedule", details: err.message });
  }
});

// DELETE /api/schedules/:scheduleId
// Xóa lịch
router.delete('/:scheduleId', authMiddleware, async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.scheduleId);
    if (!deleted) return res.status(404).json({ error: "Schedule not found" });
    res.json({ message: "Schedule deleted" });
  } catch (err) {
    res.status(400).json({ error: "Cannot delete schedule" });
  }
});

// PUT /api/schedules/:scheduleId
// Cập nhật lịch
router.put('/:scheduleId', authMiddleware, async (req, res) => {
  try {
    const updated = await Schedule.findByIdAndUpdate(
      req.params.scheduleId,
      req.body,
      { new: true } // Trả về object sau khi update
    );
    if (!updated) return res.status(404).json({ error: "Schedule not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Cannot update schedule" });
  }
});

module.exports = router;