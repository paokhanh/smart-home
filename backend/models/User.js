const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["Admin", "Owner", "User"], 
    default: "User" 
  },
  houses: [
    {
      houseId: { type: mongoose.Schema.Types.ObjectId, ref: "House" },
      role: { type: String, enum: ["Owner", "Member"], default: "Member" },
      default: { type: Boolean, default: false }
    }
  ],
  activeHouse: { type: mongoose.Schema.Types.ObjectId, ref: "House" },
  devices: [
    {
      deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
      canControl: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
