# 🏠 Smart Home React Application

Ứng dụng quản lý nhà thông minh (Smart Home) được xây dựng với React (Frontend) và Node.js/Express (Backend), hỗ trợ quản lý nhiều nhà, điều khiển thiết bị IoT qua MQTT, và quản lý người dùng với hệ thống phân quyền.

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Tính Năng](#tính-năng)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cài Đặt](#cài-đặt)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [API Endpoints](#api-endpoints)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [Tài Liệu](#tài-liệu)
- [Troubleshooting](#troubleshooting)
- [Đóng Góp](#đóng-góp)

---

## 🎯 Tổng Quan

Smart Home React là một hệ thống quản lý nhà thông minh toàn diện, cho phép:

- **Quản lý nhiều nhà**: Mỗi người dùng có thể tạo và quản lý nhiều nhà
- **Điều khiển thiết bị IoT**: Điều khiển đèn, quạt, điều hòa, camera qua giao thức MQTT
- **Quản lý thành viên**: Mời người dùng vào nhà và phân quyền chi tiết
- **Theo dõi cảm biến**: Hiển thị dữ liệu nhiệt độ, độ ẩm từ cảm biến
- **Lập lịch tự động**: Tạo lịch bật/tắt thiết bị tự động
- **Thống kê năng lượng**: Theo dõi tiêu thụ điện năng theo ngày

---

## ✨ Tính Năng

### 🏘️ Quản Lý Nhà
- ✅ Tạo, sửa, xóa nhiều nhà
- ✅ Quản lý thông tin nhà (tên, địa chỉ)
- ✅ Chọn nhà hiện tại trên Dashboard
- ✅ Hiển thị thông tin nhà đang chọn

### 👥 Quản Lý Thành Viên
- ✅ Mời người dùng vào nhà qua email
- ✅ Phân quyền theo vai trò (Owner/Member)
- ✅ Quản lý quyền điều khiển thiết bị (toàn quyền hoặc theo từng thiết bị)
- ✅ Xem danh sách thành viên trong nhà

### 🎛️ Điều Khiển Thiết Bị
- ✅ **Đèn**: Bật/tắt
- ✅ **Quạt**: Bật/tắt, điều chỉnh tốc độ (0-5)
- ✅ **Điều hòa**: Bật/tắt, điều chỉnh nhiệt độ (16-30°C)
- ✅ **Camera**: Bật/tắt, xem stream
- ✅ Cập nhật trạng thái real-time qua MQTT
- ✅ Kiểm tra quyền trước khi điều khiển

### 📊 Cảm Biến & Giám Sát
- ✅ Hiển thị nhiệt độ phòng
- ✅ Hiển thị độ ẩm
- ✅ Quản lý cảm biến (thêm, sửa, xóa) - chỉ Owner/Admin
- ✅ Hiển thị cảm biến trên Dashboard
- ✅ Map giá trị real-time từ MQTT theo mqttKey
- ✅ Cập nhật dữ liệu real-time (polling mỗi 5 giây)
- ✅ Hỗ trợ nhiều loại cảm biến: nhiệt độ, độ ẩm, ánh sáng, gas, motion

### 📅 Lập Lịch Tự Động
- ✅ Tạo lịch bật/tắt thiết bị
- ✅ Thiết lập thời gian lặp lại
- ✅ Quản lý lịch biểu

### 📈 Thống Kê
- ✅ Thống kê tiêu thụ điện năng theo ngày
- ✅ Biểu đồ hiển thị dữ liệu
- ✅ Theo dõi theo từng thiết bị

### 🔐 Bảo Mật & Phân Quyền
- ✅ JWT Authentication
- ✅ Role-based Access Control (Admin, Owner, User)
- ✅ Protected Routes
- ✅ Quyền điều khiển thiết bị theo nhà
- ✅ Quyền quản lý cảm biến (Owner/Admin mới được thêm/sửa/xóa)
- ✅ Member/User chỉ xem cảm biến

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **React 19.1.1** - UI Framework
- **React Router DOM 7.9.1** - Routing
- **Vite 7.1.2** - Build tool & Dev server
- **Axios 1.12.2** - HTTP Client
- **Recharts 3.2.0** - Data visualization
- **Tailwind CSS 4.1.13** - Styling (optional)

### Backend
- **Node.js** - Runtime
- **Express 5.1.0** - Web framework
- **MongoDB + Mongoose 8.18.2** - Database & ODM
- **MQTT 5.14.1** - IoT communication protocol
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **bcryptjs 3.0.2** - Password hashing
- **CORS 2.8.5** - Cross-origin resource sharing

### Infrastructure
- **MongoDB** - Database
- **MQTT Broker** (broker.emqx.io) - IoT messaging

---

## 📦 Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js >= 16.x
- MongoDB >= 4.x
- npm hoặc yarn

### Bước 1: Clone Repository
```bash
git clone <repository-url>
cd SmartHome-React
```

### Bước 2: Cài Đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:
```env
MONGO_URI=mongodb://localhost:27017/
MONGO_DB=smarthome
JWT_SECRET=your-secret-key-here
PORT=5000
```

Khởi động backend:
```bash
npm start
# hoặc với nodemon (auto-reload)
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`

### Bước 3: Cài Đặt Frontend

```bash
cd frontend
npm install
```

Khởi động frontend:
```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

### Bước 4: Kiểm Tra Kết Nối

1. **MongoDB**: Đảm bảo MongoDB đang chạy
2. **Backend**: Kiểm tra console có thông báo "✅ MongoDB Connected" và "✅ Server chạy tại http://localhost:5000"
3. **Frontend**: Mở trình duyệt tại `http://localhost:5173`
4. **MQTT**: Backend sẽ tự động kết nối đến MQTT broker (broker.emqx.io)

---

## 📁 Cấu Trúc Dự Án

```
SmartHome-React/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   └── authController.js     # Authentication logic
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── House.js              # House schema
│   │   ├── DeviceLog.js          # Device logs
│   │   ├── PowerConsumption.js  # Power stats
│   │   ├── Schedule.js           # Schedules
│   │   └── Sensor.js             # Sensor data
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── userRoutes.js         # /api/users
│   │   ├── houseRoutes.js        # /api/houses
│   │   ├── deviceRoutes.js       # /api/devices
│   │   ├── sensorRoutes.js       # /api/sensors
│   │   ├── scheduleRoutes.js    # /api/schedules
│   │   └── powerStatsRoutes.js  # /api/power-stats
│   ├── services/
│   │   └── mqttService.js        # MQTT connection & handlers
│   ├── server.js                 # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation bar
│   │   │   ├── Sidebar.jsx       # Sidebar menu
│   │   │   ├── Card.jsx          # Reusable card component
│   │   │   ├── Chart.jsx         # Chart wrapper
│   │   │   ├── Table.jsx         # Data table
│   │   │   ├── HouseSelector.jsx # House dropdown
│   │   │   ├── Members.jsx       # Member management modal
│   │   │   └── ProtectedRoute.jsx # Route protection
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── Houses.jsx        # House management
│   │   │   ├── Sensors.jsx       # Sensor data
│   │   │   ├── Schedules.jsx     # Schedule management
│   │   │   ├── Users.jsx        # User management
│   │   │   ├── Settings.jsx      # Settings page
│   │   │   ├── DangNhap.jsx     # Login page
│   │   │   └── DangKy.jsx       # Register page
│   │   ├── services/
│   │   │   ├── api.js            # Axios instance
│   │   │   ├── authService.js    # Auth API calls
│   │   │   ├── userService.js    # User API calls
│   │   │   ├── houseService.js   # House API calls
│   │   │   ├── deviceService.js  # Device API calls
│   │   │   ├── sensorService.js  # Sensor API calls
│   │   │   └── scheduleService.js # Schedule API calls
│   │   ├── context/
│   │   │   └── HouseContext.jsx  # Global house state
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Global styles
│   ├── package.json
│   └── vite.config.js
│
└── README.md                     # This file
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
```
POST   /api/auth/register     # Đăng ký tài khoản
POST   /api/auth/login         # Đăng nhập
GET    /api/auth/me            # Lấy thông tin user hiện tại
POST   /api/auth/logout        # Đăng xuất
```

### Users (`/api/users`)
```
GET    /api/users              # Lấy danh sách users (Admin/Owner)
POST   /api/users              # Tạo user mới (Admin)
PUT    /api/users/:userId      # Cập nhật user (Admin)
DELETE /api/users/:userId      # Xóa user (Admin)
```

### Houses (`/api/houses`)
```
GET    /api/houses                    # Lấy danh sách nhà của user
POST   /api/houses                    # Tạo nhà mới (Owner/Admin)
GET    /api/houses/:houseId           # Lấy chi tiết nhà
PUT    /api/houses/:houseId           # Cập nhật nhà (Owner)
DELETE /api/houses/:houseId           # Xóa nhà (Owner)
POST   /api/houses/:houseId/invite    # Mời user vào nhà (Owner)
PUT    /api/houses/:houseId/members/:memberId/permissions  # Cập nhật quyền thành viên
```

### Devices (`/api/devices`)
```
POST   /api/devices                           # Tạo thiết bị mới
GET    /api/devices/house/:houseId            # Lấy danh sách thiết bị theo nhà
POST   /api/devices/:deviceId/control         # Điều khiển thiết bị
PUT    /api/devices/:deviceId/telemetry       # Cập nhật telemetry
POST   /api/devices/:deviceId/permissions/add  # Thêm quyền thiết bị
POST   /api/devices/:deviceId/permissions/remove # Xóa quyền thiết bị
```

### Sensors (`/api/sensors`)
```
GET    /api/sensors/:houseId                  # Lấy danh sách cảm biến (tất cả member)
POST   /api/sensors/:houseId/add              # Thêm cảm biến mới (Owner/Admin)
PUT    /api/sensors/update/:sensorId          # Cập nhật cảm biến (Owner/Admin)
DELETE /api/sensors/delete/:sensorId          # Xóa cảm biến (Owner/Admin)
```


### Schedules (`/api/schedules`)
```
GET    /api/schedules/:houseId        # Lấy lịch biểu
POST   /api/schedules                 # Tạo lịch mới
PUT    /api/schedules/:scheduleId    # Cập nhật lịch
DELETE /api/schedules/:scheduleId    # Xóa lịch
```

### Power Stats (`/api/power-stats`)
```
GET    /api/power-stats/:houseId     # Lấy thống kê tiêu thụ điện
```

---

## 🚀 Hướng Dẫn Sử Dụng

### Đăng Ký & Đăng Nhập

1. Truy cập `http://localhost:5173/register`
2. Điền thông tin: Tên, Email, Mật khẩu, Vai trò
3. Click "Đăng ký"
4. Đăng nhập tại `http://localhost:5173/dangnhap`

### Quản Lý Nhà

1. Đăng nhập với tài khoản có role **Owner** hoặc **Admin**
2. Click "🏠 Nhà của tôi" trên navbar
3. Click "+ Tạo nhà mới" để tạo nhà
4. Nhập tên và địa chỉ nhà
5. Click "Lưu"

### Mời Thành Viên

1. Vào trang quản lý nhà (`/houses`)
2. Click "👥 Thành viên" trên card nhà
3. Nhập email người dùng cần mời
4. Chọn vai trò (Owner/Member)
5. Click "Gửi lời mời"

### Điều Khiển Thiết Bị

1. Vào Dashboard (`/`)
2. Chọn nhà từ dropdown "Nhà của tôi"
3. Click nút "Bật/Tắt" trên card thiết bị
4. Điều chỉnh nhiệt độ (điều hòa) hoặc tốc độ (quạt) bằng slider

### Quản Lý Cảm Biến

1. Vào trang "Cảm biến" (`/sensors`)
2. Chọn nhà từ dropdown
3. **Owner/Admin**: Click "+ Thêm cảm biến" để thêm cảm biến mới
4. Nhập thông tin: Tên, Loại, Vị trí, MQTT Key, Đơn vị
5. **Owner/Admin**: Có thể sửa/xóa cảm biến bằng nút trên bảng
6. **Member/User**: Chỉ xem danh sách cảm biến, không thể thêm/sửa/xóa

### Xem Cảm Biến Trên Dashboard

1. Vào Dashboard (`/`)
2. Chọn nhà từ dropdown
3. Cuộn xuống phần "📊 Cảm Biến"
4. Xem danh sách cảm biến với giá trị real-time từ MQTT

### Tạo Lịch Tự Động

1. Vào trang "Lịch biểu" (`/schedules`)
2. Click "Tạo lịch mới"
3. Chọn thiết bị, thời gian, hành động
4. Lưu lịch

---

## 📚 Tài Liệu

Dự án có nhiều tài liệu chi tiết:

### Tài Liệu Chính
- **[00_START_HERE.md](./00_START_HERE.md)** - Bắt đầu tại đây! Tổng quan nhanh
- **[QUICK_START.md](./QUICK_START.md)** - Hướng dẫn khởi động nhanh (5 phút)
- **[README_HOUSE_FEATURE.md](./README_HOUSE_FEATURE.md)** - Tài liệu tính năng quản lý nhà
- **[HOUSE_MANAGEMENT_GUIDE.md](./HOUSE_MANAGEMENT_GUIDE.md)** - Hướng dẫn chi tiết quản lý nhà
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Sơ đồ kiến trúc hệ thống
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Mục lục tất cả tài liệu

### Tài Liệu Kỹ Thuật
- **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)** - Tóm tắt các thay đổi
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Checklist kiểm tra
- **[frontend/src/services/HOUSE_SERVICE_README.md](./frontend/src/services/HOUSE_SERVICE_README.md)** - API service documentation

---

## 🐛 Troubleshooting

### Lỗi: "Cannot GET /api/houses"
**Nguyên nhân**: Backend chưa chạy hoặc route chưa được đăng ký
**Giải pháp**:
- Kiểm tra backend đang chạy trên port 5000
- Kiểm tra file `server.js` có import `houseRoutes` không
- Kiểm tra MongoDB đã kết nối

### Lỗi: "MongoDB connection failed"
**Nguyên nhân**: MongoDB chưa chạy hoặc URI sai
**Giải pháp**:
- Khởi động MongoDB: `mongod` hoặc qua MongoDB Compass
- Kiểm tra `MONGO_URI` trong file `.env`
- Kiểm tra MongoDB đang chạy trên port 27017

### Lỗi: "User not found" khi mời thành viên
**Nguyên nhân**: Email người dùng chưa đăng ký
**Giải pháp**:
- Đảm bảo người dùng đã đăng ký tài khoản trước
- Kiểm tra email đúng định dạng

### Lỗi: "Forbidden" khi truy cập `/houses`
**Nguyên nhân**: User không có quyền Owner/Admin
**Giải pháp**:
- Đăng nhập với tài khoản có role "Owner" hoặc "Admin"
- Kiểm tra role trong database

### Lỗi: MQTT không kết nối
**Nguyên nhân**: Mạng hoặc broker không khả dụng
**Giải pháp**:
- Kiểm tra kết nối internet
- Kiểm tra broker.emqx.io có hoạt động không
- Xem console backend có thông báo lỗi MQTT

### Lỗi: "404 Not Found" khi tạo thiết bị
**Nguyên nhân**: Route backend không đúng
**Giải pháp**:
- Kiểm tra `deviceRoutes.js` có route `POST /` (không phải `/devices`)
- Đảm bảo backend đã restart sau khi sửa routes
- Kiểm tra `server.js` có mount route `/api/devices` đúng không

### Lỗi: "404 Not Found" khi update/delete cảm biến
**Nguyên nhân**: Route backend bị conflict
**Giải pháp**:
- Đảm bảo route update/delete dùng prefix `/update/:sensorId` và `/delete/:sensorId`
- Route cụ thể phải đứng trước route có param động
- Restart backend sau khi sửa routes

### Lỗi: CORS Error
**Nguyên nhân**: Frontend và Backend khác origin
**Giải pháp**:
- Kiểm tra CORS config trong `server.js`
- Đảm bảo frontend chạy trên port 5173
- Kiểm tra `credentials: true` trong CORS config

---

## 🔒 Bảo Mật

### Authentication
- JWT tokens được lưu trong `localStorage` (frontend) và cookies (backend)
- Tokens có thời hạn và cần refresh khi hết hạn

### Authorization
- **Admin**: Toàn quyền hệ thống
- **Owner**: Quản lý nhà và thành viên
- **User**: Xem và điều khiển thiết bị (nếu được cấp quyền)

### Best Practices
- Mật khẩu được hash bằng bcrypt
- API endpoints được bảo vệ bởi `authMiddleware`
- Routes được bảo vệ bởi `ProtectedRoute`
- Kiểm tra quyền trước khi thực hiện hành động

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập với email/password
- [ ] Đăng xuất
- [ ] Truy cập protected route khi chưa đăng nhập

#### House Management
- [ ] Tạo nhà mới
- [ ] Sửa thông tin nhà
- [ ] Xóa nhà
- [ ] Xem danh sách nhà

#### Member Management
- [ ] Mời thành viên vào nhà
- [ ] Xem danh sách thành viên
- [ ] Cập nhật quyền thành viên

#### Device Control
- [ ] Bật/tắt đèn
- [ ] Điều chỉnh tốc độ quạt
- [ ] Điều chỉnh nhiệt độ điều hòa
- [ ] Bật/tắt camera

#### Permissions
- [ ] User không có quyền không thể điều khiển thiết bị
- [ ] Owner có thể quản lý nhà
- [ ] Admin có toàn quyền

---

## 🚀 Deployment

### Backend Deployment

1. **Environment Variables**: Đảm bảo set các biến môi trường:
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key cho JWT
   - `PORT`: Port server (mặc định 5000)

2. **Platforms**: Có thể deploy lên:
   - Heroku
   - Railway
   - Render
   - DigitalOcean

### Frontend Deployment

1. **Build**: 
   ```bash
   cd frontend
   npm run build
   ```

2. **Platforms**: Có thể deploy lên:
   - Vercel
   - Netlify
   - GitHub Pages
   - Firebase Hosting

3. **Environment**: Cập nhật `API_BASE_URL` trong `api.js` thành URL backend production

---

## 🤝 Đóng Góp

### Cách Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Code Style

- Sử dụng ESLint config có sẵn
- Format code với Prettier (nếu có)
- Viết comments cho code phức tạp
- Follow React best practices

---

## 📝 License

MIT License - Tự do sử dụng, chỉnh sửa, phân phối

---

## 👥 Tác Giả

Dự án được phát triển cho mục đích học tập và nghiên cứu.

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra [Troubleshooting](#troubleshooting) section
2. Xem [Tài Liệu](#tài-liệu) chi tiết
3. Kiểm tra browser console và network tab
4. Kiểm tra backend logs

---

## 🎯 Roadmap

### Tính Năng Sắp Tới
- [ ] Upload ảnh nhà
- [ ] QR code để mời thành viên
- [ ] Lịch sử hoạt động
- [ ] Thông báo real-time
- [ ] Xóa thành viên khỏi nhà
- [ ] Cấp quyền chi tiết theo từng thiết bị
- [ ] Mobile app (React Native)
- [ ] Voice control (Google Assistant, Alexa)

---

## 📊 Thống Kê Dự Án

- **Frontend**: React 19 + Vite
- **Backend**: Node.js + Express 5
- **Database**: MongoDB
- **IoT Protocol**: MQTT
- **Total Files**: 100+ files
- **Lines of Code**: 5000+ lines
- **Components**: 15+ React components
- **API Endpoints**: 20+ endpoints

---

**Cảm ơn bạn đã sử dụng Smart Home React! 🎉**

Để bắt đầu, hãy đọc [00_START_HERE.md](./00_START_HERE.md) hoặc [QUICK_START.md](./QUICK_START.md)

