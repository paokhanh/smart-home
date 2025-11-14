import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAllHouses } from '../services/houseService';

const HouseContext = createContext();

export const HouseProvider = ({ children }) => {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tải danh sách nhà lúc mount
  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const data = await getAllHouses();
      setHouses(data);
      
      // Tự động chọn nhà đầu tiên nếu có
      if (data.length > 0 && !selectedHouse) {
        setSelectedHouse(data[0]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching houses:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectHouse = (houseId) => {
    const house = houses.find(h => h._id === houseId);
    if (house) {
      setSelectedHouse(house);
    }
  };

  const refreshHouses = async () => {
    await fetchHouses();
  };

  const value = {
    houses,
    selectedHouse,
    loading,
    error,
    selectHouse,
    refreshHouses,
    setHouses
  };

  return (
    <HouseContext.Provider value={value}>
      {children}
    </HouseContext.Provider>
  );
};

// Hook để sử dụng HouseContext
export const useHouses = () => {
  const context = useContext(HouseContext);
  if (!context) {
    throw new Error('useHouses must be used within HouseProvider');
  }
  return context;
};

export default HouseContext;
