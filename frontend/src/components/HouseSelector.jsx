import React, { useState, useEffect } from 'react';
import { getAllHouses } from '../services/houseService';
import './houseselector.css';

function HouseSelector({ onHouseChange, currentHouseId }) {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(currentHouseId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
// useEffect(() => {
//     if (currentHouseId) {
//       console.log("🔄 MQTT house switched →", currentHouseId);

//       fetch("http://localhost:5000/api/mqtt/setHouse", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ houseId: currentHouseId })
//       });
//     }
//   }, [currentHouseId]);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const data = await getAllHouses();
      setHouses(data);
      if (data.length > 0 && !selectedHouse) {
        setSelectedHouse(data[0]._id);
        onHouseChange(data[0]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching houses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseChange = (e) => {
    const houseId = e.target.value;
    setSelectedHouse(houseId);
    const house = houses.find(h => h._id === houseId);
    if (house) {
      onHouseChange(house);
    }
  };

  if (loading) return <div className="house-selector"><span>Đang tải...</span></div>;
  if (error) return <div className="house-selector error"><span>Lỗi: {error}</span></div>;

  return (
    <div className="house-selector">
      <label htmlFor="house-select">Nhà của tôi:</label>
      <select 
        id="house-select" 
        value={selectedHouse} 
        onChange={handleHouseChange}
        className="house-select"
      >
        {houses.map(house => (
          <option key={house._id} value={house._id}>
            {house.name} {house.address && `(${house.address})`}
          </option>
        ))}
      </select>
      {houses.length === 0 && (
        <span className="no-houses">Chưa có nhà nào. <a href="/houses">Tạo mới</a></span>
      )}
    </div>
  );
}

export default HouseSelector;
