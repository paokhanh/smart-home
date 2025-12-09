  import React, { useState, useEffect } from 'react';
  import Card from '../components/Card';
  import HouseSelector from '../components/HouseSelector';
  import ProtectedRoute from '../components/ProtectedRoute';
  import { getCurrentUser } from '../services/authService';
  import { getHouseById } from '../services/houseService';
  import { toggleDevice as apiToggleDevice, setDeviceValue as apiSetDeviceValue, getDeviceStatus } from '../services/deviceService';
  import { getSensorsByHouse } from '../services/sensorService';
  import { getPowerStats } from "../services/powerService";
  import './dashboard.css';                 

  const Dashboard = () => {
    const [currentHouse, setCurrentHouse] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userHousePermissions, setUserHousePermissions] = useState(null);
    const [loading, setLoading] = useState({});
    const [error, setError] = useState(null);
    // Khởi tạo trạng thái cảm biến (để hiển thị nhiệt độ phòng)
    const [sensorData, setSensorData] = useState({ temperature: null, humidity: null });
    // Danh sách cảm biến từ database
    const [sensors, setSensors] = useState([]);
    // Giá trị real-time của cảm biến từ MQTT
    const [sensorValues, setSensorValues] = useState({});
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
    const [powerStats, setPowerStats] = useState([]);
//Load thống kê điện năng tiêu thụ
    useEffect(() => {
      if (!currentHouse?._id) return;

      loadPowerStats(); // gọi ngay

      const interval = setInterval(() => {
          loadPowerStats();
      }, 30000); // 20 giây refresh

      return () => clearInterval(interval);
    }, [currentHouse]);


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

    // Load danh sách cảm biến từ database khi chọn nhà
    useEffect(() => {
      if (currentHouse) {
        loadSensors();
      } else {
        setSensors([]);
        setSensorValues({});
      }
    }, [currentHouse]);

    // Load danh sách cảm biến từ database
    const loadSensors = async () => {
      if (!currentHouse) return;
      try {
        const sensorsList = await getSensorsByHouse(currentHouse._id);
        setSensors(sensorsList);
      } catch (err) {
        console.error("Error loading sensors:", err);
        setSensors([]);
      }
    };

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
        
        // // Update local state optimistically
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
    // Hàm Polling chính
    const fetchDeviceStatus = async () => {
      if (!currentHouse) return;

      try {
          const telemetry = await getDeviceStatus(currentHouse._id);
          
          // 1. Cập nhật Trạng thái Thiết bị (Devices)
          setDevices(prev => {
              const newState = { ...prev };

                  // Đèn
                  if (telemetry.devices?.den?.state) {
                    const denState = telemetry.devices.den.state === 'on';
                    if (denState !== prev.den.isOn) {
                      newState.den.isOn = denState;
                    }
                  }

                  // Quạt
                  if (telemetry.devices?.quat) {
                    const quatState = telemetry.devices.quat.state === 'on';
                    const quatSpeed = telemetry.devices.quat.speed;

                    if (quatState !== prev.quat.isOn) {
                      newState.quat.isOn = quatState;
                    }
                    if (quatSpeed !== undefined && quatSpeed !== prev.quat.speed) {
                      newState.quat.speed = quatSpeed;
                    }
                  }

                  // Điều hòa
                  if (telemetry.devices?.dieuHoa) {
                    const acState = telemetry.devices.dieuHoa.state === 'on';
                    const acTemp = telemetry.devices.dieuHoa.temp;

                    if (acState !== prev.dieuHoa.isOn) {
                      newState.dieuHoa.isOn = acState;
                    }
                    if (acTemp !== undefined && acTemp !== prev.dieuHoa.temp) {
                      newState.dieuHoa.temp = acTemp;
                    }
                  }

                  // Camera
                  if (telemetry.devices?.camera?.state) {
                    const camState = telemetry.devices.camera.state === 'on';
                    if (camState !== prev.camera.isOn) {
                      newState.camera.isOn = camState;
                    }
                  }

                  return newState;
          });

          // 2. Cập nhật Dữ liệu Cảm biến (Sensors) từ MQTT
          const newTemp = telemetry.sensors?.temperature;
          const newHum = telemetry.sensors?.humidity;
          if (newTemp !== undefined && newTemp !== null) {
              setSensorData({ temperature: newTemp, humidity: newHum });
          }
          
          // 3. Cập nhật giá trị cảm biến theo mqttKey từ database
          if (telemetry.sensors) {
            setSensorValues(telemetry.sensors);
          }
          
      } catch (err) {
          console.error("Error fetching device status:", err);
      }
    };

    // Hàm hiển thị giá trị cảm biến
    const getSensorDisplayValue = (sensor) => {
      const val = sensorValues[sensor.mqttKey];
      if (val === undefined || val === null) return "---";
      
      if (sensor.type === 'motion') return val ? "Phát hiện chuyển động" : "Không có chuyển động";
      if (sensor.type === 'gas') return val > 1000 ? "Cảnh báo rò rỉ!" : "An toàn";
      
      return `${val} ${sensor.unit || ''}`;
    };

    // Icon cho từng loại cảm biến
    const getSensorIcon = (type) => {
      const icons = {
        temperature: 'fa-thermometer-half',
        humidity: 'fa-tint',
        light: 'fa-sun',
        gas: 'fa-exclamation-triangle',
        motion: 'fa-running',
        other: 'fa-sensor'
      };
      return icons[type] || icons.other;
    };
    //Hàm gọi thống kê tiêu thụ điện
        const loadPowerStats = async () => {
          try {
            const today = new Date().toISOString().slice(0, 10);
            const data = await getPowerStats(currentHouse._id, today, "daily");
            
            console.log("Power Stats Dashboard:", data); // kiểm tra
            setPowerStats(data.stats || []);
          } catch (err) {
            console.error("Lỗi tải tiêu thụ điện:", err);
          }
        };
    // useEffect để gọi polling
    useEffect(() => {
      fetchDeviceStatus(); // Gọi lần đầu ngay lập tức
      
      // // Thiết lập Polling (ví dụ: mỗi 5 giây)
      // const intervalId = setInterval(fetchDeviceStatus, 20000); 

      // // Dọn dẹp interval khi component unmount
      // return () => clearInterval(intervalId);
    }, [currentHouse]); // Chạy lại khi chuyển nhà

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
            <HouseSelector 
                onHouseChange={(house) => {
                    setCurrentHouse(house);

                    // 🔥 Quan trọng: cập nhật MQTT house
                    if (house?.mqttCode) {
                        try {
                            window.mqttService?.setActiveHouse(house.mqttCode);
                            console.log("🔄 MQTT house switched →", house.mqttCode);
                        } catch (err) {
                            console.error("MQTT switch house error:", err);
                        }
                    }
                }}
                currentHouseId={currentHouse?._id}
            />

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

          {/* Section Cảm Biến */}
          {sensors.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
                📊 Cảm Biến
              </h2>
              <div className="devices-grid">
                {sensors.map(sensor => (
                  <Card key={sensor._id} title={sensor.name} className="device-card">
                    <div className="device-content">
                      <i className={`fas ${getSensorIcon(sensor.type)}`} style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                        <strong>Vị trí:</strong> {sensor.location || 'Chưa xác định'}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                        <strong>Loại:</strong> {sensor.type}
                      </p>
                      <p style={{ margin: '10px 0', fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>
                        {getSensorDisplayValue(sensor)}
                      </p>
                      <span className="status-dot online" style={{ marginTop: '10px' }}></span>
                      <span style={{ marginLeft: '5px', fontSize: '12px', color: '#28a745' }}>Online</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
                      {/* Section Thống Kê Điện */}
            {powerStats && powerStats.length > 0 && (
              <div style={{ marginTop: "50px" }}>
                <h2 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "600" }}>
                  ⚡ Điện năng tiêu thụ (Live)
                </h2>

                {/* Tổng điện tiêu thụ */}
                <div
                  className="power-summary"
                  style={{
                    background: "#e3f2fd",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  <h3 style={{ margin: 0, color: "#1565c0" }}>
                    Tổng tiêu thụ
                  </h3>
                  <p style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {powerStats.reduce((t, d) => t + (d.totalWh || 0), 0).toFixed(2)} Wh
                  </p>
                </div>

                {/* Bảng chi tiết */}
                <table className="table power-table" style={{ width: "100%", marginTop: "10px" }}>
                  <thead>
                    <tr style={{ textAlign: "left", background: "#f0f0f0" }}>
                      <th style={{ padding: "10px" }}>Thiết bị</th>
                      <th style={{ padding: "10px" }}>Tiêu thụ (Wh)</th>
                      <th style={{ padding: "10px" }}>Cập nhật cuối</th>
                    </tr>
                  </thead>
                  <tbody>
                    {powerStats.map((p) => (
                      <tr key={p.deviceId}>
                        <td style={{ padding: "10px" }}>
                          {p.deviceName || p.deviceId}
                        </td>
                        <td style={{ padding: "10px", fontWeight: "bold", color: "#2e7d32" }}>
                          {p.totalWh?.toFixed(2) || 0}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {p.timestamp ? new Date(p.timestamp).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

        </div>
      </ProtectedRoute>
    );
  };

  export default Dashboard;