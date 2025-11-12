const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

// 📌 Lấy danh sách user (chỉ Admin hoặc Owner)
router.get("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "Admin" && req.user.role !== "Owner") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 📌 Tạo user mới (chỉ Admin hoặc Owner)
router.post("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "Admin" && req.user.role !== "Owner") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { name, email, password, role } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email đã tồn tại" });

    // Mã hóa mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 📌 Sửa user
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User không tồn tại" });

    // 🚫 Owner không được sửa Admin
    if (req.user.role === "Owner" && targetUser.role === "Admin") {
      return res.status(403).json({ message: "Owner không thể sửa Admin" });
    }

    // 🚫 User thường không được sửa ai khác ngoài chính mình
    if (req.user.role === "User" && req.user._id.toString() !== targetUser._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền sửa người khác" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 📌 Xoá user
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User không tồn tại" });

    // 🚫 Owner không thể xoá Admin
    if (req.user.role === "Owner" && targetUser.role === "Admin") {
      return res.status(403).json({ message: "Owner không thể xoá Admin" });
    }

    // 🚫 User thường không thể xoá ai
    if (req.user.role === "User") {
      return res.status(403).json({ message: "User không có quyền xoá" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Xoá thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
