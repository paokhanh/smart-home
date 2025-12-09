import { api } from './api'; // Sử dụng api instance chung

// Lấy danh sách lịch
export const getSchedules = async (houseId) => {
  try {
    // GET /api/schedules/:houseId
    const response = await api.get(`/schedules/${houseId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching schedules:", error);
    throw error;
  }
};

// Thêm lịch mới
export const addSchedule = async (houseId, scheduleData) => {
  try {
    // POST /api/schedules/:houseId
    const response = await api.post(`/schedules/${houseId}`, scheduleData);
    return response.data;
  } catch (error) {
    console.error("Error adding schedule:", error);
    throw error;
  }
};

// Xóa lịch
export const deleteSchedule = async (scheduleId) => {
  try {
    // DELETE /api/schedules/:scheduleId
    const response = await api.delete(`/schedules/${scheduleId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting schedule:", error);
    throw error;
  }
};

// Cập nhật lịch
export const updateSchedule = async (scheduleId, updateData) => {
  try {
    // PUT /api/schedules/:scheduleId
    const response = await api.put(`/schedules/${scheduleId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw error;
  }
};