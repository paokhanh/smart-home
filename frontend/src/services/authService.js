const API_URL = "http://localhost:5000/api/auth";

// Đăng ký
export async function register(name, email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
    credentials: "include"  // cho phép gửi & nhận cookie
  });
  return res.json();
}

// Đăng nhập
export async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });
  return res.json();
}

// Lấy user hiện tại
export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/me`, {
    method: "GET",
    credentials: "include"
  });
  return res.json();
}

// Đăng xuất
export async function logout() {
  const res = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include"
  });
  return res.json();
}
