const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  action: { type: String, required: true }, // ON/OFF/set
  value: { type: mongoose.Schema.Types.Mixed },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  repeat: { type: String, enum: ['none','daily','weekly'], default: 'none' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
