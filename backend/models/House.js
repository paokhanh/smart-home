const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["Owner", "Member"], default: "Member" },
  canControlDevices: { type: Boolean, default: true },
  // Optional per-device permissions. If present, it's an array of objects defining which devices
  // the member can control. If empty or absent and canControlDevices === true, member has full access.
  devicePermissions: [
    {
      // deviceId is stored as a string key for devices (e.g. 'dieuHoa', 'den'),
      // because devices may be represented by simple keys in the frontend.
      // If devices later become their own collection, this can be migrated
      // to ObjectId and the ref updated accordingly.
      deviceId: { type: String },
      canControl: { type: Boolean, default: true }
    }
  ]
}, { _id: false });

const houseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  mqttCode: { type: String, required: true, unique: true },
  owners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  members: [memberSchema],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

houseSchema.index({ "members.userId": 1 });
houseSchema.index({ owners: 1 });

module.exports = mongoose.model("House", houseSchema);