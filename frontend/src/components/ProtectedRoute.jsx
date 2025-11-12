import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import TuChoiUser from './TuChoiUser';

const ProtectedRoute = ({ children, role = null }) => {
  const location = useLocation();
  const user = localStorage.getItem('user');
  const parsedUser = user ? JSON.parse(user) : null;

  // Nếu chưa login, redirect về đăng nhập và lưu route hiện tại
  if (!parsedUser) {
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/dangnhap" replace />;
  }

  // Nếu cần role cụ thể
  if (role) {
    if (Array.isArray(role)) {
      if (!role.map(r => r.toLowerCase()).includes(parsedUser.role.toLowerCase())) {
        return <TuChoiUser />;
      }
    } else {
      if (parsedUser.role.toLowerCase() !== role.toLowerCase()) {
        return <TuChoiUser />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
