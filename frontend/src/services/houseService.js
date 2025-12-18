//import axios from 'axios';
import { api as apiClient } from './api';
// const API_BASE_URL = 'http://localhost:5000/api/houses';

// const getToken = () => localStorage.getItem('token');

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Interceptor để thêm token vào mỗi request
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = getToken();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// Lấy danh sách tất cả nhà của user
export const getAllHouses = async () => {
  try {
    const response = await apiClient.get('/houses');
    return response.data;
  } catch (error) {
    console.error('Error fetching houses:', error);
    throw error;
  }
};

// Tạo nhà mới
export const createHouse = async (houseData) => {
  try {
    const response = await apiClient.post('/houses', houseData);
    return response.data;
  } catch (error) {
    console.error('Error creating house:', error);
    throw error;
  }
};

// Lấy chi tiết một nhà
export const getHouseById = async (houseId) => {
  try {
    const response = await apiClient.get(`/houses/${houseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching house details:', error);
    throw error;
  }
};

// Cập nhật thông tin nhà
export const updateHouse = async (houseId, houseData) => {
  try {
    const response = await apiClient.put(`/houses/${houseId}`, houseData);
    return response.data;
  } catch (error) {
    console.error('Error updating house:', error);
    throw error;
  }
};

// Xóa nhà
export const deleteHouse = async (houseId) => {
  try {
    const response = await apiClient.delete(`/houses/${houseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting house:', error);
    throw error;
  }
};

// Mời user vào nhà
export const inviteUserToHouse = async (houseId, inviteData) => {
  try {
    const response = await apiClient.post(`/houses/${houseId}/invite`, inviteData);
    return response.data;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
};

// Cập nhật quyền thiết bị của thành viên
export const updateMemberPermissions = async (houseId, memberId, permissionsData) => {
  try {
    const response = await apiClient.put(`/houses/${houseId}/members/${memberId}/permissions`, permissionsData);
    return response.data;
  } catch (error) {
    console.error('Error updating member permissions:', error);
    throw error;
  }
};

// Gửi lệnh re-bind house
export const bindHouse = async (houseId) => {
  try {
    const response = await apiClient.post(`/houses/${houseId}/bind`);
    return response.data;
  } catch (error) {
    console.error('Error binding house:', error);
    throw error;
  }
};

export default apiClient;
