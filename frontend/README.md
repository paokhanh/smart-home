# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# SmartHome-React — README

Tổng quan
- Ứng dụng Smart Home: frontend (React) + backend (Express + MongoDB).
- Frontend chạy trên port mặc định Vite (5173). Backend chạy trên port 5000.

Cấu trúc chính
- backend/
  - server.js — cấu hình express, CORS, cookie-parser, đăng ký route
  - routes/
    - authRoutes.js — register, login, /me, logout
    - userRoutes.js — CRUD user (yêu cầu auth + kiểm tra role)
  - models/
    - User.js — schema user (role enum: "Admin","Owner","User")
  - middleware/
    - authMiddleWare.js — kiểm tra JWT từ cookie
  - config/
    - db.js — kết nối mongoose
  - .env — MONGO_URI, MONGO_DB, JWT_SECRET, PORT
- frontend/
  - src/
    - pages/
      - Dashboard.jsx — trang dashboard (Chart)
      - DangKy.jsx — trang đăng ký
      - DangNhap.jsx — trang đăng nhập
      - Users.jsx — quản lý người dùng (modal thêm/sửa/xóa)
    - components/
      - Chart.jsx — Recharts wrapper (ResponsiveContainer)
      - Card.jsx
      - Table.jsx — bảng dữ liệu (hỗ trợ customRender)
      - Navbar.jsx, Sidebar.jsx
      - ProtectedRoute.jsx — kiểm soát route theo user role
      - ConfirmModal.jsx (gợi ý) — modal xác nhận
    - services/
      - authService.js — gọi API /api/auth
      - userService.js — gọi API /api/users
    - styles: dangky.css, dangnhap.css, sidebar.css, navbar.css, table.css, ...
  - package.json, vite config, ...

Cấu hình & chạy
1. Backend
   - Tạo .env (ví dụ có sẵn backend/.env)
   - cd backend && npm install
   - npm run dev (nodemon) hoặc node server.js
2. Frontend
   - cd frontend && npm install
   - npm run dev (Vite)

API chính
- POST /api/auth/register — đăng ký (trả { success: true/false })
- POST /api/auth/login — đăng nhập (đặt cookie JWT)
- GET /api/auth/me — lấy user hiện tại (authMiddleware)
- GET /api/users — lấy danh sách (chỉ Admin/Owner)
- POST/PUT/DELETE /api/users — CRUD user (Admin/Owner)

Lưu ý / Fix đã thực hiện
- Role phải đồng bộ chữ hoa đầu theo enum User.js ("Admin","Owner","User"). Nếu DB chứa "admin"/"user", chạy:
  ```
  db.users.updateMany({ role: "user" }, { $set: { role: "User" } })
  ```
  (chạy trong MongoDB Compass / shell)
- Khi admin tạo user mới: phải hash mật khẩu bằng bcrypt trước khi lưu (tránh lưu plain text).
- Khi dùng Recharts + ResponsiveContainer: truyền height prop từ Chart component (không dùng height="100%" cha không có chiều cao). Card nên dùng flex layout để footer không bị đè.
- CORS: backend sử dụng credentials: true và origin: "http://localhost:5173".
- ProtectedRoute: so sánh role ignore case hoặc dùng cùng chuẩn (đã chỉnh thành so sánh chữ hoa đầu).

Kiểm tra lỗi phổ biến
- 500 Internal Server Error khi register => thường do role không hợp lệ (enum mismatch) hoặc validation error.
- 400 Bad Request khi login sau admin tạo user => do mật khẩu chưa hash.
- 404 /api/auth/login => route chưa tồn tại hoặc backend chưa mount route.

Gợi ý nâng cấp
- Tạo component ConfirmModal để thay thế window.confirm.
- Đồng bộ CSS đăng nhập/đăng ký: dùng cùng container, inputs, button styles.
- Thêm unit tests cho services và route handlers.

Nếu cần, tôi có thể:
- Sinh file README hoàn chỉnh (cập nhật thêm thông tin bạn muốn).
- Cập nhật code cụ thể (hash password khi tạo user, sửa Chart height, thêm ConfirmModal).