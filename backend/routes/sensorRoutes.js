const express = require('express');
const router = express.Router();
const Sensor = require('../models/Sensor');
const House = require('../models/House');
const authMiddleware = require('../middleware/authMiddleware');

// Helper function: Kiểm tra user có phải Owner/Admin của nhà không
const isOwnerOrAdmin = async (houseId, userId, userRole) => {
  if (userRole === 'Admin') return true;
  
  const house = await House.findById(houseId);
  if (!house) return false;
  
  // Kiểm tra user có trong danh sách owners không
  return house.owners.some(id => id.equals(userId));
};

// PUT /api/sensors/update/:sensorId - Cập nhật cảm biến (chỉ Owner/Admin)
// Đặt route cụ thể trước để tránh conflict với /:houseId
router.put('/update/:sensorId', authMiddleware, async (req, res) => {
  try {
    const { sensorId } = req.params;
    const sensor = await Sensor.findById(sensorId);
    
    if (!sensor) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    
    // Kiểm tra quyền Owner/Admin
    const hasPermission = await isOwnerOrAdmin(sensor.houseId, req.user._id, req.user.role);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Only house owners or admins can update sensors' });
    }
    
    const { name, type, location, mqttKey, unit } = req.body;
    if (name) sensor.name = name;
    if (type) sensor.type = type;
    if (location !== undefined) sensor.location = location;
    if (mqttKey) sensor.mqttKey = mqttKey;
    if (unit !== undefined) sensor.unit = unit;
    
    await sensor.save();
    res.json(sensor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sensors/delete/:sensorId - Xóa cảm biến (chỉ Owner/Admin)
// Đặt route cụ thể trước để tránh conflict với /:houseId
router.delete('/delete/:sensorId', authMiddleware, async (req, res) => {
  try {
    const { sensorId } = req.params;
    const sensor = await Sensor.findById(sensorId);
    
    if (!sensor) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    
    // Kiểm tra quyền Owner/Admin
    const hasPermission = await isOwnerOrAdmin(sensor.houseId, req.user._id, req.user.role);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Only house owners or admins can delete sensors' });
    }
    
    await Sensor.deleteOne({ _id: sensorId });
    res.json({ message: 'Sensor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sensors/:houseId - Lấy danh sách cảm biến của nhà (tất cả member đều xem được)
// Đặt route này sau các route cụ thể
router.get('/:houseId', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const house = await House.findById(houseId);
    
    if (!house) {
      return res.status(404).json({ error: 'House not found' });
    }
    
    // Kiểm tra user có phải là member của nhà không
    const isMember = house.members.some(m => {
      const memberId = m.userId?._id || m.userId;
      return memberId.equals(req.user._id);
    }) || house.owners.some(id => id.equals(req.user._id));
    
    if (!isMember && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'You are not a member of this house' });
    }
    
    const sensors = await Sensor.find({ houseId });
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sensors/:houseId/add - Thêm cảm biến mới (chỉ Owner/Admin)
router.post('/:houseId/add', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const { name, type, location, mqttKey, unit } = req.body;
    
    // Kiểm tra quyền Owner/Admin
    const hasPermission = await isOwnerOrAdmin(houseId, req.user._id, req.user.role);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Only house owners or admins can add sensors' });
    }
    
    const newSensor = new Sensor({
      name, type, location, mqttKey, unit,
      houseId: houseId
    });
    await newSensor.save();
    res.json(newSensor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;