import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create the axios instance and export it as a NAMED export 'api'
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.token) {
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);