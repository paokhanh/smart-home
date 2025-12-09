const mongoose = require('mongoose');

const SensorSchema = new mongoose.Schema({
  name: { type: String, required: true }, // VD: Cảm biến nhiệt độ
  type: { type: String, required: true }, // VD: temperature, humidity, gas, light, motion
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  location: { type: String }, // VD: Phòng khách
  mqttKey: { type: String, required: true }, // Key để map với dữ liệu trả về từ ESP32 (VD: temperature)
  unit: { type: String }, // VD: °C, %, lux
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sensor', SensorSchema);