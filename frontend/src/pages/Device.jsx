import React, { useEffect, useState } from 'react';
import { getDevicesByHouse, createDevice, controlDevice } from '../services/deviceService';
import HouseSelector from '../components/HouseSelector';
import './device.css';

const Device = () => {
  const [currentHouse, setCurrentHouse] = useState(null);
  const [devices, setDevices] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', hardwareId:'', type:'socket', location:'' });

  useEffect(()=>{
    if(currentHouse) loadDevices();
  }, [currentHouse]);

  const loadDevices = async () => {
    try {
      const data = await getDevicesByHouse(currentHouse._id);
      setDevices(data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentHouse) {
      alert('Vui lòng chọn nhà trước!');
      return;
    }
    try {
      await createDevice({...form, houseId: currentHouse._id});
      alert('Thêm thiết bị thành công!');
      setShowAdd(false);
      setForm({name:'', hardwareId:'', type:'socket', location:''});
      loadDevices();
    } catch (err) { 
      const errorMsg = err.response?.data?.message || err.message || 'Thêm thất bại';
      alert('Lỗi: ' + errorMsg); 
      console.error(err); 
    }
  };

  const handleToggle = async (device) => {
     // 1. Xác định trạng thái mới dự kiến
    // Giả sử logic hiện tại của bạn: status === 'online' là BẬT, 'offline' là TẮT
    // (Tuy nhiên, khuyên bạn nên tách riêng field 'isOn' và 'connectionStatus')
    const newStatus = device.status === 'online' ? 'offline' : 'online';

    // 2. Cập nhật giao diện NGAY LẬP TỨC (Optimistic UI)
    setDevices(prevDevices => 
      prevDevices.map(d => 
        d._id === device._id ? { ...d, status: newStatus } : d
      )
    );

    try {
      // 3. Gửi lệnh xuống Backend
      // Lưu ý: Backend controlDevice trả về { success: true, command: ... }
      await controlDevice(device._id, 'toggle', null, currentHouse._id);
      
      // 4. (Tùy chọn) Reload lại sau để đảm bảo đồng bộ thực tế
      // Nếu backend/ESP32 phản hồi chậm, việc reload ngay có thể làm nút nhảy lại trạng thái cũ
      // Tốt nhất là chờ phản hồi qua MQTT/Socket, hoặc reload sau 1-2s
      // setTimeout(() => loadDevices(), 1000); 

    } catch (err) { 
      console.error(err); 
      
      // 5. Nếu lỗi, hoàn tác lại trạng thái cũ trên giao diện
      setDevices(prevDevices => 
        prevDevices.map(d => 
          d._id === device._id ? { ...d, status: device.status } : d
        )
      );
      
      alert('Lỗi gửi lệnh: ' + (err.response?.data?.error || err.message)); 
    }
  };

  return (
    <div className="page devices-page">
      <div className="header-row">
        <h2>Thiết bị</h2>
        <HouseSelector onHouseChange={setCurrentHouse} currentHouseId={currentHouse?._id} />
      </div>

      <div className="actions">
        <button className="button" onClick={()=>setShowAdd(true)}>+ Thêm thiết bị</button>
      </div>

      <div className="devices-grid">
        {devices.map(d => (
          <div key={d._id} className={`device-card ${d.status === "online" ? "on" : ""}`}>
            <h3>{d.name}</h3>
            <p><strong>ID:</strong> {d.hardwareId}</p>
            <p><strong>Loại:</strong> {d.type}</p>
            {d.location && <p><strong>Vị trí:</strong> {d.location}</p>}
            <p>
              <strong>Trạng thái:</strong> 
              <span style={{ 
                color: d.status === 'online' ? '#28a745' : '#dc3545',
                marginLeft: '8px',
                fontWeight: 'bold'
              }}>
                {d.status === 'online' ? '🟢 Online' : '🔴 Offline'}
              </span>
            </p>
            <div className='toggle-wrapper'>
              <label className="toggle-switch">
                <input 
                  type="checkbox"
                  checked={d.status==="online"}
                  onChange={() => handleToggle(d)}  
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Thêm thiết bị mới</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Tên</label>
                <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label>ID phần cứng (hardwareId)</label>
                <input 
                  value={form.hardwareId} 
                  onChange={e => setForm({...form, hardwareId:e.target.value})} 
                  placeholder="VD: SOCK_998877"
                  required
                />
                <small style={{color: '#666', fontSize: '12px'}}>
                  ID duy nhất của thiết bị (ghi trên thiết bị hoặc trong app của nhà sản xuất)
                </small>
              </div>
              <div className="form-group">
                <label>Vị trí (tùy chọn)</label>
                <input 
                  value={form.location} 
                  onChange={e => setForm({...form, location:e.target.value})} 
                  placeholder="VD: Phòng khách, Sân vườn, Phòng ngủ"
                />
              </div>
              <div className="form-group">
                <label>Loại thiết bị</label>
                <select 
                  value={form.type} 
                  onChange={e => setForm({...form, type:e.target.value})}
                >
                  <option value="socket">Ổ cắm thông minh</option>
                  <option value="light">Đèn</option>
                  <option value="fan">Quạt</option>
                  <option value="camera">Camera</option>
                  <option value="sensor">Cảm biến</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="modal-actions">
                <button onClick={()=>setShowAdd(false)} type="button" className="btn-cancel">Hủy</button>
                <button type="submit" className="btn-save">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Device;