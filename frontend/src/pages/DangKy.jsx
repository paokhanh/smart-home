import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authService'; // gọi API backend
import './dangky.css';

function DangKy() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

     // Xóa thông báo khi người dùng bắt đầu nhập lại
    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (form.password !== form.confirmPassword) {
    alert("Mật khẩu nhập lại không khớp!");
    return;
  }

  try {
    const res = await register(form.name, form.email, form.password);

    if (res.success) {
      // Xóa input
      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      setMessage("Đăng ký thành công! Vui lòng đăng nhập.");

      // Chờ 1.5 giây rồi mới chuyển hướng sang đăng nhập
    setTimeout(() => {
        navigate('/dangnhap');
    }, 5000);
    } else {
      alert(res.message || "Đăng ký thất bại!");
    }
  } catch (error) {
    alert("Lỗi kết nối đến server");
  }
};

  return (
    <div className="register-page">
      <div className="background-image">
        <img src="/background.jpg" alt="background" className="bg-image" />
        <div className="overlay"></div>
      </div>

      <div className="register-container">
        <div className="logo-section">
          <img src="/logo.png" alt="logo" className="logo-image" />
          <h1 className="app-title">Smart Home Control</h1>
        </div>
        <h2 className="register-title">Đăng ký tài khoản</h2>
        
        {message && (
          <div className="message success-message">{message}</div> // Thêm class cho CSS nếu cần style (ví dụ: màu xanh cho success)
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="register-input" 
              placeholder=" " 
              required 
            />
            <label className="input-label">Họ và tên</label>
          </div>

          <div className="input-group">
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              className="register-input" 
              placeholder=" " 
              required 
            />
            <label className="input-label">Email</label>
          </div>

          <div className="input-group">
            <input 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              className="register-input" 
              placeholder=" " 
              required 
            />
            <label className="input-label">Mật khẩu</label>
          </div>

          <div className="input-group">
            <input 
              type="password" 
              name="confirmPassword" 
              value={form.confirmPassword} 
              onChange={handleChange} 
              className="register-input" 
              placeholder=" " 
              required 
            />
            <label className="input-label">Nhập lại mật khẩu</label>
          </div>

          <button type="submit" className="register-button">Đăng ký</button>
        </form>

        <p className="footer-text">
          Đã có tài khoản? <a href="/dangnhap">Đăng nhập</a>
        </p>
      </div>
    </div>
  );
}

export default DangKy;
