import React, { useState, useEffect } from 'react';
import { inviteUserToHouse, getHouseById, updateMemberPermissions } from '../services/houseService';
import Card from './Card';
import './members.css';

const Members = ({ houseId, onClose }) => {
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Member', accessType: 'all' });
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingDeviceIds, setEditingDeviceIds] = useState([]);
  const [editingAccessType, setEditingAccessType] = useState('all');

  // Simple device list (frontend-local). Replace with API-driven list if devices are persisted.
  const availableDevices = [
    { id: 'den', name: 'Đèn' },
    { id: 'quat', name: 'Quạt' },
    { id: 'dieuHoa', name: 'Điều hòa' },
    { id: 'camera', name: 'Camera' }
  ];
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchHouseDetails();
  }, [houseId]);

  const fetchHouseDetails = async () => {
    try {
      setLoading(true);
      const data = await getHouseById(houseId);
      setHouse(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi khi tải thông tin nhà: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDeviceToggle = (deviceId) => {
    setSelectedDeviceIds(prev => {
      if (prev.includes(deviceId)) return prev.filter(d => d !== deviceId);
      return [...prev, deviceId];
    });
  };

  const handleEditDeviceToggle = (deviceId) => {
    setEditingDeviceIds(prev => {
      if (prev.includes(deviceId)) return prev.filter(d => d !== deviceId);
      return [...prev, deviceId];
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email' });
      return;
    }

    try {
      setSubmitting(true);
      // Build payload: either fullAccess or deviceIds array
      const payload = { email: inviteForm.email.trim(), role: inviteForm.role };
      if (inviteForm.accessType === 'all') {
        payload.fullAccess = true;
      } else {
        payload.deviceIds = selectedDeviceIds; // use selected device keys from frontend
      }

      await inviteUserToHouse(houseId, payload);
      setMessage({ type: 'success', text: 'Mời thành công!' });
      setInviteForm({ email: '', role: 'Member', accessType: 'all' });
      setSelectedDeviceIds([]);
      await fetchHouseDetails();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Invite error:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingMember = (member) => {
    setEditingMemberId(member.userId._id || member.userId);
    const currentDevices = member.devicePermissions?.map(d => d.deviceId) || [];
    setEditingDeviceIds(currentDevices);
    // Nếu canControlDevices = true, là toàn quyền; ngược lại là select devices
    setEditingAccessType(member.canControlDevices ? 'all' : 'select');
  };

  const cancelEditMember = () => {
    setEditingMemberId(null);
    setEditingDeviceIds([]);
    setEditingAccessType('all');
  };

  const saveMemberPermissions = async (member) => {
    try {
      setSubmitting(true);
      const memberId = member.userId._id || member.userId;
      
      // Xây dựng payload: fullAccess hoặc deviceIds
      const payload = {};
      if (editingAccessType === 'all') {
        payload.fullAccess = true;
      } else {
        // Nếu chọn devices cụ thể
        payload.fullAccess = false;
        payload.deviceIds = editingDeviceIds;
      }

      await updateMemberPermissions(houseId, memberId, payload);
      setMessage({ 
        type: 'success', 
        text: 'Cập nhật quyền thiết bị thành công!' 
      });
      cancelEditMember();
      await fetchHouseDetails();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Update permissions error:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi cập nhật: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="modal-overlay"><p>Đang tải...</p></div>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Quản lý thành viên - {house?.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`modal-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="modal-body">
          {/* Form mời */}
          <Card title="Mời thành viên mới" className="invite-form-card">
            <form onSubmit={handleInviteSubmit} className="invite-form">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={inviteForm.email}
                  onChange={handleInviteChange}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Vai trò</label>
                <select
                  name="role"
                  value={inviteForm.role}
                  onChange={handleInviteChange}
                >
                  <option value="Member">Thành viên (Điều khiển thiết bị)</option>
                  <option value="Owner">Chủ sở hữu (Quản lý hoàn toàn)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quyền truy cập thiết bị</label>
                <div>
                  <label>
                    <input 
                      type="radio" 
                      name="accessType" 
                      value="all" 
                      checked={inviteForm.accessType === 'all'} 
                      onChange={handleInviteChange} 
                    />{' '}
                    Toàn bộ thiết bị
                  </label>
                </div>
                <div>
                  <label>
                    <input 
                      type="radio" 
                      name="accessType" 
                      value="select" 
                      checked={inviteForm.accessType === 'select'} 
                      onChange={handleInviteChange} 
                    />{' '}
                    Chỉ các thiết bị (chọn bên dưới)
                  </label>
                </div>
                {inviteForm.accessType === 'select' && (
                  <div className="device-checkboxes">
                    {availableDevices.map(d => (
                      <label key={d.id} className="device-option">
                        <input 
                          type="checkbox" 
                          value={d.id} 
                          checked={selectedDeviceIds.includes(d.id)} 
                          onChange={() => handleDeviceToggle(d.id)} 
                        /> {d.name}
                      </label>
                    ))}
                    {availableDevices.length === 0 && <p className="muted">Không có thiết bị</p>}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-invite" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
            </form>
          </Card>

          {/* Danh sách thành viên */}
          <Card title="Thành viên hiện tại">
            <div className="members-list">
              {house?.members && house.members.length > 0 ? (
                house.members.map((member, idx) => {
                  const isEditing = editingMemberId === (member.userId._id || member.userId);
                  return (
                    <div key={idx} className="member-item">
                      <div className="member-info">
                        <span className="member-email">{member.userId?.email || 'Unknown'}</span>
                        <span className={`member-role role-${member.role.toLowerCase()}`}>
                          {member.role === 'Owner' ? '👑 Chủ sở hữu' : '👤 Thành viên'}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="member-edit-permissions">
                          <div className="edit-access-type">
                            <div>
                              <label>
                                <input 
                                  type="radio" 
                                  name="editAccessType" 
                                  value="all" 
                                  checked={editingAccessType === 'all'} 
                                  onChange={() => setEditingAccessType('all')} 
                                />{' '}
                                Toàn bộ thiết bị
                              </label>
                            </div>
                            <div>
                              <label>
                                <input 
                                  type="radio" 
                                  name="editAccessType" 
                                  value="select" 
                                  checked={editingAccessType === 'select'} 
                                  onChange={() => setEditingAccessType('select')} 
                                />{' '}
                                Chỉ các thiết bị
                              </label>
                            </div>
                          </div>

                          {editingAccessType === 'select' && (
                            <div className="device-checkboxes-inline">
                              {availableDevices.map(d => (
                                <label key={d.id} className="device-option-inline">
                                  <input 
                                    type="checkbox" 
                                    checked={editingDeviceIds.includes(d.id)} 
                                    onChange={() => handleEditDeviceToggle(d.id)} 
                                  /> {d.name}
                                </label>
                              ))}
                            </div>
                          )}

                          <div className="member-edit-actions">
                            <button 
                              className="btn-save-small" 
                              onClick={() => saveMemberPermissions(member)}
                              disabled={submitting}
                            >
                              💾 Lưu
                            </button>
                            <button 
                              className="btn-cancel-small" 
                              onClick={cancelEditMember}
                              disabled={submitting}
                            >
                              ✕ Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="member-actions">
                          <span className={`control-status ${member.canControlDevices ? 'can' : 'cannot'}`}>
                            {member.canControlDevices 
                              ? '✓ Toàn quyền' 
                              : (member.devicePermissions?.length > 0 
                                ? `✓ ${member.devicePermissions.length} thiết bị` 
                                : '✗ Không quyền')}
                          </span>
                          {member.role === 'Member' && (
                            <button 
                              className="btn-edit-small" 
                              onClick={() => startEditingMember(member)}
                            >
                              ✏️ Chỉnh sửa quyền
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="empty-members">Chưa có thành viên nào</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Members;
