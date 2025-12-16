const mqtt = require('mqtt');
const PowerConsumption = require('../models/PowerConsumption');
const House = require('../models/House');

// MQTT Connection Options
const mqttOptions = {
  host: 'broker.emqx.io',
  port: 1883,
  protocol: 'mqtt',
  username: '',
  password: '',
  clientId: 'smarthome_backend_' + Date.now(),
  reconnectPeriod: 1000,
  connectTimeout: 4 * 1000,
  clean: true,
  rejectUnauthorized: false
};

let mqttClient = null;
// In-memory cache for latest telemetry per house/device
// Structure: { [houseId]: { [deviceId]: { sensors, devices, power, timestamp } } }
const telemetryCache = {};
// Also cache by device ID only for cross-house lookup (handles house ID mismatches)
const telemetryByDevice = {};

// Initialize MQTT Connection
function initMQTT() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to MQTT Broker:', mqttOptions.host);
    
    mqttClient = mqtt.connect(mqttOptions);
    
    mqttClient.on('connect', () => {
      console.log('✓ MQTT Connected to broker.emqx.io:1883');
      
      // Subscribe to all device telemetry
      // Pattern: house/+/device/+/telemetry
      mqttClient.subscribe('house/+/device/+/telemetry', (err) => {
        if (err) {
          console.error('❌ Subscribe telemetry error:', err);
        } else {
          console.log('✓ Subscribed to house/+/device/+/telemetry');
        }
      });
      
      // Subscribe to power stats
      mqttClient.subscribe('house/+/device/+/power_stats', (err) => {
        if (err) {
          console.error('❌ Subscribe power_stats error:', err);
        } else {
          console.log('✓ Subscribed to house/+/device/+/power_stats');
        }
      });
      
      // Subscribe to device status
      mqttClient.subscribe('house/+/device/+/status', (err) => {
        if (err) {
          console.error('❌ Subscribe status error:', err);
        } else {
          console.log('✓ Subscribed to house/+/device/+/status');
        }
      });
      
      resolve(mqttClient);
    });
    
    mqttClient.on('error', (error) => {
      console.error('❌ MQTT Connection Error:', error);
      reject(error);
    });
    
    mqttClient.on('message', async (topic, payload) => {
      try {
          const parts = topic.split('/');
          const mqttCode = parts[1];     // ex: house_1764734118862
          const deviceId = parts[3];     // esp32_device_1
          let message;
          const text = payload.toString();
          try {
            message = JSON.parse(text);
          } catch {
            message = text; // plain text message
          }

        
          if (topic.includes('/power_stats')) {
            await handlePowerStats(mqttCode, deviceId, message);
            return;
          }

          if (topic.includes('/telemetry')) {
            await handleTelemetry(topic, message);
            return;
          }
          
          
          if (topic.includes('/status')) {
            await handleStatus(topic, message);
            return;
          }

        } catch (err) {
          console.error("❌ MQTT message error:", err);
        }
      });
    
    mqttClient.on('reconnect', () => {
      console.log('🔄 MQTT Reconnecting...');
    });
    
    mqttClient.on('offline', () => {
      console.log('⚠️ MQTT Offline');
    });
    
    mqttClient.on('disconnect', () => {
      console.log('⚠️ MQTT Disconnected');
    });
  });
}

// Handle Telemetry Data (Sensor readings + Device states)
async function handleTelemetry(topic, payload) {
  try {
    // Extract houseId and deviceId from topic
   // Topic format: house/{houseId}/device/{deviceId}/telemetry

    const parts = topic.split('/');
    const houseId = parts[1]; // house_001 or DB ID
    const deviceId = parts[3]; // esp32_device_1
    const msg = JSON.parse(payload);
    console.log(`📊 Telemetry - House: ${mqttCode}, Device: ${deviceId}`);
    console.log('   Sensors:', msg.sensors);
    console.log('   Devices:', msg.devices);
    console.log('   Power:', msg.power);
    
    // Cache latest telemetry in-memory by both house+device and device-only
    telemetryCache[houseId] = telemetryCache[houseId] || {};
    telemetryCache[houseId][deviceId] = {
      sensors: msg.sensors || null,
      devices: msg.devices || null,
      custom: msg.custom || null,
      power: msg.power || null,
      timestamp: new Date()
    };
    
    // Also cache by device ID only (for cross-house lookup / mismatch tolerance)
    telemetryCache[mqttCode] = telemetryCache[mqttCode] || {};
    telemetryCache[mqttCode][deviceId] = {
      sensors: msg.sensors,
      devices: msg.devices,
      custom: msg.custom || null,
      power: msg.power,
      timestamp: new Date(),
    }
    
    // In a real app, optionally store this in MongoDB for historical data
    // await TelemetryLog.create({ houseId, deviceId, data: message, timestamp: new Date() });
    
  } catch (error) {
    console.error('Error handling telemetry:', error);
  }
}

let activeHouseId = null;

// function switchHouse(newHouseId) {
//     activeHouseId = newHouseId;
//     console.log("🔄 MQTT switched to house:", newHouseId);
// }

// cache lưu giá trị Wh cuối cùng của từng device
const lastPowerCache = {}; 
// cấu trúc: lastPowerCache[houseId][deviceId] = { light, fan, camera, total }

async function handlePowerStats(mqttCode, deviceId, msg) {
  const house = await House.findOne({ mqttCode });
  if (!house) {
    console.log(`❌ House not found for ${mqttCode}`);
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  // Tạo cache cho nhà
  if (!lastPowerCache[house._id]) lastPowerCache[house._id] = {};

  // Tạo cache cho ESP32
  if (!lastPowerCache[house._id][deviceId]) {
      lastPowerCache[house._id][deviceId] = {
        light: 0,
        fan: 0,
        ac: 0,
        camera: 0,
        total: 0
      };
  }

  const prev = lastPowerCache[house._id][deviceId];

  const computeDelta = (prevVal, newVal) => {
    if (newVal < prevVal) {
      // Firmware RESET → newVal là giá trị mới từ đầu
      return newVal;
    }
    return newVal - prevVal; // bình thường
  };

  const dLight  = computeDelta(prev.light, msg.light_wh || 0);
  const dFan    = computeDelta(prev.fan, msg.fan_wh || 0);
  const dAC     = computeDelta(prev.ac, msg.ac_wh || 0);
  const dCam    = computeDelta(prev.camera, msg.camera_wh || 0);
  const dTotal  = computeDelta(prev.total, msg.total_wh || 0);

  // Lưu giá trị hiện tại vào cache cho lần tiếp theo
  prev.light  = msg.light_wh || 0;
  prev.fan    = msg.fan_wh || 0;
  prev.ac     = msg.ac_wh || 0;
  prev.camera = msg.camera_wh || 0;
  prev.total  = msg.total_wh || 0;

  // Hàm update vào MongoDB
  const addWh = async (dev, wh) => {
    if (!wh || wh < 0.00001) return;

    let rec = await PowerConsumption.findOne({
      houseId: house._id,
      deviceId: dev,
      date: today
    });

    if (!rec) {
      rec = new PowerConsumption({
        houseId: house._id,
        deviceId: dev,
        date: today,
        totalWh: 0
      });
    }

    rec.totalWh += wh;
    rec.timestamp = new Date();
    await rec.save();
  };

  // Map incoming metrics to schema device IDs (vn keys)
  await addWh("den", dLight);
  await addWh("quat", dFan);
  await addWh("dieuHoa", dAC);
  await addWh("camera", dCam);

  // total is reflected by summing device records; keep a log
  console.log(`⚡ Updated: den +${dLight.toFixed(4)}, quat +${dFan.toFixed(4)}, dieuHoa +${dAC.toFixed(4)}, cam +${dCam.toFixed(4)}, total +${dTotal.toFixed(4)}`);
}



// Handle Device Status
async function handleStatus(topic, message) {
  try {
    const parts = topic.split('/');
    const houseId = parts[1];
    const deviceId = parts[3];
    const status = message; // "online" or "offline"
    
    console.log(`🔌 Device Status - House: ${houseId}, Device: ${deviceId}, Status: ${status}`);
    
    // Could update device status in database if needed
    
  } catch (error) {
    console.error('Error handling status:', error);
  }
}

// Publish Command to Device
function publishCommand(houseId, deviceId, command) {
  if (!mqttClient || !mqttClient.connected) {
    console.error('❌ MQTT client not connected');
    return false;
  }
  
  const topic = `house/${houseId}/device/${deviceId}/control`;
  const payload = JSON.stringify(command);
  
  mqttClient.publish(topic, payload, (err) => {
    if (err) {
      console.error('❌ Publish error:', err);
    } else {
      console.log(`📤 Published to ${topic}:`, command);
    }
  });
  
  return true;
}

// Get MQTT Client
function getMQTTClient() {
  return mqttClient;
}

// Return latest telemetry for a house (or empty object)
// Attempts to find by DB house ID first, then falls back to device-only cache
function getLatestTelemetry(houseId) {
  return telemetryCache[houseId] || {};
}

// Publish to any MQTT topic (for device model-based control)
function publish(topic, payload) {
  if (!mqttClient || !mqttClient.connected) {
    console.error('❌ MQTT client not connected');
    return false;
  }
  
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  
  mqttClient.publish(topic, payloadStr, (err) => {
    if (err) {
      console.error('❌ Publish error:', err);
    } else {
      console.log(`📤 Published to ${topic}:`, payloadStr);
    }
  });
  
  return true;
}

// Disconnect
function disconnect() {
  if (mqttClient) {
    mqttClient.end();
    console.log('✓ MQTT disconnected');
  }
}

module.exports = {
  initMQTT,
  publishCommand,
  publish,
  getMQTTClient,
  getLatestTelemetry,
  disconnect
};  
