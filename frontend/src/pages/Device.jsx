import React, { useEffect, useState } from 'react';
import { getDevicesByHouse, createDevice, controlDevice, deleteDevice } from '../services/deviceService';
import HouseSelector from '../components/HouseSelector';
import './device.css';

// ... imports
import DeviceRenderer from '../components/DeviceRenderer';

const Device = () => {
  const [currentHouse, setCurrentHouse] = useState(null);
  const [devices, setDevices] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', hardwareId: '', type: 'socket', location: '', pin: '' });
  const [loadingMap, setLoadingMap] = useState({});

  useEffect(() => {
    if (currentHouse) loadDevices();
  }, [currentHouse]);

  const loadDevices = async () => {
    try {
      const data = await getDevicesByHouse(currentHouse._id);
      setDevices(data);
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async (device, key, value) => {
    try {
      setLoadingMap(prev => ({ ...prev, [device._id]: true }));
      // Use specific key if API supports it, or generic value set
      // Dashboard used: controlDevice(device._id, 'set', value, currentHouse._id);
      // We can try to respect the key if we adjust the API service or just send the value.
      // Provided controlDevice signature: (deviceId, action, value, houseId)
      // It seems strictly 'set' generic value? 
      // If so, standardizing on value is fine.
      await controlDevice(device._id, 'set', value, currentHouse._id);

      setDevices(prev => prev.map(d => d._id === device._id ? { ...d, value: { ...(d.value || {}), [key]: value } } : d));
    } catch (err) {
      console.error("Error updating device:", err);
      alert('Lỗi cập nhật: ' + err.message);
    } finally {
      setLoadingMap(prev => ({ ...prev, [device._id]: false }));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentHouse) {
      alert('Vui lòng chọn nhà trước!');
      return;
    }
    try {
      await createDevice({ ...form, houseId: currentHouse._id });
      alert('Thêm thiết bị thành công!');
      setShowAdd(false);
      setForm({ name: '', hardwareId: '', type: 'socket', location: '', pin: '' });
      loadDevices();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Thêm thất bại';
      alert('Lỗi: ' + errorMsg);
      console.error(err);
    }
  };

  const handleDelete = async (device) => {
    if (!confirm(`Xác nhận xóa thiết bị "${device.name}"?`)) return;
    try {
      await deleteDevice(device._id);
      alert('Xóa thiết bị thành công');
      loadDevices();
    } catch (err) {
      console.error('Lỗi xóa thiết bị:', err);
      alert('Lỗi xóa thiết bị: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggle = async (device) => {
    // 1. Xác định trạng thái mới dự kiến
    const newStatus = device.status === 'online' ? 'offline' : 'online';

    // 2. Cập nhật giao diện NGAY LẬP TỨC (Optimistic UI)
    setDevices(prevDevices =>
      prevDevices.map(d =>
        d._id === device._id ? { ...d, status: newStatus } : d
      )
    );

    try {
      setLoadingMap(prev => ({ ...prev, [device._id]: true }));
      await controlDevice(device._id, 'toggle', null, currentHouse._id);
    } catch (err) {
      console.error(err);
      // Revert
      setDevices(prevDevices =>
        prevDevices.map(d =>
          d._id === device._id ? { ...d, status: device.status } : d
        )
      );
      alert('Lỗi gửi lệnh: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingMap(prev => ({ ...prev, [device._id]: false }));
    }
  };
  // ...

  return (
    <div className="page devices-page">
      <div className="header-row">
        <h2>Thiết bị</h2>
        <HouseSelector onHouseChange={setCurrentHouse} currentHouseId={currentHouse?._id} />
      </div>

      <div className="actions">
        <button className="button" onClick={() => setShowAdd(true)}>+ Thêm thiết bị</button>
      </div>

      <div className="devices-grid">
        {devices.map(d => (
          <DeviceRenderer
            key={d._id}
            device={d}
            onToggle={handleToggle}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            loading={loadingMap[d._id]}
          />
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Thêm thiết bị mới</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Tên</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>ID phần cứng (hardwareId)</label>
                <input
                  value={form.hardwareId}
                  onChange={e => setForm({ ...form, hardwareId: e.target.value })}
                  placeholder="VD: SOCK_998877"
                  required
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  ID duy nhất của thiết bị (ghi trên thiết bị hoặc trong app của nhà sản xuất)
                </small>
              </div>
              <div className="form-group">
                <label>Vị trí (tùy chọn)</label>
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="VD: Phòng khách, Sân vườn, Phòng ngủ"
                />
              </div>
              <div className="form-group">
                <label>Loại thiết bị</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="socket">Ổ cắm thông minh</option>
                  <option value="den">Đèn</option>
                  <option value="fan">Quạt</option>
                  <option value="ac">Điều hòa</option>
                  <option value="camera">Camera</option>
                  <option value="sensor">Cảm biến</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Chân (pin) trên ESP32 (tùy chọn)</label>
                <input
                  value={form.pin}
                  onChange={e => setForm({ ...form, pin: e.target.value })}
                  placeholder="VD: 27"
                  type="number"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Nếu bạn muốn ánh xạ thiết bị tới một chân GPIO trên ESP32, nhập số chân ở đây. (Tùy chọn)
                </small>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowAdd(false)} type="button" className="btn-cancel">Hủy</button>
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