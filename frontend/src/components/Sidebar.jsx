import React, { useState } from 'react'
import './sidebar.css'
import { Link, useLocation } from 'react-router-dom';
function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(true); // toggle submenu Smart Home
  const location = useLocation();
  // Ẩn Sidebar trên trang đăng nhập
  if (location.pathname === '/dangnhap' || location.pathname === '/register') {
    return null;
  }
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Header clickable */}
      <h2 onClick={() => setMenuOpen(!menuOpen)}>
        Smart Home
        <span className={`arrow ${menuOpen ? 'down' : 'right'}`}></span>
      </h2>

      {/* Submenu hiển thị khi mở */}
      {menuOpen && (
        <nav>
          <ul>
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
            </li>
            <li>
              <Link to="/sensors" className={location.pathname === '/sensors' ? 'active' : ''}>Devices</Link>
            </li>
            <li>
              <Link to="/schedules" className={location.pathname === '/schedules' ? 'active' : ''}>Scenes</Link>
            </li>
            <li>
              <Link to="/routines" className={location.pathname === '/routines' ? 'active' : ''}>Routines</Link>
            </li>
            <li>
              <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>Settings</Link>
            </li>
          </ul>
        </nav>
      )}
    </aside>
  )
}

export default Sidebar