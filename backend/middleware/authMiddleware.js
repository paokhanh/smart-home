  const jwt = require("jsonwebtoken");
  const User = require("../models/User");

  const authMiddleware = async (req, res, next) => {
    // Lấy token từ cookie hoặc Authorization header
    let token = req.cookies?.token;
    
    // Nếu không có trong cookie, lấy từ Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7); // Bỏ "Bearer " để lấy token
      }
    }
    
    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "User không tồn tại" });

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  };

  module.exports = authMiddleware;
