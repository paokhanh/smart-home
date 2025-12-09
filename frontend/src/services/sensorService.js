import { api } from './api';

// Lấy danh sách cảm biến của một nhà
export const getSensorsByHouse = async (houseId) => {
  try {
    const response = await api.get(`/sensors/${houseId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sensors:", error);
    throw error;
  }
};

// Thêm cảm biến mới
export const addSensor = async (houseId, sensorData) => {
  try {
    const response = await api.post(`/sensors/${houseId}/add`, sensorData);
    return response.data;
  } catch (error) {
    console.error("Error adding sensor:", error);
    throw error;
  }
};

// Cập nhật cảm biến
export const updateSensor = async (sensorId, sensorData) => {
  try {
    const response = await api.put(`/sensors/update/${sensorId}`, sensorData);
    return response.data;
  } catch (error) {
    console.error("Error updating sensor:", error);
    throw error;
  }
};

// Xóa cảm biến
export const deleteSensor = async (sensorId) => {
  try {
    const response = await api.delete(`/sensors/delete/${sensorId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting sensor:", error);
    throw error;
  }
};