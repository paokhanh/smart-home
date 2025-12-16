const DeviceRenderer = ({ device, onToggle, onUpdate, loading }) => {
  switch (device.type) {
    case 'light':
    case 'socket':
      return (
        <>
          <p>Trạng thái: {device.status === 'on' ? 'Bật' : 'Tắt'}</p>
          <button onClick={() => onToggle(device)} disabled={loading}>
            {device.status === 'on' ? 'Tắt' : 'Bật'}
          </button>
        </>
      );

    case 'fan':
      return (
        <>
          <p>Trạng thái: {device.status}</p>
          <input
            type="range"
            min="0"
            max="5"
            value={device.value?.speed || 0}
            onChange={e =>
              onUpdate(device, 'speed', Number(e.target.value))
            }
          />
          <button onClick={() => onToggle(device)}>Bật / Tắt</button>
        </>
      );

    default:
      return <p>Thiết bị không hỗ trợ</p>;
  }
};

export default DeviceRenderer;
