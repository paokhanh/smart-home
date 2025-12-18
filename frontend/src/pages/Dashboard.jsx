import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import HouseSelector from '../components/HouseSelector';
import ProtectedRoute from '../components/ProtectedRoute';
import { getCurrentUser } from '../services/authService';
import { getHouseById } from '../services/houseService';
import { getDevicesByHouse, toggleDevice as apiToggleDevice, setDeviceValue as apiSetDeviceValue, getDeviceStatus, controlDevice } from '../services/deviceService';
import { getSensorsByHouse } from '../services/sensorService';
import { getPowerStats } from "../services/powerService";
import './dashboard.css';
import DeviceRenderer from '../components/DeviceRenderer';
// import { getDevicesByHouse } from '../../../backend/controllers/deviceController';
const Dashboard = () => {
  const [currentHouse, setCurrentHouse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userHousePermissions, setUserHousePermissions] = useState(null);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  // Danh sách cảm biến từ database
  const [sensors, setSensors] = useState([]);
  // Giá trị real-time của cảm biến từ MQTT
  const [sensorValues, setSensorValues] = useState({});
  // State tạm thời để lưu giá trị slider khi đang kéo (tránh gửi API liên tục)
  const [sliderValues, setSliderValues] = useState({});
  // Trạng thái thiết bị cố định
  const [fixedDevices, setFixedDevices] = useState({
    den: { isOn: false },
    quat: { isOn: false, speed: 0 },
    dieuHoa: { isOn: false, temp: 24 },
    camera: { isOn: false }
  });

  const deviceMap = {
    den: { name: 'Đèn', icon: 'fa-lightbulb' },
    quat: { name: 'Quạt', icon: 'fa-fan' },
    dieuHoa: { name: 'Điều hòa', icon: 'fa-snowflake' },
    camera: { name: 'Camera', icon: 'fa-video' },
  };

  // Custom devices persisted in DB (created from Device page)
  const [customDevices, setCustomDevices] = useState([]);
  const [powerStats, setPowerStats] = useState([]);
  const [orphanPower, setOrphanPower] = useState([]);
  const validPowerStats = React.useMemo(() => {
    // Show both:
    // - custom devices (hardwareId)
    // - fixed/legacy device keys published by ESP32 (den/quat/dieuHoa/camera)
    const validIds = new Set([
      ...customDevices.map(d => d.hardwareId),
      'den',
      'quat',
      'dieuHoa',
      'camera'
    ]);

    // Filter AND Deduplicate powerStats
    // If backend returns duplicates (e.g. multiple entries for 'den_o_nha'), 
    // we only keep the last one or sum them. For safety, we uniq by deviceId.
    const uniqueStats = [];
    const seenMap = new Set();

    (powerStats || []).forEach(p => {
      if (!validIds.has(p.deviceId)) return; // not valid

      // If duplicate, skip (or could sum totalWh if that was better logic, 
      // but simpler to just show one row to avoid crash)
      if (seenMap.has(p.deviceId)) return;

      seenMap.add(p.deviceId);
      uniqueStats.push(p);
    });

    return uniqueStats;
  }, [powerStats, customDevices]);
  // Load custom devices for the selected house
  useEffect(() => {
    if (!currentHouse) return;
    getDevicesByHouse(currentHouse._id)
      .then(devs => setCustomDevices(devs))
      .catch(console.error);
  }, [currentHouse]);

  const loadDevices = async () => {
    try {
      const data = await getDevicesByHouse(currentHouse._id);
      setDevices(data);

      // Khởi tạo giá trị slider từ dữ liệu thiết bị (nếu có lưu trong telemetry/value)
      const initialValues = {};
      data.forEach(d => {
        // Giả sử backend trả về giá trị hiện tại trong d.value hoặc d.telemetry
        // Nếu không có, set mặc định
        if (d.type === 'fan') initialValues[d._id] = d.telemetry?.fan_speed || 0;
        if (d.type === 'ac') initialValues[d._id] = d.telemetry?.ac_temp || 24;
      });
      setSliderValues(initialValues);

    } catch (err) { console.error(err); }
  };
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

  // Helpers for custom devices
  const toggleCustomDevice = async (device) => {
    if (!canControlDevice(device._id)) {
      setError('Bạn không có quyền điều khiển thiết bị này');
      return;
    }

    // optimistic UI update
    setCustomDevices(prev => prev.map(d => d._id === device._id ? { ...d, status: d.status === 'online' ? 'offline' : 'online' } : d));

    try {
      setLoading(prev => ({ ...prev, [device._id]: true }));
      // Use controlDevice (deviceId, action, value, houseId)
      await controlDevice(device._id, 'toggle', null, currentHouse._id);
    } catch (err) {
      console.error('Lỗi điều khiển thiết bị:', err);
      setError('Lỗi: ' + (err.response?.data?.error || err.message));
      // revert optimistic update
      setCustomDevices(prev => prev.map(d => d._id === device._id ? { ...d, status: device.status } : d));
    } finally {
      setLoading(prev => ({ ...prev, [device._id]: false }));
    }
  };

  const updateCustomDeviceValue = async (device, key, value) => {
    try {
      setLoading(prev => ({ ...prev, [device._id]: true }));
      setError(null);
      // Use controlDevice for DB devices (custom devices): it publishes to house/<mqttCode>/device/<esp32>/control
      await controlDevice(device._id, 'set', value, currentHouse._id);
      setCustomDevices(prev => prev.map(d => d._id === device._id ? { ...d, value: { ...(d.value || {}), [key]: value } } : d));
    } catch (err) {
      console.error('Error updating custom device:', err);
      setError('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(prev => ({ ...prev, [device._id]: false }));
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

  // Get list of devices user can control (fixed + custom)
  const getAccessibleDevices = () => {
    const fixed = Object.keys(fixedDevices || {}).filter(k => canControlDevice(k));
    const custom = (customDevices || []).filter(d => canControlDevice(String(d._id))).map(d => d._id);
    return [...fixed, ...custom];
  };

  // Toggle fixed device via API
  const toggleDevice = async (deviceKey) => {
    if (!canControlDevice(deviceKey)) {
      setError('Bạn không có quyền điều khiển thiết bị này');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [deviceKey]: true }));
      setError(null);

      // apiToggleDevice(deviceId, houseId)
      await apiToggleDevice(deviceKey, currentHouse._id);

      // Update local state optimistically
      setFixedDevices((prev) => ({
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

  // Update fixed device value via API
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
      setFixedDevices((prev) => ({
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

      // 1. Cập nhật Trạng thái Thiết bị (fixed devices)
      setFixedDevices(prev => {
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

      // 1b. Cập nhật trạng thái custom devices (firmware sẽ publish them keyed by hardwareId)
      if (Array.isArray(telemetry.customDevices) && telemetry.customDevices.length) {
        setCustomDevices(prev => prev.map(d => {
          const found = telemetry.customDevices.find(c => c.id === d.hardwareId);
          if (found) return { ...d, status: found.state === 'on' ? 'online' : 'offline' };
          return d;
        }));
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
      // IMPORTANT: use local date (NOT UTC). toISOString() can shift date by timezone and cause empty stats.
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const data = await getPowerStats(currentHouse._id, today, "daily");

      console.log("Power Stats Dashboard:", data); // kiểm tra
      setPowerStats(data.stats || []);
      setOrphanPower(data.orphans || []);
    } catch (err) {
      console.error("Lỗi tải tiêu thụ điện:", err);
    }
  };
  // useEffect để gọi polling
  useEffect(() => {
    fetchDeviceStatus(); // Gọi lần đầu ngay lập tức

    // Thiết lập Polling (mỗi 5 giây) để cập nhật trạng thái realtime
    const intervalId = setInterval(fetchDeviceStatus, 5000);

    // Dọn dẹp interval khi component unmount hoặc house thay đổi
    return () => clearInterval(intervalId);
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
  // Xử lý thay đổi Slider (khi thả chuột ra - onMouseUp / onTouchEnd)
  const handleSliderChange = async (device, newValue) => {
    try {
      console.log(`Setting ${device.name} to ${newValue}`);
      // Gửi lệnh set value
      await controlDevice(device._id, 'set', parseInt(newValue), currentHouse._id);

      // Cập nhật state slider
      setSliderValues(prev => ({ ...prev, [device._id]: newValue }));
    } catch (err) {
      console.error("Lỗi chỉnh giá trị:", err);
    }
  };

  // Cập nhật UI khi đang kéo slider
  const onSliderInput = (deviceId, val) => {
    setSliderValues(prev => ({ ...prev, [deviceId]: val }));
  };
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
          <div className="error-message" style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '15px' }}>
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
          {customDevices.map(device => (
            <DeviceRenderer
              key={device._id}
              device={device}
              onToggle={toggleCustomDevice}
              onUpdate={updateCustomDeviceValue}
              loading={loading[device._id]}
            />
          ))}
        </div>


        {/* Section Cảm Biến */}
        {sensors.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📊 Cảm Biến <span style={{ fontSize: '14px', fontWeight: '400', opacity: 0.8 }}>(Realtime)</span>
            </h2>
            <div className="devices-grid">
              {sensors.map(sensor => {
                const val = sensorValues[sensor.mqttKey];
                const hasValue = val !== undefined && val !== null;
                return (
                  <div key={sensor._id} className={`sensor-card ${sensor.type}`}>
                    <div className="sensor-icon-wrapper">
                      <i className={`fas ${getSensorIcon(sensor.type)} sensor-icon`}></i>
                    </div>
                    <div className="sensor-info">
                      <h3>{sensor.name}</h3>
                      <p className="sensor-location">{sensor.location || 'Chưa xác định'}</p>
                    </div>
                    <div className="sensor-value">
                      {hasValue ? (
                        <>
                          <span className="value-number">{val}</span>
                          <span className="value-unit">{sensor.unit}</span>
                        </>
                      ) : (
                        <span className="value-offline">--</span>
                      )}
                    </div>
                    {/* Motion/Gas Warning Overlay if needed */}
                    {sensor.type === 'gas' && val > 1000 && (
                      <div className="sensor-alert">⚠️ Nguy hiểm</div>
                    )}
                    {sensor.type === 'motion' && val && (
                      <div className="sensor-active">Motion Detected</div>
                    )}
                  </div>
                );
              })}
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
                {validPowerStats.reduce((t, d) => t + (d.totalWh || 0), 0).toFixed(2)} Wh
              </p>
            </div>

            {/* Orphan warning */}
            {currentUser?.role == 'Admin' && orphanPower && orphanPower.length > 0 && (
              <div style={{ background: '#fff3cd', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                <strong>⚠️ Dữ liệu mồ côi phát hiện:</strong> {orphanPower.length} mục không khớp với thiết bị hiện tại.
                <div style={{ marginTop: 8 }}>
                  {orphanPower.map(o => (
                    <div key={o.deviceId} style={{ fontSize: 13, color: '#856404' }}>{o.deviceId}: {o.totalWh?.toFixed(3)} Wh</div>
                  ))}
                </div>
              </div>
            )}

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
                {validPowerStats.map((p) => (
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
    </ProtectedRoute >
  );
};

export default Dashboard;