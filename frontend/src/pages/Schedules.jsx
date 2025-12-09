import React, { useEffect, useState } from "react";
import { getDevicesByHouse } from "../services/deviceService";
import { getSchedules, addSchedule, deleteSchedule } from "../services/scheduleService";
import { getPowerStats } from "../services/powerService";
import HouseSelector from "../components/HouseSelector";
import { getAllHouses } from "../services/houseService";
import "./schedules.css";

function Schedules() {
  const [devices, setDevices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    deviceId: "",
    startTime: "",
    endTime: "",
    action: "",
  });
  //Stat chọn nhà
  const [currentHouse, setCurrentHouse] = useState(null);

// State cho Thống kê điện
  const [powerData, setPowerData] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD

    // 1. Load danh sách nhà lần đầu (nếu HouseSelector không tự làm)
  // Tuy nhiên, HouseSelector của bạn thường đã có logic load nhà.
  // Chúng ta chỉ cần truyền hàm setCurrentHouse xuống HouseSelector.

  useEffect(() => {
    // Nếu chưa có nhà nào được chọn, thử load mặc định
    const initHouse = async () => {
        try {
            const houses = await getAllHouses();
            if (houses && houses.length > 0 && !currentHouse) {
                setCurrentHouse(houses[0]);
            }
        } catch (err) {
            console.error("Lỗi tải danh sách nhà:", err);
        }
    };
    initHouse();
  }, []);


  useEffect(() => {
    if (!currentHouse?._id) return;
    loadDevices();
    loadSchedules();
    loadPowerStats(); // Load thống kê
  }, [currentHouse, selectedDate, viewMode]);

  const loadDevices = async () => {
    try {
      const list = await getDevicesByHouse(currentHouse._id);
      setDevices(list);
    } catch (err) {
      console.error("Lỗi tải danh sách thiết bị:", err);
    }
  };

  const loadSchedules = async () => {
    try {
      const list = await getSchedules(currentHouse._id);
      setSchedules(list);
    } catch (err) {
      console.error("Lỗi tải lịch biểu:", err);
    }
  };

  
  // Hàm tải thống kê điện (Đã thêm kiểm tra an toàn)
  const loadPowerStats = async () => {
      // Kiểm tra null/undefined trước khi truy cập _id
      if (!currentHouse._id)  return;
      
      try {
          const data = await getPowerStats(currentHouse._id, selectedDate, viewMode);
          
          const DEVICE_LABELS = {
            esp32_device_1: "ESP32",
            den: "Đèn",
            quat: "Quạt",
            camera: "Camera",
            dieuHoa: "Điều hòa",
          };
                // Ánh xạ tên thiết bị cho dễ đọc
                data.stats = data.stats.map(s => ({
                  ...s,
                  deviceName: DEVICE_LABELS[s.deviceId] || s.deviceId
                }));

                // Use backend-provided byDevice sums when available (includes dieuHoa aggregated)
                const byDevice = data.byDevice || {};
                data.summary.totalLight = byDevice.den || data.stats
                  .filter(i => i.deviceId === 'den')
                  .reduce((a, b) => a + (b.totalWh || 0), 0);

                data.summary.totalFan = byDevice.quat || data.stats
                  .filter(i => i.deviceId === 'quat')
                  .reduce((a, b) => a + (b.totalWh || 0), 0);

                data.summary.totalCamera = byDevice.camera || data.stats
                  .filter(i => i.deviceId === 'camera')
                  .reduce((a, b) => a + (b.totalWh || 0), 0);

                // Grand total: prefer backend summary, otherwise sum rows
                data.summary.grandTotal = data.summary?.grandTotal || data.stats.reduce(
                  (a, b) => a + (b.totalWh || 0), 0
                );

                setPowerData(data);
                
                  data.summary.totalAC = byDevice.dieuHoa || data.stats
                    .filter(i => i.deviceId === 'dieuHoa')
                    .reduce((a, b) => a + (b.totalWh || 0), 0);
      } catch (err) {
          console.error("Lỗi tải thống kê điện:", err);
          setPowerData(null); // Reset data nếu lỗi để tránh hiện data cũ sai lệch
      }
  };
//   if (!currentHouse?._id) return;

//     try {
//         const data = await getPowerStats(currentHouse._id, selectedDate, viewMode);

//             const deviceMap = {
//               den: { name: 'Đèn', icon: 'fa-lightbulb' },
//               quat: { name: 'Quạt', icon: 'fa-fan' },
//               dieuHoa: { name: 'Điều hòa', icon: 'fa-snowflake' },
//               camera: { name: 'Camera', icon: 'fa-video' },
//             };

//         // Gắn tên và loại vào mỗi dòng thống kê
//         data.stats = data.stats.map(s => ({
//             ...s,
//             deviceName: deviceMap[s.deviceId]?.name || "Thiết bị",
//             deviceType: deviceMap[s.deviceId]?.type || "unknown"
//         }));

//         // Tính tổng theo loại
//         data.summary.totalLight = data.stats
//             .filter(i => i.deviceType === "Đèn")
//             .reduce((a, b) => a + b.totalWh, 0);

//         data.summary.totalFan = data.stats
//             .filter(i => i.deviceType === "Quạt")
//             .reduce((a, b) => a + b.totalWh, 0);

//         data.summary.totalCamera = data.stats
//             .filter(i => i.deviceType === "Camera")
//             .reduce((a, b) => a + b.totalWh, 0);

//         // Tổng tất cả thiết bị
//         data.summary.grandTotal = data.stats.reduce(
//             (a, b) => a + b.totalWh,
//             0
//         );

//         setPowerData(data);

//     } catch (err) {
//         console.error("Lỗi tải thống kê điện:", err);
//         setPowerData(null);
//     }
// };

  const handleAddSchedule = async () => {
    if (!newSchedule.deviceId || !newSchedule.startTime || !newSchedule.endTime) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    try {
      await addSchedule(currentHouse._id, newSchedule);
      alert("Đã thêm lịch!");
      setNewSchedule({ deviceId: "", startTime: "", endTime: "" });
      loadSchedules();
    } catch (err) {
      console.error("Lỗi thêm lịch:", err);
      alert("Không thể thêm lịch");
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Xóa lịch này?")) return;
    try {
      await deleteSchedule(id);
      loadSchedules();
    } catch (err) {
      console.error("Lỗi xóa lịch:", err);
    }
  };

  return (
    <div className="schedule-page">
      {/* --- PHẦN HEADER: CHỌN NHÀ --- */}
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Quản lý Lịch biểu & Thống kê</h2>
          <div style={{ width: '300px' }}>
            {/* Thêm HouseSelector ở đây */}
            <HouseSelector 
                onHouseChange={setCurrentHouse} 
                currentHouseId={currentHouse?._id} 
            />
          </div>
      </div>

      {/* Kiểm tra nếu chưa chọn nhà */}
      {!currentHouse ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Vui lòng chọn một ngôi nhà để xem dữ liệu.</p>
      ) : (
          <>
            {/* --- PHẦN 1: QUẢN LÝ LỊCH BIỂU --- */}
            <div className="schedule-section">
                <h3>Lịch biểu thiết bị</h3>
                <div className="schedule-box">
                    <select
                    value={newSchedule.deviceId}
                    onChange={(e) =>
                        setNewSchedule({ ...newSchedule, deviceId: e.target.value })
                    }
                    >
                    <option value="">-- Chọn thiết bị --</option>
                    {devices.map((d) => (
                        <option key={d._id} value={d._id}> 
                        {d.name}
                        </option>
                    ))}
                    </select>
                    <select
                        value={newSchedule.action}
                        onChange={(e) => setNewSchedule({ ...newSchedule, action: e.target.value })}
                      >
                        <option value="">-- Chọn hành động --</option>
                        <option value="ON">Bật</option>
                        <option value="OFF">Tắt</option>
                    </select>
                    <input
                    type="datetime-local"
                    value={newSchedule.startTime}
                    onChange={(e) =>
                        setNewSchedule({ ...newSchedule, startTime: e.target.value })
                    }
                    />

                    <input
                    type="datetime-local"
                    value={newSchedule.endTime}
                    onChange={(e) =>
                        setNewSchedule({ ...newSchedule, endTime: e.target.value })
                    }
                    />

                    <button onClick={handleAddSchedule}>Thêm lịch</button>
                </div>

                <div className="schedule-list">
                    {schedules.length === 0 && <p>Chưa có lịch nào.</p>}
                    {schedules.map((sch) => (
                    <div key={sch._id} className="schedule-item">
                        <strong>{sch.deviceId?.name || 'Thiết bị đã xóa'}</strong>
                        <span>
                        {" "}| {new Date(sch.startTime).toLocaleString()} →
                        {new Date(sch.endTime).toLocaleString()}
                        </span>

                        <button
                        className="btn-delete"
                        onClick={() => handleDeleteSchedule(sch._id)}
                        >
                        Xóa
                        </button>
                    </div>
                    ))}
                </div>
            </div>
   {/* --- PHẦN 2: THỐNG KÊ TIÊU THỤ ĐIỆN (MỚI) --- */}
      <div className="power-stats-container" style={{ marginTop: '60px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h2>📊 Thống Kê Tiêu Thụ Điện</h2>
        
        <div className="stats-controls" style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label>Chế độ xem:</label>
            <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={{ padding: '5px' }}>
                <option value="daily">Theo Ngày</option>
                <option value="monthly">Theo Tháng</option>
            </select>
            
            <label>Thời gian:</label>
            <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)}
                style={{ padding: '5px' }}
            />
            
            <button onClick={loadPowerStats} style={{ padding: '5px 10px', cursor: 'pointer' }}>Làm mới</button>
        </div>

        {powerData ? (
            <div className="stats-dashboard">
                {/* Summary Cards */}
                <div className="summary-cards" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div className="stat-card total" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Tổng cộng</h4>
                        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{powerData.summary?.grandTotal?.toFixed(2) || 0} Wh</span>
                    </div>
                    <div className="stat-card" style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#ef6c00' }}>Đèn</h4>
                        <span style={{ fontSize: '20px' }}>{powerData.summary?.totalLight?.toFixed(2) || 0} Wh</span>
                    </div>
                    <div className="stat-card" style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Quạt</h4>
                        <span style={{ fontSize: '20px' }}>{powerData.summary?.totalFan?.toFixed(2) || 0} Wh</span>
                    </div>
                    <div className="stat-card" style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Camera</h4>
                        <span style={{ fontSize: '20px' }}>{powerData.summary?.totalCamera?.toFixed(2) || 0} Wh</span>
                    </div>
                    <div className="stat-card" style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#6a1b9a' }}>Điều Hoà</h4>
                      <span style={{ fontSize: '20px' }}>{powerData.summary?.totalAC?.toFixed(2) || 0} Wh</span>
                    </div>
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Thiết bị</th>
                            <th>Tiêu thụ (Wh)</th>
                            <th>Cập nhật cuối</th>
                        </tr>
                    </thead>
                    <tbody>
                        {powerData.stats.map((item) => (
                            <tr key={item._id}>
                                {/* deviceName đã được map từ backend */}
                                <td>{item.deviceName} <span style={{color:'#888', fontSize:'0.8em'}}>({item.deviceId})</span></td>
                                <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                    {(item.totalWh ?? 0).toFixed(2)} 
                                </td>
                                <td>{item.timestamp
                                    ? new Date(item.timestamp).toLocaleString()
                                    : "—"}
                              </td>
                            </tr>
                        ))}
                        {/* Dòng tổng cộng */}
                        <tr style={{ background: '#e3f2fd', fontWeight: 'bold' }}>
                            <td>TỔNG CỘNG</td>
                            <td>{powerData.summary?.grandTotal.toFixed(2) || 0}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        ) : (
            <p style={{ textAlign: 'center', marginTop: '20px' }}>Đang tải dữ liệu thống kê...</p>
        )}
      </div>
      </>
      )}
    </div>
  );
}

export default Schedules;