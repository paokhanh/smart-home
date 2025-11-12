  import React from 'react'
  import { useState } from "react"
  import { useNavigate } from "react-router-dom";
  import { login } from "../services/authService"
  import "./dangnhap.css"

  function DangNhap() {
    // ✅ Thêm state quản lý input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);

      if (data.user) {
        // ✅ Lưu user và token vào localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        // ✅ Redirect sau login
        const redirectPath = localStorage.getItem("redirectAfterLogin") || "/";
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      } else {
        alert(data.message || "Sai email hoặc mật khẩu");
      }
    } catch (error) {
      alert("Không thể kết nối đến server");
    }
  };  
    return (
      <div className="login-page">
        {/* Background image container for smart home theme */}
        <div className="background-image">
          <img src="/background.jpg" alt="Smart Home Background" className="bg-image" />
          <div className="overlay"></div>
        </div>
        
        <div className="login-container">
          {/* Smart home logo or icon */}
          <div className="logo-section">
            <img src="/logo.png" alt="Smart Home Logo" className="logo-image" />
            <h1 className="app-title">Smart Home Control</h1>
          </div>
          
          <h2 className="login-title">Đăng nhập</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <input
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
              <label className="input-label">Email</label>
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
              <label className="input-label">Mật khẩu</label>
            </div>
            <button type="submit" className="login-button">
              Đăng nhập
            </button>
          </form>
          
          {/* Additional smart home related image or icon below form */}
          <div className="footer-image">
            <img src="/footer-login.png" alt="Smart Devices" className="footer-icon" />
            <p className="footer-text">
              Chưa có tài khoản?{" "}
              <a href="/register">Đăng ký</a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  export default DangNhap