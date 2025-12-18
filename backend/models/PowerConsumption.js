const mongoose = require('mongoose');

const powerConsumptionSchema = new mongoose.Schema({
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  lightWh: {
    type: Number,
    default: 0
  },
  fanWh: {
    type: Number,
    default: 0
  },
  cameraWh: {
    type: Number,
    default: 0
  },
  totalWh: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  date: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now;
    }
  }
});

// Index for efficient queries
powerConsumptionSchema.index({ houseId: 1, date: -1 });
powerConsumptionSchema.index({ houseId: 1, deviceId: 1, date: -1 });

module.exports = mongoose.model('PowerConsumption', powerConsumptionSchema);
