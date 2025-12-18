import React, { useState, useEffect } from 'react';
import './device-renderer.css';

const DeviceRenderer = ({ device, onToggle, onUpdate, loading, onDelete }) => {
  // Local state for smooth slider interaction
  const [sliderValue, setSliderValue] = useState(0);

  // Sync init slider value
  useEffect(() => {
    if (device.type === 'fan') {
      setSliderValue(device.value?.speed || device.telemetry?.fan_speed || 0);
    } else if (device.type === 'ac' || device.type === 'dieuHoa') {
      setSliderValue(device.value?.temp || device.telemetry?.ac_temp || 24);
    }
  }, [device]);

  const handleSliderChange = (e) => {
    setSliderValue(e.target.value);
  };

  const handleSliderCommit = (e) => {
    const val = Number(e.target.value);
    if (device.type === 'fan') {
      onUpdate(device, 'speed', val);
    } else if (device.type === 'ac' || device.type === 'dieuHoa') {
      onUpdate(device, 'temp', val);
    }
  };

  // Determine icon and colors
  const getDeviceIcon = () => {
    switch (device.type) {
      case 'light': return 'fa-lightbulb';
      case 'fan': return 'fa-fan';
      case 'ac':
      case 'dieuHoa': return 'fa-snowflake';
      case 'camera': return 'fa-video';
      case 'socket': return 'fa-plug';
      case 'sensor': return 'fa-chart-bar';
      default: return 'fa-power-off';
    }
  };

  const isOnline = device.status === 'online';
  const isActive = isOnline && (device.isOn || (device.value && device.value.isOn));
  // Note: Depending on data structure, 'isOn' might be in different places. 
  // Based on Dashboard.jsx, customDevices use 'status'='online'/'offline' to denote availability, 
  // but acts as ON/OFF for some simple devices? 
  // Actually in Dashboard logic: toggleCustomDevice checks status. 
  // Let's assume for Custom Devices: 'status' == 'online' means ON (powered), 'offline' means OFF/Unreachable?
  // Wait, Dashboard.jsx toggle logic:
  // "setCustomDevices(prev => prev.map(d => d._id === device._id ? { ...d, status: d.status === 'online' ? 'offline' : 'online' } : d));"
  // So 'status' IS the on/off state for these custom devices?
  // Yes, for custom devices in this existing code, 'status' seems to double as On/Off state.

  // Actually, for real sensors 'status' usually means connection status. 
  // But strictly following the existing code's behavior: 
  // {device.status === "online" ? "Tắt" : "Bật"} button toggles the status.

  const showSlider = (device.type === 'fan' || device.type === 'ac' || device.type === 'dieuHoa') && isOnline;

  const handleToggleWrapper = () => {
    onToggle(device);
  };

  return (
    <div className={`device-card ${isOnline ? 'active' : ''} ${loading ? 'loading-overlay' : ''}`}>
      <div className="device-header">
        <div className="device-icon-container">
          <i className={`fas ${getDeviceIcon()}`}></i>
        </div>
        <div className="device-info">
          <h3 className="device-name">{device.name}</h3>
          <p className="device-status-text">
            {isOnline ? 'Đang bật' : 'Đang tắt'}
          </p>
        </div>

        {/* Toggle Switch */}
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={handleToggleWrapper}
            disabled={loading}
          />
          <span className="slider"></span>
        </label>
      </div>

      {showSlider && (
        <div className="device-controls">
          {device.type === 'fan' && (
            <div className="range-slider-container">
              <div className="range-label">
                <span>Tốc độ</span>
                <span>{sliderValue}</span>
              </div>
              <input
                type="range"
                min="0" max="5"
                value={sliderValue}
                className="custom-range"
                onChange={handleSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
              />
            </div>
          )}
          {(device.type === 'ac' || device.type === 'dieuHoa') && (
            <div className="range-slider-container">
              <div className="range-label">
                <span>Nhiệt độ</span>
                <span>{sliderValue}°C</span>
              </div>
              <input
                type="range"
                min="16" max="30"
                value={sliderValue}
                className="custom-range"
                onChange={handleSliderChange}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer / Extra info if needed */}
      {/* 
      {device.location && (
          <div style={{marginTop: '12px', fontSize: '0.8rem', color: '#94a3b8'}}>
              <i className="fas fa-map-marker-alt" style={{marginRight: '6px'}}></i>
              {device.location}
          </div>
      )} 
      */}

      {onDelete && (
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button
            onClick={() => onDelete(device)}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            <i className="fas fa-trash"></i> Xóa
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceRenderer;
