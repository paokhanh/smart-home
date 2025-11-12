import React from 'react'
import './xacnhan.css'
const Xacnhan = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ marginBottom: 18, fontSize: "1.1rem" }}>{message}</div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
          <button className="btn btn-delete" onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
};

export default Xacnhan