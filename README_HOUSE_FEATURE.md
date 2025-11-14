# 🏠 Smart Home - House Management Feature

Tính năng quản lý nhiều nhà cho chủ nhà trong ứng dụng Smart Home React.

---

## 📚 Tài Liệu

Có ba tài liệu hướng dẫn:

1. **QUICK_START.md** ⚡
   - Hướng dẫn khởi động nhanh (5 phút)
   - Demo flow các tính năng
   - Troubleshooting cơ bản

2. **HOUSE_MANAGEMENT_GUIDE.md** 📖
   - Hướng dẫn chi tiết đầy đủ
   - Mô tả tất cả tính năng
   - API endpoints
   - Data models
   - Quyền hạn & bảo mật

3. **CHANGES_SUMMARY.md** 📝
   - Tóm tắt tất cả các thay đổi
   - Danh sách files tạo mới
   - Danh sách files được cập nhật
   - Checklist testing

---

## ✨ Các Tính Năng

### 1️⃣ Quản Lý Nhà
- ✅ Tạo nhà mới
- ✅ Sửa thông tin nhà
- ✅ Xóa nhà
- ✅ Xem danh sách nhà

### 2️⃣ Quản Lý Thành Viên
- ✅ Mời người vào nhà
- ✅ Gán vai trò (Owner/Member)
- ✅ Quản lý quyền điều khiển
- ✅ Xem danh sách thành viên

### 3️⃣ Dashboard Cải Tiến
- ✅ Selector chọn nhà
- ✅ Hiển thị thông tin nhà
- ✅ Điều khiển thiết bị theo nhà

---

## 📁 Cấu Trúc File

```
SmartHome-React/
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── houseService.js (NEW)           ← API calls
│   │   │   └── HOUSE_SERVICE_README.md (NEW)   ← API docs
│   │   ├── components/
│   │   │   ├── HouseSelector.jsx (NEW)         ← Dropdown chọn nhà
│   │   │   ├── houseselector.css (NEW)
│   │   │   ├── Members.jsx (NEW)               ← Modal quản lý
│   │   │   ├── members.css (NEW)
│   │   │   ├── Navbar.jsx (UPDATED)            ← Thêm link
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Houses.jsx (NEW)                ← Trang quản lý
│   │   │   ├── houses.css (NEW)
│   │   │   ├── Dashboard.jsx (UPDATED)         ← Thêm selector
│   │   │   ├── dashboard.css (UPDATED)
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── HouseContext.jsx (NEW)          ← State management
│   │   └── App.jsx (UPDATED)                   ← Route mới
│   └── ...
├── backend/
│   ├── routes/
│   │   └── houseRoutes.js (cần có)
│   └── models/
│       └── House.js (cần có)
├── QUICK_START.md (NEW)                 ⚡
├── HOUSE_MANAGEMENT_GUIDE.md (NEW)      📖
├── CHANGES_SUMMARY.md (NEW)             📝
└── README.md (THIS FILE)
```

---

## 🚀 Bắt Đầu

### Cách 1: Quick Start (Khuyến Nghị)
```bash
# 1. Mở QUICK_START.md
# 2. Làm theo 5 bước

# Tóm tắt:
cd backend && npm start      # Terminal 1
cd frontend && npm start     # Terminal 2
# Vào http://localhost:5173
# Click "🏠 Nhà của tôi"
```

### Cách 2: Chi Tiết
- Đọc **HOUSE_MANAGEMENT_GUIDE.md** để hiểu rõ từng tính năng

### Cách 3: Developer
- Xem **CHANGES_SUMMARY.md** để biết chính xác có gì thay đổi

---

## 📦 Cài Đặt Dependencies

Frontend đã có `axios` trong `package.json`. Nếu cần cài thêm:

```bash
cd frontend
npm install  # Cài tất cả dependencies
```

Backend cần `express`, `mongoose`, etc. (đã có sẵn)

---

## 🔒 Quyền Truy Cập

| Tính Năng | User | Member | Owner | Admin |
|----------|------|--------|-------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Nhà | ✅ | ✅ | ✅ | ✅ |
| Quản Lý Nhà | ❌ | ❌ | ✅ | ✅ |
| Thêm Thành Viên | ❌ | ❌ | ✅ | ✅ |
| Xóa Nhà | ❌ | ❌ | ✅ | ✅ |

---

## 🎯 Workflow Ví Dụ

### Kịch Bản 1: Chủ Nhà Tạo Nhà
```
1. Login với role Owner
2. Click "🏠 Nhà của tôi"
3. Click "+ Tạo nhà mới"
4. Nhập tên & địa chỉ
5. Click "Lưu"
✅ Nhà được tạo
```

### Kịch Bản 2: Mời Thành Viên
```
1. Trên trang Houses
2. Click "👥 Thành viên" trên card nhà
3. Nhập email người dùng
4. Chọn vai trò (Owner/Member)
5. Click "Gửi lời mời"
✅ Người dùng được thêm
```

### Kịch Bản 3: Điều Khiển Thiết Bị
```
1. Vào Dashboard
2. Chọn nhà từ dropdown
3. Thông tin nhà được hiển thị
4. Điều khiển thiết bị của nhà đó
✅ Thiết bị hoạt động đúng nhà
```

---

## 🧪 Testing

Checklist để test:

- [ ] Tạo nhà mới
- [ ] Sửa tên/địa chỉ nhà
- [ ] Xóa nhà
- [ ] Mời thành viên
- [ ] Thay đổi vai trò
- [ ] Chọn nhà trên Dashboard
- [ ] Xem thông tin nhà
- [ ] Test trên mobile (responsive)
- [ ] Error handling (invalid email, etc.)

---

## 🐛 Nếu Gặp Lỗi

**Bước 1:** Kiểm tra console
```
Mở DevTools (F12) → Console
Xem có error message không
```

**Bước 2:** Kiểm tra backend
```
Backend có running trên port 5000 không
Có route /api/houses không
```

**Bước 3:** Kiểm tra authentication
```
localStorage có token không
User có role "Owner" không
```

**Bước 4:** Xem chi tiết
- Mở QUICK_START.md → Troubleshooting section

---

## 📊 API Reference

### Core Endpoints
```javascript
GET    /api/houses                    - Danh sách nhà
POST   /api/houses                    - Tạo nhà
PUT    /api/houses/:houseId           - Cập nhật nhà
DELETE /api/houses/:houseId           - Xóa nhà
GET    /api/houses/:houseId           - Chi tiết nhà
POST   /api/houses/:houseId/invite    - Mời thành viên
```

### Response Example
```json
{
  "_id": "60d5ec49c1234567890abcd",
  "name": "Nhà Bình Thạnh",
  "address": "123 Đường ABC, Q1",
  "owners": ["60d5ec49c1234567890user1"],
  "members": [
    {
      "userId": "60d5ec49c1234567890user1",
      "role": "Owner",
      "canControlDevices": true
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

## 🎨 UI/UX

### Design System
- **Primary Color:** #667eea → #764ba2 (Gradient tím)
- **Success:** #28a745 (Xanh)
- **Danger:** #dc3545 (Đỏ)
- **Neutral:** #f8f9fa (Xám nhạt)

### Components
- Card-based design
- Smooth animations
- Responsive grid
- Modal dialogs
- Dropdown selectors

---

## 🔄 State Management

Có hai cách quản lý state:

### Option 1: Local State (Hiện Tại)
Mỗi component quản lý state riêng
- Đơn giản, không phức tạp
- Tốt cho dự án nhỏ

### Option 2: Context API (Sẵn)
`HouseContext.jsx` có sẵn cho shared state
- Tốt cho dự án lớn
- Giảm prop drilling

**Cách sử dụng Context:**
```javascript
import { useHouses } from '../context/HouseContext';

function MyComponent() {
  const { houses, selectedHouse, selectHouse } = useHouses();
  // ...
}
```

---

## 📚 Các Tài Liệu

Đọc theo thứ tự:

1. **README.md** (file này) - Overview
2. **QUICK_START.md** - Khởi động nhanh
3. **HOUSE_MANAGEMENT_GUIDE.md** - Chi tiết
4. **CHANGES_SUMMARY.md** - Thay đổi
5. **HOUSE_SERVICE_README.md** - API docs

---

## 🎓 Learning Path

### Newbie
1. Đọc QUICK_START.md
2. Chạy ứng dụng
3. Test các tính năng
4. Đọc HOUSE_MANAGEMENT_GUIDE.md

### Developer
1. Xem CHANGES_SUMMARY.md
2. Xem cấu trúc file
3. Đọc HOUSE_SERVICE_README.md
4. Explore source code

### Advanced
1. Chỉnh sửa HouseContext.jsx
2. Thêm tính năng mới
3. Optimize performance
4. Deploy lên production

---

## 🚀 Tiếp Theo

### Phát Triển Thêm
- [ ] Chia sẻ nhà qua QR code
- [ ] Upload ảnh nhà
- [ ] Lịch sử hoạt động
- [ ] Xóa thành viên
- [ ] Cấp quyền riêng lẻ

### Production Ready
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Setup domain
- [ ] HTTPS certificates
- [ ] Monitoring & logging

---

## 📞 Support

Nếu cần hỗ trợ:
1. Kiểm tra Troubleshooting section
2. Kiểm tra browser console
3. Kiểm tra API response (Network tab)
4. Đọc lại tài liệu

---

## 📄 License

MIT License - Tự do sử dụng, chỉnh sửa, phân phối

---

## ✅ Checklist Hoàn Thành

- ✅ Service APIs (houseService.js)
- ✅ Components (HouseSelector, Members)
- ✅ Pages (Houses)
- ✅ Context (HouseContext)
- ✅ CSS Styling (Responsive)
- ✅ Routes Protection (ProtectedRoute)
- ✅ Error Handling
- ✅ Documentation

---

**Tính năng quản lý nhiều nhà đã sẵn sàng sử dụng! 🎉**

Bắt đầu với **QUICK_START.md** ngay bây giờ!
