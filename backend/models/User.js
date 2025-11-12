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
  devices: [
    {
      deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
      canControl: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
