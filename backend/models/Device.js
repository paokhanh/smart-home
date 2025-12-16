const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hardwareId: { type: String, required: true, unique: true },
  type: { type: String, default: 'socket' }, // socket, sensor, camera, etc
  location: { type: String }, // Vị trí: Phòng khách, Phòng ngủ, Sân vườn, etc.
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, default: 'offline' }, // online/offline
  telemetry: { type: Object, default: {} },
  mqttTopicSet: { type: String }, // e.g. devices/SOCK_998877/set
  pin: { type: Number }, // Optional pin number on ESP32 for direct control
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
