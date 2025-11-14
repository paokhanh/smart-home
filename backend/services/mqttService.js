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
        console.log(`📨 Message from ${topic}:`);
        const message = JSON.parse(payload.toString());
        console.log(message);
        
        // Handle different message types
        if (topic.includes('/telemetry')) {
          await handleTelemetry(topic, message);
        } else if (topic.includes('/power_stats')) {
          await handlePowerStats(topic, message);
        } else if (topic.includes('/status')) {
          await handleStatus(topic, message);
        }
      } catch (error) {
        console.error('❌ Error processing message:', error);
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
async function handleTelemetry(topic, message) {
  try {
    // Extract houseId and deviceId from topic
    // Topic format: house/house_001/device/esp32_device_1/telemetry
    const parts = topic.split('/');
    const houseId = parts[1]; // house_001 or DB ID
    const deviceId = parts[3]; // esp32_device_1
    
    console.log(`📊 Telemetry - House: ${houseId}, Device: ${deviceId}`);
    console.log('   Sensors:', message.sensors);
    console.log('   Devices:', message.devices);
    console.log('   Power:', message.power);
    
    // Cache latest telemetry in-memory by both house+device and device-only
    telemetryCache[houseId] = telemetryCache[houseId] || {};
    telemetryCache[houseId][deviceId] = {
      sensors: message.sensors || null,
      devices: message.devices || null,
      power: message.power || null,
      timestamp: new Date()
    };
    
    // Also cache by device ID only (for cross-house lookup / mismatch tolerance)
    telemetryByDevice[deviceId] = {
      sensors: message.sensors || null,
      devices: message.devices || null,
      power: message.power || null,
      timestamp: new Date(),
      lastMQTTHouseId: houseId  // remember which house published this
    };
    
    // In a real app, optionally store this in MongoDB for historical data
    // await TelemetryLog.create({ houseId, deviceId, data: message, timestamp: new Date() });
    
  } catch (error) {
    console.error('Error handling telemetry:', error);
  }
}

// Handle Power Statistics
async function handlePowerStats(topic, message) {
  try {
    // Extract houseId and deviceId from topic
    const parts = topic.split('/');
    const houseId = parts[1];
    const deviceId = parts[3];
    
    console.log(`⚡ Power Stats - House: ${houseId}, Device: ${deviceId}`);
    console.log(`   Light: ${message.light_wh}Wh, Fan: ${message.fan_wh}Wh, Camera: ${message.camera_wh}Wh, Total: ${message.total_wh}Wh`);
    
    // Save to MongoDB
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let record = await PowerConsumption.findOne({
      houseId,
      deviceId,
      date: today
    });
    
    if (record) {
      record.lightWh = message.light_wh || 0;
      record.fanWh = message.fan_wh || 0;
      record.cameraWh = message.camera_wh || 0;
      record.totalWh = message.total_wh || 0;
      record.timestamp = new Date();
      await record.save();
      console.log('✓ Power stats updated');
    } else {
      await PowerConsumption.create({
        houseId,
        deviceId,
        lightWh: message.light_wh || 0,
        fanWh: message.fan_wh || 0,
        cameraWh: message.camera_wh || 0,
        totalWh: message.total_wh || 0,
        date: today
      });
      console.log('✓ Power stats created');
    }
    
  } catch (error) {
    console.error('Error handling power stats:', error);
  }
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
  if (!houseId) return {};
  
  // Try primary cache first (matches DB house ID)
  if (telemetryCache[houseId]) {
    return telemetryCache[houseId];
  }
  
  // Fallback: if house not in cache, try looking by device only
  // This handles cases where firmware publishes with different house ID (e.g., 'house_001')
  // In that case, return the device cache which has the latest data
  if (Object.keys(telemetryByDevice).length > 0) {
    // Return the latest device-only cache (assumes single device per house for now)
    const latestDevice = telemetryByDevice['esp32_device_1']; // hardcoded device ID
    if (latestDevice) {
      console.log(`⚠️ Using device-level telemetry cache for house ${houseId} (house ID mismatch, MQTT was ${latestDevice.lastMQTTHouseId})`);
      return { 'esp32_device_1': latestDevice };
    }
  }
  
  return {};
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
  getMQTTClient,
  getLatestTelemetry,
  disconnect
};
