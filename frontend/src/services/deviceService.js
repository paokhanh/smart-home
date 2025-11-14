import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api/devices',
  headers: { "Content-Type": "application/json" },
  withCredentials: true
});

export const toggleDevice = async (houseId, deviceId) => {
  try {
    const response = await apiClient.post(
      `/${houseId}/${deviceId}/toggle`
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling device:', error);
    throw error;
  }
};

export const setDeviceValue = async (houseId, deviceId, value) => {
  try {
    const response = await apiClient.post(
      `/${houseId}/${deviceId}/set`,
      { value }
    );
    return response.data;
  } catch (error) {
    console.error('Error setting device value:', error);
    throw error;
  }
};

export const getDeviceStatus = async (houseId) => {
  try {
    const response = await apiClient.get(
      `/${houseId}/status`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting device status:', error);
    throw error;
  }
};
