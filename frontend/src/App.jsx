import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Schedules from './pages/Schedules';
import Users from './pages/Users';
import Settings from './pages/Settings';
import DangNhap from './pages/DangNhap';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';
import DangKy from './pages/DangKy';

function App() {
  const location = useLocation();
  const authPages = ['/dangnhap', '/register'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <div className="app-wrapper ${isAuthPage ? 'auth-page' : 'main-page'}">
      {!isAuthPage && <Navbar />}

      {/* <div className={`main-layout ${isAuthPage ? 'auth-layout' : 'protected-layout'}`}>
        {!isAuthPage && <Sidebar />} */}

        <main className="page-content">
          <Routes>
            {/* Trang đăng nhập */}
            <Route path="/dangnhap" element={<DangNhap />} />
            <Route path="/register" element={<DangKy />} /> 
            {/* Các route sau khi login */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sensors"
              element={
                <ProtectedRoute>
                  <Sensors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules"
              element={
                <ProtectedRoute>
                  <Schedules />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute role={["Admin", "Owner","User"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Nếu route không tồn tại → redirect */}
            <Route
              path="*"
              element={
                <Navigate
                  to={localStorage.getItem('user') ? '/' : '/dangnhap'}
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    // </div>
  );
}

export default App;
