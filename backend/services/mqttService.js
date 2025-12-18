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
        console.log(`📨 Raw MQTT received: ${topic}`); // Debug log
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
    // payload might already be parsed into an object by caller
    const msg = (typeof payload === 'string') ? JSON.parse(payload) : payload;
    console.log(`📊 Telemetry - House: ${houseId}, Device: ${deviceId}`);
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
      customPower: msg.custom_power || null,
      timestamp: new Date()
    };

    // Also cache by device ID only (for cross-house lookup / mismatch tolerance)
    telemetryByDevice[deviceId] = {
      sensors: msg.sensors,
      devices: msg.devices,
      custom: msg.custom || null,
      power: msg.power,
      timestamp: new Date(),
    };

    // ✅ Update power consumption DB from telemetry payload (fixed + custom devices)
    // Firmware publishes cumulative Wh inside `power` and `custom_power` in the telemetry message.
    // We reuse handlePowerStats() with a normalized message shape.
    try {
      const powerMsg = {};
      if (msg && typeof msg.power === 'object' && msg.power) {
        Object.assign(powerMsg, msg.power); // light_wh, fan_wh, ac_wh, camera_wh, total_wh...
      }
      if (msg && typeof msg.custom_power === 'object' && msg.custom_power) {
        powerMsg.custom = msg.custom_power; // { hardwareId: cumulativeWh }
      }

      if (Object.keys(powerMsg).length > 0) {
        await handlePowerStats(houseId, deviceId, powerMsg);
      }
    } catch (powErr) {
      console.error('❌ Error updating power from telemetry:', powErr);
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
  today.setHours(0, 0, 0, 0);

  // Debug: show incoming payload and house/device mapping
  console.log('📈 power_stats received:', { mqttCode, deviceId, msg });

  // Tạo cache cho nhà
  if (!lastPowerCache[house._id]) lastPowerCache[house._id] = {};

  // Tạo cache cho ESP32
  if (!lastPowerCache[house._id][deviceId]) {
    lastPowerCache[house._id][deviceId] = {
      light: 0,
      fan: 0,
      ac: 0,
      camera: 0,
      total: 0,
      custom: {} // per-hardwareId cumulative cache
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

  // NOTE:
  // - Firmware may send power_stats with only `custom` (no light_wh/fan_wh/...)
  // - Do NOT overwrite cached cumulative values when fields are missing, otherwise deltas break.
  const hasNum = (v) => typeof v === 'number' && !Number.isNaN(v);

  const nextLight = hasNum(msg?.light_wh) ? msg.light_wh : null;
  const nextFan = hasNum(msg?.fan_wh) ? msg.fan_wh : null;
  const nextAC = hasNum(msg?.ac_wh) ? msg.ac_wh : null;
  const nextCam = hasNum(msg?.camera_wh) ? msg.camera_wh : null;
  const nextTotal = hasNum(msg?.total_wh) ? msg.total_wh : null;

  const dLight = nextLight === null ? 0 : computeDelta(prev.light, nextLight);
  const dFan = nextFan === null ? 0 : computeDelta(prev.fan, nextFan);
  const dAC = nextAC === null ? 0 : computeDelta(prev.ac, nextAC);
  const dCam = nextCam === null ? 0 : computeDelta(prev.camera, nextCam);
  const dTotal = nextTotal === null ? 0 : computeDelta(prev.total, nextTotal);

  // Lưu giá trị hiện tại vào cache cho lần tiếp theo (chỉ khi field được gửi lên)
  if (nextLight !== null) prev.light = nextLight;
  if (nextFan !== null) prev.fan = nextFan;
  if (nextAC !== null) prev.ac = nextAC;
  if (nextCam !== null) prev.camera = nextCam;
  if (nextTotal !== null) prev.total = nextTotal;

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
  try {
    if (dLight > 0.000009) {
      await addWh('den', dLight);
    }
    if (dFan > 0.000009) {
      await addWh('quat', dFan);
    }
    if (dAC > 0.000009) {
      await addWh('dieuHoa', dAC);
    }
    if (dCam > 0.000009) {
      await addWh('camera', dCam);
    }

    // total is reflected by summing device records; keep a log
    if (dLight || dFan || dAC || dCam || dTotal) {
      console.log(`⚡ Updated: den +${dLight.toFixed(4)}, quat +${dFan.toFixed(4)}, dieuHoa +${dAC.toFixed(4)}, cam +${dCam.toFixed(4)}, total +${dTotal.toFixed(4)}`);
    }
  } catch (err) {
    console.error('❌ Error updating fixed device power rows:', err);
  }

  // Handle per-custom-device stats if firmware provides them (msg.custom => { hardwareId: wh })
  if (msg.custom && typeof msg.custom === 'object') {
    if (!prev.custom) prev.custom = {}; // Safety init

    for (const [hw, val] of Object.entries(msg.custom)) {
      const newVal = Number(val || 0);
      const prevVal = Number(prev.custom[hw] || 0);

      // Calculate delta. Handle device reset (newVal < prevVal)
      let dCustom = 0;
      if (newVal < prevVal) {
        dCustom = newVal;
      } else {
        dCustom = newVal - prevVal;
      }

      // store current
      prev.custom[hw] = newVal;

      if (dCustom > 0.00001) {
        await addWh(hw, dCustom);
        // console.log(`⚡ Updated custom ${hw} +${dCustom.toFixed(4)} Wh`);
      }
    }
  }
}



// Handle Device Status
async function handleStatus(topic, message) {
  try {
    const parts = topic.split('/');
    const houseId = parts[1];
    const deviceId = parts[3];
    const status = message; // "online" or "offline"

    if (!houseId || houseId.trim() === '') {
      console.warn(`⚠️ Device reported status with empty house id. Device: ${deviceId}, Status: ${status}`);
    } else {
      console.log(`🔌 Device Status - House: ${houseId}, Device: ${deviceId}, Status: ${status}`);
    }
    // Could update device status in database if needed

  } catch (error) {
    console.error('Error handling status:', error);
  }
}

// Publish Command to Device
function publishCommand(mqttCode, deviceId, command) {
  if (!mqttClient || !mqttClient.connected) {
    console.error('❌ MQTT client not connected');
    return false;
  }

  const topic = `house/${mqttCode}/device/${deviceId}/control`;
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
  if (telemetryCache[houseId]) return telemetryCache[houseId];
  // fallback: if device-only cache exists for the standard esp device, return that under its device id
  if (telemetryByDevice['esp32_device_1']) {
    return { 'esp32_device_1': telemetryByDevice['esp32_device_1'] };
  }
  return {};
}

// Publish to any MQTT topic (for device model-based control)
// Accepts optional options (e.g., {retain:true})
function publish(topic, payload, options = {}) {
  if (!mqttClient || !mqttClient.connected) {
    console.error('❌ MQTT client not connected');
    return false;
  }

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  mqttClient.publish(topic, payloadStr, options, (err) => {
    if (err) {
      console.error('❌ Publish error:', err);
    } else {
      console.log(`📤 Published to ${topic}:`, payloadStr, options);
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
