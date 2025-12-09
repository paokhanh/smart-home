import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";
import { getCurrentUser } from '../services/authService';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser ] = useState(null);
  const navigate = useNavigate();

  // Lấy user từ localStorage khi component mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const serverUser = await getCurrentUser();
        if (mounted && serverUser) {
          localStorage.setItem('user', JSON.stringify(serverUser));
          setUser(serverUser);
          return;
        }
      } catch (err) {
        // ignore
      }

      const storedUser  = localStorage.getItem("user");
      if (mounted && storedUser ) {
        setUser (JSON.parse(storedUser ));
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Hàm tạo màu nền ngẫu nhiên cho logo chữ cái
  const getRandomColor = (seed) => {
    // Tạo màu dựa trên seed (tên user) để màu không thay đổi mỗi lần render
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser (null);
    navigate("/dangnhap");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <a href="/" className="navbar-logo">
        <img src="/logo-navbar.png" alt="SmartHome Logo" style={{ height: "28px", marginRight: "10px" }} />
        Smart Home
      </a>

      {/* Links */}
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <Link to="/">Trang chủ</Link>
        <Link to="/houses"> Nhà của tôi</Link>
        <Link to="/sensors">Cảm biến</Link>
        <Link to="/device">Thiết bị</Link>
        <Link to="/schedules">Lịch biểu</Link>
        <Link to="/users">Người dùng</Link>
        <Link to="/settings">Cài đặt</Link>
      </div>

      {/* Profile + Menu Toggle */}
      <div className="navbar-profile">
        {user ? (
          <>
            {/* Logo chữ cái đầu tên user */}
            <div
              className="user-logo"
              style={{
                backgroundColor: getRandomColor(user.email || "U"),
                width: 40,
                height: 40,
                borderRadius: "50%",
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: "bold",
                fontSize: "20px",
                userSelect: "none",
                cursor: "default",
                marginRight: "10px",
              }}
              title={user.email}
            >
              {user.email ? user.email.charAt(0).toUpperCase() : "U"}
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/dangnhap" className="login-link">
              Đăng nhập
            </Link>
            <Link to="/register" className="register-link" style={{ marginLeft: 10 }}>
              Đăng ký
            </Link>
          </>
        )}

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>
    </nav>
  );
}

export default Navbar;  