import React, { useEffect, useState } from "react";
import { getAllHouses, getHouseById } from "../services/houseService";
import { getDeviceStatus } from "../services/deviceService";
import { getSensorsByHouse, addSensor, updateSensor, deleteSensor } from "../services/sensorService";
import { getCurrentUser } from "../services/authService";
import HouseSelector from "../components/HouseSelector";
import "./Sensors.css";

function Sensors() {
  const [sensors, setSensors] = useState([]);
  const [sensorValues, setSensorValues] = useState({});
  const [currentHouse, setCurrentHouse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userHousePermissions, setUserHousePermissions] = useState(null);
  const [canManageSensors, setCanManageSensors] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [newSensor, setNewSensor] = useState({
    name: "",
    type: "temperature",
    location: "",
    mqttKey: "",
    unit: ""
  });

  // 1. Load current user
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

  // 2. Load danh sách nhà
  useEffect(() => {
    const init = async () => {
        try {
            const houses = await getAllHouses();
            if (houses && houses.length > 0) setCurrentHouse(houses[0]);
        } catch (error) {
            console.error("Lỗi lấy danh sách nhà:", error);
        }
    };
    init();
  }, []);

  // 3. Load quyền của user trong nhà
  useEffect(() => {
    if (currentHouse && currentUser) {
      loadHousePermissions();
    }
  }, [currentHouse, currentUser]);

  const loadHousePermissions = async () => {
    try {
      const houseDetails = await getHouseById(currentHouse._id);
      const userMember = houseDetails.members?.find(m => {
        const userId = m.userId?._id || m.userId;
        return userId === currentUser._id || userId?.equals?.(currentUser._id);
      });
      setUserHousePermissions(userMember);
      
      // Kiểm tra quyền quản lý cảm biến: Owner hoặc Admin
      const isOwner = houseDetails.owners?.some(id => {
        const ownerId = id?._id || id;
        return ownerId === currentUser._id || ownerId?.equals?.(currentUser._id);
      });
      const isAdmin = currentUser.role === 'Admin';
      setCanManageSensors(isOwner || isAdmin);
    } catch (err) {
      console.error("Error loading house permissions:", err);
      setUserHousePermissions(null);
      setCanManageSensors(false);
    }
  };

  // 4. Load Sensor Config & Realtime Data
  useEffect(() => {
    if (!currentHouse) return;
    loadSensorsConfig();
    
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, [currentHouse]);

  const loadSensorsConfig = async () => {
    try {
      // SỬ DỤNG SERVICE THAY VÌ API TRỰC TIẾP
      const data = await getSensorsByHouse(currentHouse._id);
      setSensors(data);
    } catch (err) {
      console.error("Lỗi load danh sách cảm biến:", err);
    }
  };

  const fetchSensorData = async () => {
    if (!currentHouse) return;
    try {
        const data = await getDeviceStatus(currentHouse._id);
        if (data && data.sensors) {
            setSensorValues(data.sensors);
        }
    } catch (err) {
        // console.error("Lỗi cập nhật giá trị sensor:", err);
    }
  };

  const getDisplayValue = (sensor) => {
      const val = sensorValues[sensor.mqttKey];
      if (val === undefined || val === null) return "---";
      
      if (sensor.type === 'motion') return val ? "Phát hiện chuyển động" : "Không có chuyển động";
      if (sensor.type === 'gas') return val > 1000 ? "Cảnh báo rò rỉ!" : "An toàn";
      
      return `${val} ${sensor.unit || ''}`;
  };

  // Xử lý Thêm Cảm Biến Mới
  const handleAddSensor = async (e) => {
    e.preventDefault();
    if (!currentHouse || !canManageSensors) {
      alert("Bạn không có quyền thêm cảm biến!");
      return;
    }

    try {
      await addSensor(currentHouse._id, newSensor);
      alert("Thêm cảm biến thành công!");
      setShowModal(false);
      setNewSensor({ name: "", type: "temperature", location: "", mqttKey: "", unit: "" });
      setEditingSensor(null);
      loadSensorsConfig(); 
    } catch (error) {
      console.error("Lỗi thêm cảm biến:", error);
      alert("Thêm thất bại: " + (error.response?.data?.error || error.message));
    }
  };

  // Xử lý Sửa Cảm Biến
  const handleEditSensor = (sensor) => {
    if (!canManageSensors) {
      alert("Bạn không có quyền sửa cảm biến!");
      return;
    }
    setEditingSensor(sensor);
    setNewSensor({
      name: sensor.name,
      type: sensor.type,
      location: sensor.location || "",
      mqttKey: sensor.mqttKey,
      unit: sensor.unit || ""
    });
    setShowModal(true);
  };

  const handleUpdateSensor = async (e) => {
    e.preventDefault();
    if (!editingSensor || !canManageSensors) {
      alert("Bạn không có quyền sửa cảm biến!");
      return;
    }

    try {
      await updateSensor(editingSensor._id, newSensor);
      alert("Cập nhật cảm biến thành công!");
      setShowModal(false);
      setNewSensor({ name: "", type: "temperature", location: "", mqttKey: "", unit: "" });
      setEditingSensor(null);
      loadSensorsConfig();
    } catch (error) {
      console.error("Lỗi cập nhật cảm biến:", error);
      alert("Cập nhật thất bại: " + (error.response?.data?.error || error.message));
    }
  };

  // Xử lý Xóa Cảm Biến
  const handleDeleteSensor = async (sensorId) => {
    if (!canManageSensors) {
      alert("Bạn không có quyền xóa cảm biến!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa cảm biến này?")) {
      return;
    }

    try {
      await deleteSensor(sensorId);
      alert("Xóa cảm biến thành công!");
      loadSensorsConfig();
    } catch (error) {
      console.error("Lỗi xóa cảm biến:", error);
      alert("Xóa thất bại: " + (error.response?.data?.error || error.message));
    }
  };
  // Auto-fill đơn vị và key khi chọn loại
  const handleTypeChange = (e) => {
    const type = e.target.value;
    let suggest = { mqttKey: "", unit: "" };
    
    if (type === 'temperature') suggest = { mqttKey: 'temperature', unit: '°C' };
    else if (type === 'humidity') suggest = { mqttKey: 'humidity', unit: '%' };
    else if (type === 'light') suggest = { mqttKey: 'light_intensity', unit: '%' };
    else if (type === 'gas') suggest = { mqttKey: 'gas_level', unit: 'ppm' };
    else if (type === 'motion') suggest = { mqttKey: 'motion', unit: '' };

    setNewSensor(prev => ({ ...prev, type, ...suggest }));
  };

  return (
    <div className="page sensors-page">
      <div className="header-row">
          <h2>Danh sách cảm biến</h2>
          <HouseSelector onHouseChange={setCurrentHouse} currentHouseId={currentHouse?._id} />
      </div>

      <div className="actions">
          {canManageSensors && (
            <button onClick={() => {
              setEditingSensor(null);
              setNewSensor({ name: "", type: "temperature", location: "", mqttKey: "", unit: "" });
              setShowModal(true);
            }} className="button btn-add">
              + Thêm cảm biến
            </button>
          )}
          {!canManageSensors && (
            <p style={{ color: '#666', fontSize: '14px' }}>
              ⚠️ Chỉ Owner/Admin mới có thể quản lý cảm biến
            </p>
          )}
      </div>

      <table className="table sensor-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Vị trí</th>
            <th>Loại</th>
            <th>Giá trị hiện tại</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {sensors.length > 0 ? (
            sensors.map(s => (
                <tr key={s._id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.location || '-'}</td>
                <td><span className={`badge type-${s.type}`}>{s.type}</span></td>
                <td className="value-cell">
                    {getDisplayValue(s)}
                </td>
                <td>
                  <span className="status-dot online"></span> Online
                  {canManageSensors && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditSensor(s)}
                        style={{ padding: '4px 8px', fontSize: '12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDeleteSensor(s._id)}
                        style={{ padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </td>
                </tr>
            ))
          ) : (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>Chưa có cảm biến nào. {canManageSensors && 'Hãy thêm mới!'}</td></tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingSensor ? 'Sửa Cảm Biến' : 'Thêm Cảm Biến Mới'}</h3>
            <form onSubmit={editingSensor ? handleUpdateSensor : handleAddSensor}>
              <div className="form-group">
                <label>Tên hiển thị:</label>
                <input 
                  required 
                  placeholder="VD: Nhiệt độ phòng khách"
                  value={newSensor.name} 
                  onChange={e => setNewSensor({...newSensor, name: e.target.value})} 
                />
              </div>
              
              <div className="form-group sensor-type-group">
                <label>Loại cảm biến:</label>
                <select className="sensor-type-select" value={newSensor.type} onChange={handleTypeChange}>
                  <option value="temperature">Nhiệt độ (Temperature)</option>
                  <option value="humidity">Độ ẩm (Humidity)</option>
                  <option value="light">Ánh sáng (Light)</option>
                  <option value="gas">Khí Gas</option>
                  <option value="motion">Chuyển động (PIR)</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Vị trí:</label>
                <input 
                  placeholder="VD: Phòng ngủ"
                  value={newSensor.location} 
                  onChange={e => setNewSensor({...newSensor, location: e.target.value})} 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                    <label>MQTT Key (trong code ESP32):</label>
                    <input 
                      required 
                      placeholder="temperature"
                      value={newSensor.mqttKey} 
                      onChange={e => setNewSensor({...newSensor, mqttKey: e.target.value})} 
                    />
                </div>
                <div className="form-group">
                    <label>Đơn vị:</label>
                    <input 
                      placeholder="°C"
                      value={newSensor.unit} 
                      onChange={e => setNewSensor({...newSensor, unit: e.target.value})} 
                    />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sensors;