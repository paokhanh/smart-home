const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Đăng ký
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("📥 Register body:", req.body);

    // Kiểm tra trùng email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại!" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin mặc định: email đặc biệt
    const role = email === "admin@smarthome.com" ? "Admin" : "User";

    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    res.json({ success: true, message: "Đăng ký thành công!" });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Email không tồn tại!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Mật khẩu không đúng!" });

    // Tạo token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Lưu token vào cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,     // Đổi thành true khi deploy HTTPS
      sameSite: "lax"
    });

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Lấy user hiện tại
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy user" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Đăng xuất
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Đã đăng xuất" });
});

module.exports = router;
