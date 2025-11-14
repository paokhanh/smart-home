import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import HouseSelector from '../components/HouseSelector';
import ProtectedRoute from '../components/ProtectedRoute';
import { getCurrentUser } from '../services/authService';
import { getHouseById } from '../services/houseService';
import { toggleDevice as apiToggleDevice, setDeviceValue as apiSetDeviceValue } from '../services/deviceService';
import './dashboard.css';

const Dashboard = () => {
  const [currentHouse, setCurrentHouse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userHousePermissions, setUserHousePermissions] = useState(null);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  const [devices, setDevices] = useState({
    den: { isOn: false },
    quat: { isOn: false, speed: 0 },
    dieuHoa: { isOn: false, temp: 24 },
    camera: { isOn: false },
  });

  const deviceMap = {
    den: { name: 'Đèn', icon: 'fa-lightbulb' },
    quat: { name: 'Quạt', icon: 'fa-fan' },
    dieuHoa: { name: 'Điều hòa', icon: 'fa-snowflake' },
    camera: { name: 'Camera', icon: 'fa-video' },
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Error loading user:", err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (currentHouse && currentUser) {
      loadHousePermissions();
    }
  }, [currentHouse, currentUser]);

  const loadHousePermissions = async () => {
    try {
      const houseDetails = await getHouseById(currentHouse._id);
      // Find current user's member record in this house
      const userMember = houseDetails.members?.find(m => {
        const userId = m.userId?._id || m.userId;
        return userId === currentUser._id || userId?.equals?.(currentUser._id);
      });
      setUserHousePermissions(userMember);
    } catch (err) {
      console.error("Error loading house permissions:", err);
      setUserHousePermissions(null);
    }
  };

  // Check if user can control a device
  const canControlDevice = (deviceId) => {
    if (!userHousePermissions) return false;
    
    // Owner or full access members can control all devices
    if (userHousePermissions.canControlDevices === true) return true;
    
    // Check per-device permissions
    if (Array.isArray(userHousePermissions.devicePermissions)) {
      return userHousePermissions.devicePermissions.some(
        perm => perm.deviceId === deviceId && perm.canControl === true
      );
    }
    
    return false;
  };

  // Get list of devices user can control
  const getAccessibleDevices = () => {
    return Object.keys(devices).filter(deviceId => canControlDevice(deviceId));
  };

  // Toggle device via API
  const toggleDevice = async (deviceKey) => {
    if (!canControlDevice(deviceKey)) {
      setError('Bạn không có quyền điều khiển thiết bị này');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [deviceKey]: true }));
      setError(null);
      
      await apiToggleDevice(currentHouse._id, deviceKey);
      
      // Update local state optimistically
      setDevices((prev) => ({
        ...prev,
        [deviceKey]: { ...prev[deviceKey], isOn: !prev[deviceKey].isOn },
      }));
    } catch (err) {
      console.error('Error toggling device:', err);
      setError('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(prev => ({ ...prev, [deviceKey]: false }));
    }
  };

  // Update device value via API
  const updateValue = async (deviceKey, key, value) => {
    if (!canControlDevice(deviceKey)) {
      setError('Bạn không có quyền điều khiển thiết bị này');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [deviceKey]: true }));
      setError(null);
      
      await apiSetDeviceValue(currentHouse._id, deviceKey, value);
      
      // Update local state optimistically
      setDevices((prev) => ({
        ...prev,
        [deviceKey]: { ...prev[deviceKey], [key]: value },
      }));
    } catch (err) {
      console.error('Error updating device:', err);
      setError('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(prev => ({ ...prev, [deviceKey]: false }));
    }
  };

  // Hàm xem camera (placeholder)
  const viewCamera = () => {
    if (!canControlDevice('camera')) {
      alert('Bạn không có quyền xem camera');
      return;
    }
    if (devices.camera.isOn) {
      alert('Mở stream camera (placeholder: có thể mở modal hoặc link)');
    } else {
      alert('Camera đang tắt!');
    }
  };

  const accessibleDevices = getAccessibleDevices();

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Owner', 'User']}>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Smart Home Dashboard</h1>
          <HouseSelector onHouseChange={setCurrentHouse} currentHouseId={null} />
        </div>
        
        {error && (
          <div className="error-message" style={{background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '15px'}}>
            {error}
          </div>
        )}

        {currentHouse && (
          <div className="house-info-bar">
            <span>{currentHouse.name}</span>
            {currentHouse.address && <span>📍 {currentHouse.address}</span>}
            {userHousePermissions && (
              <span className="permission-badge">
                {userHousePermissions.canControlDevices ? '🔓 Toàn quyền' : `🔒 ${accessibleDevices.length} thiết bị`}
              </span>
            )}
          </div>
        )}

        {accessibleDevices.length === 0 && currentHouse && (
          <div className="no-permission-message">
            <p>⚠️ Bạn không có quyền điều khiển thiết bị nào trong nhà này.</p>
            <p>Vui lòng liên hệ chủ nhà để được cấp quyền.</p>
          </div>
        )}

        <div className="devices-grid">
          {/* Đèn */}
          {accessibleDevices.includes('den') && (
            <Card title={deviceMap.den.name} className="device-card">
              <div className="device-content">
                <i className={`fas ${deviceMap.den.icon} ${devices.den.isOn ? 'on' : 'off'}`}></i>
                <p>Trạng thái: {devices.den.isOn ? 'Bật' : 'Tắt'}</p>
                <button
                  className={`btn-toggle ${devices.den.isOn ? 'on' : 'off'}`}
                  onClick={() => toggleDevice('den')}
                  disabled={loading.den}
                >
                  {loading.den ? '⏳...' : (devices.den.isOn ? 'Tắt' : 'Bật')}
                </button>
              </div>
            </Card>
          )}

          {/* Quạt */}
          {accessibleDevices.includes('quat') && (
            <Card title={deviceMap.quat.name} className="device-card">
              <div className="device-content">
                <i className={`fas ${deviceMap.quat.icon} ${devices.quat.isOn ? 'on' : 'off'}`}></i>
                <p>Trạng thái: {devices.quat.isOn ? 'Bật' : 'Tắt'}</p>
                <p>Tốc độ: {devices.quat.speed}</p>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={devices.quat.speed}
                  onChange={(e) => updateValue('quat', 'speed', parseInt(e.target.value))}
                  disabled={!devices.quat.isOn || loading.quat}
                />
                <button
                  className={`btn-toggle ${devices.quat.isOn ? 'on' : 'off'}`}
                  onClick={() => toggleDevice('quat')}
                  disabled={loading.quat}
                >
                  {loading.quat ? '⏳...' : (devices.quat.isOn ? 'Tắt' : 'Bật')}
                </button>
              </div>
            </Card>
          )}

          {/* Điều hòa */}
          {accessibleDevices.includes('dieuHoa') && (
            <Card title={deviceMap.dieuHoa.name} className="device-card">
              <div className="device-content">
                <i className={`fas ${deviceMap.dieuHoa.icon} ${devices.dieuHoa.isOn ? 'on' : 'off'}`}></i>
                <p>Trạng thái: {devices.dieuHoa.isOn ? 'Bật' : 'Tắt'}</p>
                <p>Nhiệt độ: {devices.dieuHoa.temp}°C</p>
                <input
                  type="range"
                  min="16"
                  max="30"
                  value={devices.dieuHoa.temp}
                  onChange={(e) => updateValue('dieuHoa', 'temp', parseInt(e.target.value))}
                  disabled={!devices.dieuHoa.isOn || loading.dieuHoa}
                />
                <button
                  className={`btn-toggle ${devices.dieuHoa.isOn ? 'on' : 'off'}`}
                  onClick={() => toggleDevice('dieuHoa')}
                  disabled={loading.dieuHoa}
                >
                  {loading.dieuHoa ? '⏳...' : (devices.dieuHoa.isOn ? 'Tắt' : 'Bật')}
                </button>
              </div>
            </Card>
          )}

          {/* Camera */}
          {accessibleDevices.includes('camera') && (
            <Card title={deviceMap.camera.name} className="device-card">
              <div className="device-content">
                <i className={`fas ${deviceMap.camera.icon} ${devices.camera.isOn ? 'on' : 'off'}`}></i>
                <p>Trạng thái: {devices.camera.isOn ? 'Bật' : 'Tắt'}</p>
                <button
                  className={`btn-toggle ${devices.camera.isOn ? 'on' : 'off'}`}
                  onClick={() => toggleDevice('camera')}
                  disabled={loading.camera}
                >
                  {loading.camera ? '⏳...' : (devices.camera.isOn ? 'Tắt' : 'Bật')}
                </button>
                <button
                  className="btn-view"
                  onClick={viewCamera}
                  disabled={!devices.camera.isOn || loading.camera}
                >
                  Xem
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;