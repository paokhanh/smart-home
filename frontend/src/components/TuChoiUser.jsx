import React from 'react'
import { Link } from 'react-router-dom'
function TuChoiUser() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚫 Truy cập bị từ chối</h1>
      <p>Bạn không có quyền truy cập trang này. Chỉ Admin mới được phép.</p>
      <Link to="/">Quay về trang chủ</Link>
    </div>
  )
}

export default TuChoiUser