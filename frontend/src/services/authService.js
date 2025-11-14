import axios from 'axios';

const API_URL = "http://localhost:5000/api/auth";

const authClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true // always send cookies (server sets token cookie)
});

// Đăng ký
export async function register(name, email, password) {
  const res = await authClient.post("/register", { name, email, password });
  return res.data;
}

// Đăng nhập
export async function login(email, password) {
  const res = await authClient.post("/login", { email, password });
  // The server sets a cookie for the session token; response also includes token/user
  // Save token/user to localStorage for components that still rely on it
  try {
    if (res.data?.token) localStorage.setItem('token', res.data.token);
    if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user));
  } catch (e) {
    // ignore storage errors
  }
  return res.data;
}

// Lấy user hiện tại
export async function getCurrentUser() {
  // Prefer cookie-based `/me` endpoint (authClient sends cookies)
  try {
    const res = await authClient.get("/me");
    return res.data;
  } catch (err) {
    // If cookie-based auth fails, fallback to token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res2 = await authClient.get("/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res2.data;
    } catch (error) {
      return null;
    }
  }
}

// Đăng xuất
export async function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return { message: "Đã đăng xuất" };
}
