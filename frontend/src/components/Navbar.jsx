import React, { useState } from "react"
import "./navbar.css"

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      {/* Logo */}
      <a href="/" className="navbar-logo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 3l9 8h-3v9h-12v-9h-3l9-8z" />
        </svg>
        Smart Home
      </a>

      {/* Links */}
      <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <a href="#">Trang chủ</a>
        <a href="#">Cảm biến</a>
        <a href="#">Lịch biểu</a>
        <a href="#">Người dùng</a>
        <a href="#">Cài đặt</a>
      </div>

      {/* Profile + Menu Toggle */}
      <div className="navbar-profile">
        <img
          src="https://i.pravatar.cc/40"
          alt="User"
        />
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>
    </nav>
  )
}

export default Navbar
