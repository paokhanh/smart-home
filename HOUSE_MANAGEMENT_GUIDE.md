# 🏠 Hướng Dẫn Quản Lý Nhiều Nhà - Smart Home

## 📋 Tổng Quan

Tôi đã tạo tính năng quản lý nhiều nhà cho chủ nhà trong ứng dụng Smart Home React. Điều này cho phép chủ nhà:

- ✅ Tạo và quản lý nhiều ngôi nhà khác nhau
- ✅ Chuyển đổi giữa các nhà trên Dashboard
- ✅ Mời người dùng tham gia vào từng nhà
- ✅ Phân quyền người dùng (Chủ sở hữu / Thành viên)

---

## 📁 Các File Được Tạo

### 1. **Services (API)**
- `frontend/src/services/houseService.js` - Các hàm gọi API để quản lý nhà

### 2. **Components**
- `frontend/src/components/HouseSelector.jsx` - Dropdown chọn nhà trên Dashboard
- `frontend/src/components/houseselector.css` - CSS cho HouseSelector
- `frontend/src/components/Members.jsx` - Modal quản lý thành viên nhà
- `frontend/src/components/members.css` - CSS cho modal Members

### 3. **Pages**
- `frontend/src/pages/Houses.jsx` - Trang quản lý danh sách nhà
- `frontend/src/pages/houses.css` - CSS cho trang Houses

### 4. **Cập Nhật Existing Files**
- `frontend/src/App.jsx` - Thêm route `/houses` và import Houses component
- `frontend/src/pages/Dashboard.jsx` - Thêm HouseSelector component
- `frontend/src/pages/dashboard.css` - Cập nhật styling cho dashboard header
- `frontend/src/components/Navbar.jsx` - Thêm link "🏠 Nhà của tôi" vào navigation

---

## 🎯 Các Tính Năng Chi Tiết

### A. Trang Quản Lý Nhà (`/houses`)

#### Truy Cập
- Chỉ có **Owner** và **Admin** mới có thể truy cập
- Click vào "🏠 Nhà của tôi" trên thanh navigation

#### Chức Năng

**1. Tạo Nhà Mới**
- Nhấn nút "+ Tạo nhà mới"
- Nhập tên nhà (bắt buộc)
- Nhập địa chỉ (tùy chọn)
- Nhấn "Lưu"

**2. Sửa Thông Tin Nhà**
- Nhấn nút "✏️ Sửa" trên card nhà
- Chỉnh sửa tên hoặc địa chỉ
- Nhấn "Lưu"

**3. Xóa Nhà**
- Nhấn nút "🗑️ Xóa" trên card nhà
- Xác nhận xóa

**4. Quản Lý Thành Viên**
- Nhấn nút "👥 Thành viên" trên card nhà
- Modal mở ra với 2 phần:

---

### B. Modal Quản Lý Thành Viên

#### Phần 1: Mời Thành Viên Mới
```
📧 Email: [Nhập email người dùng]
Vai trò: [Chọn Thành viên hoặc Chủ sở hữu]
[Gửi lời mời]
```

**Vai Trò:**
- **Thành viên**: Có thể điều khiển thiết bị
- **Chủ sở hữu**: Có toàn quyền quản lý nhà

#### Phần 2: Danh Sách Thành Viên Hiện Tại
- Hiển thị email của từng thành viên
- Hiển thị vai trò (👑 Chủ sở hữu hoặc 👤 Thành viên)
- Hiển thị quyền điều khiển

---

### C. Dashboard với HouseSelector

#### HouseSelector Component
- Xuất hiện ở đầu trang Dashboard
- Cho phép chọn nhà từ dropdown
- Hiển thị tên nhà và địa chỉ

#### House Info Bar
- Hiển thị tên và địa chỉ nhà đang chọn
- Cập nhật khi thay đổi nhà

#### Ví Dụ
```
┌─────────────────────────────────────────────────┐
│ Smart Home Dashboard    [Nhà của tôi: Nhà Bình Thạnh ▼] │
├─────────────────────────────────────────────────┤
│ 🏠 Nhà Bình Thạnh    📍 123 Đường ABC, Q1    │
├─────────────────────────────────────────────────┤
│  [Card Đèn]  [Card Quạt]  [Card Điều hòa]  │
└─────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### Backend (được sử dụng bởi Service)

```javascript
// Lấy danh sách nhà
GET /api/houses/

// Tạo nhà mới
POST /api/houses/
Body: { name: "string", address: "string" }

// Cập nhật nhà
PUT /api/houses/:houseId
Body: { name: "string", address: "string" }

// Xóa nhà
DELETE /api/houses/:houseId

// Lấy chi tiết nhà
GET /api/houses/:houseId

// Mời người dùng vào nhà
POST /api/houses/:houseId/invite
Body: { email: "string", role: "Owner|Member" }
```

---

## 💾 Data Model (Backend)

### House Schema
```javascript
{
  _id: ObjectId,
  name: String (required),
  address: String,
  owners: [ObjectId],
  members: [{
    userId: ObjectId (ref: User),
    role: "Owner" | "Member",
    canControlDevices: Boolean
  }],
  metadata: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Các Bước Để Chạy

### 1. **Cài Đặt Dependencies**
Backend cần có các routes được cập nhật (houseRoutes.js)

### 2. **Frontend Setup**
```bash
cd frontend
npm install axios
npm start
```

### 3. **Kiểm Tra Backend**
Backend API cần running trên `http://localhost:5000`

### 4. **Thử Nghiệm Tính Năng**

**Tạo Nhà:**
1. Đăng nhập bằng tài khoản Owner
2. Click "🏠 Nhà của tôi" trên navbar
3. Click "+ Tạo nhà mới"
4. Nhập tên và địa chỉ
5. Nhấn "Lưu"

**Quản Lý Thành Viên:**
1. Trên trang Houses, click "👥 Thành viên" trên card nhà
2. Nhập email người dùng muốn mời
3. Chọn vai trò
4. Nhấn "Gửi lời mời"

**Sử Dụng Dashboard:**
1. Đăng nhập
2. Chọn nhà từ dropdown ở đầu trang
3. Xem thông tin nhà được chọn

---

## 🎨 Styling

- Sử dụng gradient màu tím (#667eea - #764ba2)
- Component responsive cho mobile
- Animation smooth và UI hiện đại
- Dark theme cho Dashboard
- Card-based layout cho Houses

---

## ⚙️ Cấu Hình

### HouseSelector Props
```javascript
<HouseSelector 
  onHouseChange={(house) => console.log(house)}
  currentHouseId={houseId}
/>
```

### Members Props
```javascript
<Members 
  houseId={houseId}
  onClose={() => setSelectedHouseForMembers(null)}
/>
```

---

## 🔒 Quyền Hạn

### Routes Bảo Vệ
- `/houses` - Chỉ **Owner** và **Admin**
- `Users` page - **Owner**, **Admin**, **User**
- Dashboard - Tất cả user đã login

---

## 📝 Notes Quan Trọng

1. **Backend API**: Đảm bảo backend đã implement các route trong `houseRoutes.js`
2. **Authentication**: Sử dụng JWT token trong Authorization header
3. **Localhost**: Frontend gọi API từ `http://localhost:5000/api/houses`
4. **Responsive**: Các component tự động điều chỉnh cho mobile

---

## 🐛 Troubleshooting

**Lỗi: "GET /api/houses 404"**
→ Kiểm tra backend có route `/api/houses` không

**Lỗi: "Cannot read property '_id' of null"**
→ Đảm bảo user đã đăng nhập và có token

**Dropdown HouseSelector trống**
→ Backend chưa return nhà nào cho user

**Modal Members không hiển thị**
→ Kiểm tra browser console xem có lỗi API nào

---

## 📊 Workflow Ví Dụ

```
User (Owner)
    ↓
Navbar: Click "🏠 Nhà của tôi"
    ↓
Trang Houses.jsx
    ↓
[Tạo Nhà Mới] → API: POST /api/houses
    ↓
[Danh Sách Nhà]
    ↓
Click "👥 Thành viên" → Members Modal
    ↓
Nhập Email & Chọn Vai Trò → API: POST /api/houses/:id/invite
    ↓
Thành viên được thêm vào
    ↓
Dashboard → HouseSelector → Chọn Nhà
    ↓
Hiển thị Thiết Bị Của Nhà Đó
```

---

## ✨ Tính Năng Tiềm Năng (Phát Triển Sau)

- [ ] Chia sẻ quyền truy cập bằng link/QR code
- [ ] Xóa thành viên khỏi nhà
- [ ] Cấp/Thu hồi quyền riêng lẻ
- [ ] Lịch sử hoạt động của thành viên
- [ ] Thông báo khi có thành viên mới
- [ ] Upload ảnh nhà
- [ ] Ghi chú/Description cho nhà

---

**Chúc bạn sử dụng vui vẻ! 🎉**
