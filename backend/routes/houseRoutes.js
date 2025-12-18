const express = require("express");
const router = express.Router();
const House = require("../models/House");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const mqttService = require('../services/mqttService');
const mongoose = require("mongoose");
const Device = require("../models/Device");

// Tạo house mới (người dùng đã đăng nhập thành owner)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    console.log("🏠 Creating house for user:", req.user._id);
    console.log("📝 House data:", { name, address });

    // Tạo house mới
    const mqttCode = "house_" + Date.now();

    const house = new House({
      name,
      address,
      mqttCode,
      owners: [req.user._id],
      members: [{ userId: req.user._id, role: "Owner" }]
    });

    console.log("🔍 House object before save:", house);
    await house.save();
    console.log("✅ House created and saved:", house._id);
    console.log("📦 Saved house:", JSON.stringify(house, null, 2));

    // Cập nhật user: thêm house vào danh sách houses
    const updateResult = await User.findByIdAndUpdate(req.user._id, {
      $push: { houses: { houseId: house._id, role: "Owner", default: true } },
      activeHouse: house._id
    });
    console.log("👤 User updated:", updateResult ? "Success" : "Failed");
    // 📡 Gửi mqttCode xuống ESP32 sau khi house được tạo
    try {
      const topic = `device/esp32_device_1/config/bind`;
      // send a bind message the firmware understands (retain so device gets it on connect)
      const payloadObj = { type: 'bind_house', houseId: house.mqttCode };
      const payload = JSON.stringify(payloadObj);

      mqttService.publish(topic, payloadObj, { retain: true });
      console.log("📤 Sent retained bind config to ESP32:", payload);

    } catch (err) {
      console.error("❌ Failed to send MQTT config to ESP32:", err);
    }
    res.json(house);
  } catch (err) {
    console.error("❌ Error creating house:", err);
    console.error("Stack:", err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách houses mà user là member/owner (populate owners & members.userId)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const houses = await House.find({ "members.userId": req.user._id })
      .populate('owners', 'name email')
      .populate('members.userId', 'name email')
      .lean();
    res.json(houses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy chi tiết một house (populate owners & members.userId)
router.get("/:houseId", authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const house = await House.findById(houseId)
      .populate('owners', 'name email')
      .populate('members.userId', 'name email');
    if (!house) return res.status(404).json({ message: "House not found" });

    // Kiểm tra xem user có phải là member
    if (!house.members.some(m => m.userId._id ? m.userId._id.equals(req.user._id) : m.userId.equals(req.user._id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(house);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cập nhật house
router.put("/:houseId", authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const { name, address } = req.body;

    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: "House not found" });

    // Kiểm tra quyền owner
    if (!house.owners.some(id => id.equals(req.user._id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    house.name = name || house.name;
    house.address = address || house.address;
    await house.save();

    res.json(house);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xóa house
router.delete("/:houseId", authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: "House not found" });

    // Kiểm tra quyền owner
    if (!house.owners.some(id => id.equals(req.user._id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Xóa house khỏi tất cả users
    await User.updateMany(
      {},
      { $pull: { houses: { houseId } } }
    );

    await House.deleteOne({ _id: houseId });

    res.json({ message: "House deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cập nhật quyền thiết bị của thành viên
router.put("/:houseId/members/:memberId/permissions", authMiddleware, async (req, res) => {
  try {
    const { houseId, memberId } = req.params;
    const { fullAccess, deviceIds } = req.body;

    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: "House not found" });

    // Kiểm tra quyền owner
    if (!house.owners.some(id => id.equals(req.user._id))) {
      console.log("❌ User not owner of this house");
      return res.status(403).json({ message: "You must be a house owner to edit member permissions" });
    }

    // Tìm member cần cập nhật
    const memberIndex = house.members.findIndex(m => m.userId.equals(memberId));
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in this house" });
    }

    const member = house.members[memberIndex];

    // Cập nhật quyền
    if (fullAccess === true) {
      member.canControlDevices = true;
      member.devicePermissions = [];
    } else if (Array.isArray(deviceIds)) {
      member.canControlDevices = false;
      member.devicePermissions = deviceIds.map(did => ({ deviceId: String(did), canControl: true }));
    }

    await house.save();
    console.log("✅ Member permissions updated successfully");
    res.json({ message: "Permissions updated", member: house.members[memberIndex] });
  } catch (err) {
    console.error("❌ Error updating member permissions:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Mời user (nếu tồn tại) vào house (chỉ owner)
router.post("/:houseId/invite", authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const { email, role = "Member" } = req.body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log("❌ Missing or invalid email");
      return res.status(400).json({ message: "Email is required and must be a valid string" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    console.log("📧 Invite request - houseId:", houseId, "email:", trimmedEmail, "role:", role);

    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: "House not found" });

    // kiểm tra quyền owner
    if (!house.owners.some(id => id.equals(req.user._id))) {
      console.log("❌ User not owner of this house");
      return res.status(403).json({ message: "You must be a house owner to invite members" });
    }

    // Server-side safety: only site Admins can invite/promote someone to Owner.
    // Prevent accidental elevation by Owners.
    if (role === 'Owner' && req.user.role !== 'Admin') {
      console.log(`❌ Forbidden: non-Admin (${req.user.email}) attempted to invite Owner`);
      return res.status(403).json({ message: "Only Admin can assign Owner role" });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log("❌ User with email", trimmedEmail, "not found");
      return res.status(404).json({ message: "User with this email not found. Please make sure they are registered." });
    }

    // tránh duplicate
    if (house.members.some(m => m.userId.equals(user._id))) {
      console.log("❌ User already member");
      return res.status(400).json({ message: "User is already a member of this house" });
    }

    // Build member object with device permissions support
    const memberObj = { userId: user._id, role };

    // If caller wants full access, set canControlDevices = true
    if (req.body.fullAccess) {
      memberObj.canControlDevices = true;
    } else if (Array.isArray(req.body.deviceIds) && req.body.deviceIds.length) {
      // Otherwise, set per-device permissions (store device ids as strings)
      memberObj.canControlDevices = false;
      memberObj.devicePermissions = req.body.deviceIds.map(did => ({ deviceId: String(did), canControl: true }));
    } else {
      // Default: no device access
      memberObj.canControlDevices = false;
      memberObj.devicePermissions = [];
    }

    house.members.push(memberObj);
    if (role === "Owner") house.owners.push(user._id);
    await house.save();

    user.houses = user.houses || [];
    user.houses.push({ houseId: house._id, role });
    await user.save();

    console.log("✅ User invited successfully");
    res.json({ message: "User added to house successfully" });
  } catch (err) {
    console.error("❌ Error inviting user:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Bind House (Gửi lại lệnh bind cho ESP32 + Đồng bộ lại cấu hình thiết bị)
router.post("/:houseId/bind", authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: "House not found" });

    // Kiểm tra quyền owner
    if (!house.owners.some(id => id.equals(req.user._id))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // 1. Gửi bind message
    const bindTopic = `device/esp32_device_1/config/bind`;
    const bindPayload = { type: 'bind_house', houseId: house.mqttCode };

    // Retain = true để đảm bảo firmware nhận được khi connect
    const ok = mqttService.publish(bindTopic, bindPayload, { retain: true });

    if (ok) {
      console.log("📤 Sent bind config:", bindPayload);

      // 2. Gửi lại config cho TOÀN BỘ thiết bị trong nhà (để firmware học lại)
      const devices = await Device.find({ houseId: house._id });
      console.log(`🔄 Resyncing ${devices.length} devices for house ${house.name}`);

      for (const device of devices) {
        const configTopic = `device/esp32_device_1/config/add_device/${device.hardwareId}`;
        const configPayload = {
          type: 'add_device',
          device: {
            hardwareId: device.hardwareId,
            type: device.type,
            pin: device.pin,
            name: device.name
          },
          houseId: house.mqttCode
        };
        // Retain = true để đảm bảo firmware nhận được khi connect
        mqttService.publish(configTopic, configPayload, { retain: true });
        console.log(`   👉 Resent config for ${device.hardwareId}`);
      }

      res.json({
        message: `Sync command sent. Re-bound house and synced ${devices.length} devices.`,
        houseId: house.mqttCode,
        syncedDevices: devices.length
      });
    } else {
      res.status(503).json({ message: "MQTT not connected" });
    }

  } catch (err) {
    console.error("❌ Error binding house:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;