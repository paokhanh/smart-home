import React, { useState, useEffect } from 'react';
import { getAllHouses, createHouse, deleteHouse, updateHouse } from '../services/houseService';
import ProtectedRoute from '../components/ProtectedRoute';
import Card from '../components/Card';
import Members from '../components/Members';
import './houses.css';

const Houses = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [selectedHouseForMembers, setSelectedHouseForMembers] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const data = await getAllHouses();
      setHouses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên nhà');
      return;
    }

    try {
      setSubmitting(true);
      if (editingHouse) {
        await updateHouse(editingHouse._id, formData);
      } else {
        await createHouse(formData);
      }
      await fetchHouses();
      setFormData({ name: '', address: '' });
      setEditingHouse(null);
      setShowForm(false);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (house) => {
    setEditingHouse(house);
    setFormData({ name: house.name, address: house.address });
    setShowForm(true);
  };

  const handleDelete = async (houseId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa nhà này?')) return;
    
    try {
      await deleteHouse(houseId);
      await fetchHouses();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHouse(null);
    setFormData({ name: '', address: '' });
  };

  if (loading) return <div className="houses-container"><p>Đang tải...</p></div>;

  return (
    <ProtectedRoute role={['Owner', 'Admin']}>
      <div className="houses-container">
        <div className="houses-header">
          <h1> Quản lý nhà của tôi</h1>
          {!showForm && (
            <button className="btn-new-house" onClick={() => setShowForm(true)}>
              + Tạo nhà mới
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Form tạo/sửa nhà */}
        {showForm && (
          <Card className="form-card" title={editingHouse ? 'Cập nhật nhà' : 'Tạo nhà mới'}>
            <form onSubmit={handleSubmit} className="house-form">
              <div className="form-group">
                <label>Tên nhà *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="VD: Nhà Bình Thạnh, Nhà quê"
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="VD: 123 Đường ABC, Phường XYZ, TP.HCM"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Hủy
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Danh sách nhà */}
        <div className="houses-grid">
          {houses.length === 0 ? (
            <div className="empty-state">
              <p>Bạn chưa có nhà nào. Hãy tạo nhà mới!</p>
            </div>
          ) : (
            houses.map(house => (
              <Card key={house._id} className="house-card" title={house.name}>
                <div className="house-info">
                  <p><strong>📍 Địa chỉ:</strong> {house.address || 'Chưa cập nhật'}</p>
                  <p><strong>👥 Thành viên:</strong> {house.members?.length || 0}</p>
                  <p><strong>📅 Tạo lúc:</strong> {new Date(house.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>

                <div className="house-actions">
                  <button className="btn-edit" onClick={() => handleEdit(house)}>
                    ✏️ Sửa
                  </button>
                  <button className="btn-members" onClick={() => setSelectedHouseForMembers(house)}>
                    👥 Thành viên
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(house._id)}>
                    🗑️ Xóa
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      {selectedHouseForMembers && (
        <Members 
          houseId={selectedHouseForMembers._id} 
          onClose={() => setSelectedHouseForMembers(null)}
        />
      )}
    </ProtectedRoute>
  );
};

export default Houses;
