import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from './services/authService';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Schedules from './pages/Schedules';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Houses from './pages/Houses';
import DangNhap from './pages/DangNhap';
import ProtectedRoute from './components/ProtectedRoute';
import Device from './pages/Device';
import './index.css';
import DangKy from './pages/DangKy';
function App() {
  const location = useLocation();
  const authPages = ['/dangnhap', '/register'];
  const isAuthPage = authPages.includes(location.pathname);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Try to sync server user (cookie) into localStorage before rendering routes
    (async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loadingUser) {
    return <div className="loading-container">Đang kiểm tra đăng nhập...</div>;
  }

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
              path="/device"
              element={
                <ProtectedRoute>
                  <Device />
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
            <Route
              path="/houses"
              element={
                <ProtectedRoute role={["Owner", "Admin"]}>
                  <Houses />
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
