# 🚀 Quick Start - House Management

## ⚡ 5 Phút Để Khởi Động

### Step 1: Kiểm Tra Backend
Đảm bảo backend đang chạy trên `http://localhost:5000`:
```bash
cd backend
npm start
# Nên thấy: "Server running on port 5000"
```

### Step 2: Khởi Động Frontend
```bash
cd frontend
npm install  # Nếu chưa cài dependencies
npm start
# App sẽ mở ở http://localhost:5173
```

### Step 3: Đăng Nhập
1. Truy cập http://localhost:5173
2. Đăng nhập hoặc tạo tài khoản
3. Tài khoản cần có role **Owner** để truy cập quản lý nhà

### Step 4: Truy Cập Tính Năng
1. Nhấn "🏠 Nhà của tôi" trên thanh navigation
2. Hoặc truy cập trực tiếp: `http://localhost:5173/houses`

---

## 📖 Các Tính Năng Có Sẵn

### Trang Quản Lý Nhà
```
URL: /houses
Quyền: Owner, Admin
```

**Bạn có thể:**
- ✅ Tạo nhà mới
- ✅ Sửa thông tin nhà
- ✅ Xóa nhà
- ✅ Mời người vào nhà
- ✅ Quản lý vai trò thành viên

### Dashboard
```
URL: /
```

**Cải tiến:**
- ✅ Selector chọn nhà ở phía trên
- ✅ Hiển thị thông tin nhà đang chọn
- ✅ Điều khiển thiết bị theo từng nhà

---

## 🎮 Demo Flow

### Demo 1: Tạo Nhà Mới

1. **Vào Trang Quản Lý Nhà**
   - Click "🏠 Nhà của tôi" → Navbar

2. **Tạo Nhà**
   - Click "+ Tạo nhà mới"
   - Nhập: "Nhà Bình Thạnh"
   - Nhập: "123 Đường ABC, Q1, TP.HCM"
   - Click "Lưu"

3. **Kết Quả**
   - Nhà mới xuất hiện trên danh sách
   - Card hiển thị tên, địa chỉ, số thành viên, ngày tạo

---

### Demo 2: Quản Lý Thành Viên

1. **Mở Modal Thành Viên**
   - Trên card nhà → Click "👥 Thành viên"

2. **Mời Thành Viên**
   - Nhập: "user@example.com"
   - Chọn: "Thành viên"
   - Click "Gửi lời mời"

3. **Xem Kết Quả**
   - Người dùng được thêm vào danh sách thành viên
   - Hiển thị email, vai trò, quyền điều khiển

---

### Demo 3: Chọn Nhà Trên Dashboard

1. **Vào Dashboard**
   - Click "Trang chủ" hoặc vào `/`

2. **Chọn Nhà**
   - Kéo dropdown "Nhà của tôi:" ở phía trên
   - Chọn nhà muốn xem

3. **Xem Kết Quả**
   - Thanh "🏠 Nhà..." được cập nhật
   - Thiết bị được tải cho nhà đó

---

## 🔧 Troubleshooting

### ❌ Lỗi: "Cannot GET /api/houses"
**Giải pháp:**
- Kiểm tra backend có route `/api/houses` không
- Kiểm tra backend đang chạy (port 5000)
- Kiểm tra file `houseRoutes.js` được import trong `server.js`

### ❌ Lỗi: "Cannot read property '_id'"
**Giải pháp:**
- Kiểm tra localStorage có token không (login lại)
- Kiểm tra token còn hạn hay không
- Kiểm tra user có role "Owner" không

### ❌ Dropdown Trống Trắng
**Giải pháp:**
- Kiểm tra backend có trả nhà cho user không
- Tạo nhà mới trên trang `/houses`
- Reload lại trang

### ❌ Modal Members Không Hiển Thị
**Giải pháp:**
- Mở DevTools (F12) → Console
- Xem có error message nào không
- Kiểm tra API `/api/houses/:id` có hoạt động không

---

## 📊 Database Check

Để kiểm tra dữ liệu trong database:

```javascript
// Chạy trên MongoDB shell hoặc Compass

// Xem tất cả nhà
db.houses.find()

// Xem chi tiết một nhà
db.houses.findOne({ _id: ObjectId("...") })

// Xem tất cả user
db.users.find()
```

---

## 🎯 Các File Quan Trọng

| File | Mục đích |
|------|----------|
| `frontend/src/pages/Houses.jsx` | Trang quản lý nhà |
| `frontend/src/components/HouseSelector.jsx` | Dropdown chọn nhà |
| `frontend/src/components/Members.jsx` | Modal thành viên |
| `frontend/src/services/houseService.js` | API calls |
| `backend/routes/houseRoutes.js` | Backend endpoints |

---

## 💡 Tips & Tricks

### Tip 1: DevTools Network Tab
- Mở DevTools (F12)
- Tab "Network"
- Xem request/response của API calls
- Giúp debug lỗi

### Tip 2: Browser Console
- Mở DevTools → Console
- Xem error messages
- Test hàm: `localStorage.getItem('token')`

### Tip 3: React DevTools Extension
- Install "React Developer Tools" extension
- Debug state, props, components

---

## 🆘 Cần Giúp?

Kiểm tra:
1. ✅ Backend running (port 5000)
2. ✅ Frontend running (port 5173)
3. ✅ User đã login
4. ✅ User có role "Owner"
5. ✅ Token có trong localStorage
6. ✅ Database có dữ liệu

---

## ✨ Tiếp Theo

Sau khi test xong:
- [ ] Commit changes vào git
- [ ] Deploy frontend (Netlify, Vercel, etc.)
- [ ] Deploy backend (Heroku, Railway, etc.)
- [ ] Test trên production environment

---

**Vậy là xong! Bắt đầu sử dụng ngay thôi! 🎉**
