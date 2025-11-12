import React, { useEffect, useState } from 'react';
import Table from "../components/Table";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import "./users.css";
import Xacnhan from '../components/Xacnhan';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [currentUser , setCurrentUser ] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser , setSelectedUser ] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Thêm state cho thông báo thành công

  const navigate = useNavigate();

  // Load current user để lấy role
  useEffect(() => {
    const fetchCurrentUser  = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
        setCurrentUser (res.data);
      } catch (err) {
        console.error("❌ Lỗi load user hiện tại:", err);
        if (err.response?.status === 401) {
          navigate('/dangnhap');
        }
      }
    };

    fetchCurrentUser ();
  }, [navigate]);

  // Load users nếu là Admin hoặc Owner
  useEffect(() => {
    if (currentUser  && (currentUser .role === 'Admin' || currentUser .role === 'Owner')) {
      fetchUsers();
    }
  }, [currentUser ]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users", { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error("❌ Lỗi load users:", err);
      setError("Không thể tải danh sách người dùng.");
    }
  };

  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Xóa error khi người dùng nhập
    if (error) setError('');
  };

  // Reset form và error/success
  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'User' });
    setError('');
    setSuccess('');
  };

  // Thêm user mới
  const handleAddUser  = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    try {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,   // không trim vì mật khẩu có thể chứa space
          role: formData.role.trim()
        };

      // Chỉ Owner có thể tạo User, Admin có thể tạo tất cả
      if (currentUser .role === 'Owner' && formData.role !== 'User') {
        setError("Owner chỉ có thể tạo user với role User.");
        return;
      }

      await axios.post("http://localhost:5000/api/users", payload, { withCredentials: true });
      setSuccess("Thêm người dùng thành công!");
      fetchUsers();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thêm người dùng.");
    } finally {
      setLoading(false);
    }
  };

  // Sửa user
  const handleEditUser  = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };

      // Kiểm tra quyền: Owner chỉ edit role User
      if (currentUser .role === 'Owner' && formData.role !== 'User') {
        setError("Owner chỉ có thể chỉnh sửa user với role User.");
        return;
      }

      await axios.put(`http://localhost:5000/api/users/${selectedUser ._id}`, payload, { withCredentials: true });
      setSuccess("Cập nhật người dùng thành công!");
      fetchUsers();
      setShowEditModal(false);
      setSelectedUser (null);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi sửa người dùng.");
    } finally {
      setLoading(false);
    }
  };

// Khi click nút Xóa
const handleDeleteClick = (userId) => {
  setUserToDelete(userId);
  setConfirmOpen(true);
};

// Khi xác nhận xóa
const handleConfirmDelete = async () => {
  setLoading(true);
  try {
    await axios.delete(`http://localhost:5000/api/users/${userToDelete}`, { withCredentials: true });
    setSuccess("Xóa người dùng thành công!");
    fetchUsers();
  } catch (err) {
    setError(err.response?.data?.message || "Lỗi khi xóa người dùng.");
  } finally {
    setLoading(false);
    setConfirmOpen(false);
    setUserToDelete(null);
  }
};

// Khi hủy xóa
const handleCancelDelete = () => {
  setConfirmOpen(false);
  setUserToDelete(null);
};

  // Mở modal edit
  const openEditModal = (user) => {
    setSelectedUser (user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
  };

  // Đóng modal và reset
  const closeModal = (modalType) => {
    if (modalType === 'add') {
      setShowAddModal(false);
    } else {
      setShowEditModal(false);
      setSelectedUser (null);
    }
    resetForm();
  };

  const renderActions = (user) => {
    if (user._id === currentUser?._id) {
      return <span className="no-action">—</span>; // không cho tự sửa/xóa mình
    }

    // Nếu Owner đang xem Admin → không cho sửa/xóa
    if (currentUser.role === "Owner" && user.role === "Admin") {
      return (
        <div className="actions">
          <span className="no-action">Không thể sửa/xóa Admin</span>
        </div>
      );
    }

    // Nếu Owner đang xem Owner khác → không cho xóa
    if (currentUser.role === "Owner" && user.role === "Owner") {
      return (
        <div className="actions">
          <button onClick={() => openEditModal(user)} className="btn btn-edit" disabled={loading}>
            ✏️ Sửa
          </button>
          <span className="no-action">Không thể xóa</span>
        </div>
      );
    }

    return (
      <div className="actions">
        <button 
          onClick={() => openEditModal(user)} 
          className="btn btn-edit"
          disabled={loading}
          title="Sửa thông tin"
        >
          ✏️ Sửa
        </button>
        <button 
          onClick={() => handleDeleteClick (user._id)} 
          className="btn btn-delete"
          disabled={loading}
          title="Xóa người dùng"
        >
          🗑️ Xóa
        </button>
      </div>
    );
  };

  // Columns cho bảng
  const columns = [
    { header: "ID", accessor: "_id", width: "15%" },
    { header: "Tên người dùng", accessor: "name", width: "25%" },
    { header: "Email", accessor: "email", width: "30%" },
    { header: "Quyền", accessor: "role", width: "15%" },
    { header: "Chức năng", customRender: renderActions, width: "15%" }
  ];

  // Role options cho dropdown
  const roleOptions = currentUser ?.role === 'Admin' 
    ? ['Admin', 'Owner', 'User'] 
    : ['User'];

  if (!currentUser ) {
    return (
      <div className="loading-container">
        <div className="spinner">Đang tải...</div>
      </div>
    );
  }

  const { role: currentRole } = currentUser ;

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Quản lý người dùng</h2>
        <p className="role-info">Vai trò hiện tại: <span className={`role-badge role-${currentRole.toLowerCase()}`}>{currentRole}</span></p>
      </div>

      {/* Thông báo */}
      {(error || success) && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
          {error || success}
          <button className="alert-close" onClick={() => { setError(''); setSuccess(''); }}>×</button>
        </div>
      )}

      {/* Phần cho Admin và Owner: CRUD Users */}
      {(currentRole === 'Admin' || currentRole === 'Owner') && (
        <>
          <div className="section-header">
            <h3>Danh sách người dùng</h3>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="btn btn-primary btn-add"
              disabled={loading}
            >
              ➕ Thêm người dùng mới
            </button>
          </div>

          <div className="table-container">
            <Table columns={columns} data={users} />
          </div>

          {/* Modal Thêm */}
          {showAddModal && (
            <Modal 
              title="Thêm người dùng mới" 
              onClose={() => closeModal('add')}
              onSubmit={handleAddUser }
              formData={formData}
              onChange={handleInputChange}
              roleOptions={roleOptions}
              loading={loading}
              isEdit={false}
              error={error}
            />
          )}
          {/* Modal Xác nhận xóa */}
            <Xacnhan
              open={confirmOpen}
              message="Bạn có chắc chắn muốn xóa người dùng này?"
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
                  />
          {/* Modal Sửa */}
          {showEditModal && selectedUser  && (
            <Modal 
              title="Sửa thông tin người dùng" 
              onClose={() => closeModal('edit')}
              onSubmit={handleEditUser }
              formData={formData}
              onChange={handleInputChange}
              roleOptions={roleOptions}
              loading={loading}
              isEdit={true}
              error={error}
            />
          )}
        </>
      )}

      {/* Phần cho User: Quyền thiết bị */}
      {currentRole === 'User' && (
        <div className="user-permissions-section">
          <div className="section-header">
            <h3>Quyền truy cập thiết bị</h3>
            <p className="description">Bạn chỉ có quyền xem và điều khiển thiết bị được phân quyền. Không có quyền quản lý người dùng.</p>
          </div>
          <div className="permissions-list">
            <ul>
              <li className="permission-item">
                <span className="device-name">Thiết bị 1 (Đèn phòng khách)</span>
                <span className="permission">Quyền đọc/ghi</span>
              </li>
              <li className="permission-item">
                <span className="device-name">Thiết bị 2 (Cảm biến nhiệt độ)</span>
                <span className="permission">Quyền chỉ đọc</span>
              </li>
              {/* Thêm động từ API nếu cần */}
            </ul>
            <button className="btn btn-secondary" onClick={() => {/* Load permissions */}}>
              🔄 Tải lại quyền
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Component Modal tái sử dụng để tránh lặp code
const Modal = ({ 
  title, 
  onClose, 
  onSubmit, 
  formData, 
  onChange, 
  roleOptions, 
  loading, 
  isEdit, 
  error 
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <form onSubmit={onSubmit} className="modal-form">
        {error && <div className="form-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="name">Họ và tên *</label>
          <input 
            id="name"
            type="text" 
            name="name" 
            placeholder="Nhập họ và tên" 
            value={formData.name} 
            onChange={onChange} 
            required 
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input 
            id="email"
            type="email" 
            name="email" 
            placeholder="Nhập email" 
            value={formData.email} 
            onChange={onChange} 
            required 
            disabled={loading}
          />
        </div>
        {!isEdit && (
          <div className="form-group">
            <label htmlFor="password">Mật khẩu *</label>
            <input 
              id="password"
              type="password" 
              name="password" 
              placeholder="Nhập mật khẩu" 
              value={formData.password} 
              onChange={onChange} 
              required 
              disabled={loading}
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="role">Vai trò *</label>
          <select 
            id="role"
            name="role" 
            value={formData.role} 
            onChange={onChange}
            disabled={loading}
          >
            {roleOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm')}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Users;