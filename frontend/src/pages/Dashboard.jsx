import React, { useState } from 'react';
import Card from '../components/Card'; // Component Card có sẵn
import ProtectedRoute from '../components/ProtectedRoute'; // Bảo vệ route
import './dashboard.css'; // Styles có sẵn (giả sử có)

const Dashboard = () => {
  // State cho từng thiết bị (mock data, có thể thay bằng API call)
  const [devices, setDevices] = useState({
    den: { isOn: false },
    quat: { isOn: false, speed: 0 }, // Tốc độ 0-5
    dieuHoa: { isOn: false, temp: 24 }, // Nhiệt độ 16-30
    camera: { isOn: false },
  });

  // Hàm toggle thiết bị
  const toggleDevice = (deviceKey) => {
    setDevices((prev) => ({
      ...prev,
      [deviceKey]: { ...prev[deviceKey], isOn: !prev[deviceKey].isOn },
    }));
  };

  // Hàm cập nhật giá trị (cho slider)
  const updateValue = (deviceKey, key, value) => {
    setDevices((prev) => ({
      ...prev,
      [deviceKey]: { ...prev[deviceKey], [key]: value },
    }));
  };

  // Hàm xem camera (placeholder)
  const viewCamera = () => {
    if (devices.camera.isOn) {
      alert('Mở stream camera (placeholder: có thể mở modal hoặc link)');
    } else {
      alert('Camera đang tắt!');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Owner', 'User']}>
      <div className="dashboard-container">
        <h1>Smart Home Dashboard</h1>
        <div className="devices-grid">
          {/* Đèn */}
          <Card title="Đèn" className="device-card">
            <div className="device-content">
              <i className={`fas fa-lightbulb ${devices.den.isOn ? 'on' : 'off'}`}></i>
              <p>Trạng thái: {devices.den.isOn ? 'Bật' : 'Tắt'}</p>
              <button
                className={`btn-toggle ${devices.den.isOn ? 'on' : 'off'}`}
                onClick={() => toggleDevice('den')}
              >
                {devices.den.isOn ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </Card>

          {/* Quạt */}
          <Card title="Quạt" className="device-card">
            <div className="device-content">
              <i className={`fas fa-fan ${devices.quat.isOn ? 'on' : 'off'}`}></i>
              <p>Trạng thái: {devices.quat.isOn ? 'Bật' : 'Tắt'}</p>
              <p>Tốc độ: {devices.quat.speed}</p>
              <input
                type="range"
                min="0"
                max="5"
                value={devices.quat.speed}
                onChange={(e) => updateValue('quat', 'speed', parseInt(e.target.value))}
                disabled={!devices.quat.isOn}
              />
              <button
                className={`btn-toggle ${devices.quat.isOn ? 'on' : 'off'}`}
                onClick={() => toggleDevice('quat')}
              >
                {devices.quat.isOn ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </Card>

          {/* Điều hòa */}
          <Card title="Điều hòa" className="device-card">
            <div className="device-content">
              <i className={`fas fa-snowflake ${devices.dieuHoa.isOn ? 'on' : 'off'}`}></i>
              <p>Trạng thái: {devices.dieuHoa.isOn ? 'Bật' : 'Tắt'}</p>
              <p>Nhiệt độ: {devices.dieuHoa.temp}°C</p>
              <input
                type="range"
                min="16"
                max="30"
                value={devices.dieuHoa.temp}
                onChange={(e) => updateValue('dieuHoa', 'temp', parseInt(e.target.value))}
                disabled={!devices.dieuHoa.isOn}
              />
              <button
                className={`btn-toggle ${devices.dieuHoa.isOn ? 'on' : 'off'}`}
                onClick={() => {
                  if (!devices.dieuHoa.isOn && window.confirm('Bạn có muốn bật điều hòa?')) {
                    toggleDevice('dieuHoa');
                  } else if (devices.dieuHoa.isOn) {
                    toggleDevice('dieuHoa');
                  }
                }}
              >
                {devices.dieuHoa.isOn ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </Card>

          {/* Camera */}
          <Card title="Camera" className="device-card">
            <div className="device-content">
              <i className={`fas fa-video ${devices.camera.isOn ? 'on' : 'off'}`}></i>
              <p>Trạng thái: {devices.camera.isOn ? 'Bật' : 'Tắt'}</p>
              <button
                className={`btn-toggle ${devices.camera.isOn ? 'on' : 'off'}`}
                onClick={() => toggleDevice('camera')}
              >
                {devices.camera.isOn ? 'Tắt' : 'Bật'}
              </button>
              <button
                className="btn-view"
                onClick={viewCamera}
                disabled={!devices.camera.isOn}
              >
                Xem
              </button>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;