import { api } from './api';

export const getPowerStats = async (houseId, date, type = 'daily') => {
  try {
    const response = await api.get(`/power-stats/${houseId}`, {
      params: { date, type }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching power stats:", error);
    throw error;
  }
};