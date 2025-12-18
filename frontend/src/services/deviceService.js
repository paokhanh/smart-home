import { api } from './api';

// create device
export const createDevice = async (payload) => {
  const res = await api.post('/devices', payload);
  return res.data;
};

export const getDevicesByHouse = async (houseId) => {
  const res = await api.get(`/devices/house/${houseId}`);
  return res.data;
};

export const controlDevice = async (deviceId, action, value, houseId) => {
  try {
    const response = await api.post(
      `/devices/${deviceId}/control`, 
      { 
        action, 
        value,
        houseId // <--- QUAN TRỌNG: Gửi houseId lên server
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error controlling device:', error);
    throw error;
  }
};

// Delete device
export const deleteDevice = async (deviceId) => {
  try {
    const response = await api.delete(`/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting device:', error);
    throw error;
  }
};

// BỔ SUNG CẦN THIẾT CHO DASHBOARD
// Toggle fixed device (den/quat/dieuHoa/camera) - ESP32 compatible
// Signature kept as (deviceKey, houseId) to match current Dashboard usage
export const toggleDevice = async (deviceKey, houseId) => {
  try {
    const response = await api.post(`/devices/${houseId}/${deviceKey}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling fixed device:', error);
    throw error;
  }
};

// Get device status from MQTT cache - ESP32 compatible
export const getDeviceStatus = async (houseId) => {
  try {
    const response = await api.get(`/devices/${houseId}/status`);
    return response.data;
  } catch (error) {
    console.error("Error getting device status:", error);
    throw error;
  }
};

// // Set value: speed, temperature... - ESP32 compatible
export const setDeviceValue = async (houseId, deviceKey, value) => {
  try {
    const response = await api.post(`/devices/${houseId}/${deviceKey}/set`, { value });
    return response.data;
  } catch (error) {
    console.error("Error setting device value:", error);
    throw error;
  }
};

// -------------------------
// Device permission handlers
// -------------------------
export const addDevicePermission = async (deviceId, userId) => {
  return (await api.post(`/devices/${deviceId}/permissions/add`, { userId })).data;
};

export const removeDevicePermission = async (deviceId, userId) => {
  return (await api.post(`/devices/${deviceId}/permissions/remove`, { userId })).data;
};
