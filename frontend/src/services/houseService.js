import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/houses';

const getToken = () => localStorage.getItem('token');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Lấy danh sách tất cả nhà của user
export const getAllHouses = async () => {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching houses:', error);
    throw error;
  }
};

// Tạo nhà mới
export const createHouse = async (houseData) => {
  try {
    const response = await apiClient.post('/', houseData);
    return response.data;
  } catch (error) {
    console.error('Error creating house:', error);
    throw error;
  }
};

// Lấy chi tiết một nhà
export const getHouseById = async (houseId) => {
  try {
    const response = await apiClient.get(`/${houseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching house details:', error);
    throw error;
  }
};

// Cập nhật thông tin nhà
export const updateHouse = async (houseId, houseData) => {
  try {
    const response = await apiClient.put(`/${houseId}`, houseData);
    return response.data;
  } catch (error) {
    console.error('Error updating house:', error);
    throw error;
  }
};

// Xóa nhà
export const deleteHouse = async (houseId) => {
  try {
    const response = await apiClient.delete(`/${houseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting house:', error);
    throw error;
  }
};

// Mời user vào nhà
export const inviteUserToHouse = async (houseId, inviteData) => {
  try {
    const response = await apiClient.post(`/${houseId}/invite`, inviteData);
    return response.data;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
};

// Cập nhật quyền thiết bị của thành viên
export const updateMemberPermissions = async (houseId, memberId, permissionsData) => {
  try {
    const response = await apiClient.put(`/${houseId}/members/${memberId}/permissions`, permissionsData);
    return response.data;
  } catch (error) {
    console.error('Error updating member permissions:', error);
    throw error;
  }
};

export default apiClient;
