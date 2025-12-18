const mqtt = require('mqtt');

const options = {
    host: 'broker.emqx.io',
    port: 1883,
    protocol: 'mqtt',
    clientId: 'debug_probe_' + Date.now()
};

console.log('Connecting to', options.host);
const client = mqtt.connect(options);

const HOUSE_ID = 'house_1765982572627';
// Use wildcard to catch any house if uncertain, but let's target the one from logs
const TOPIC = `house/+/device/+/+`;

client.on('connect', () => {
    console.log('Connected! Subscribing to', TOPIC);
    client.subscribe(TOPIC, (err) => {
        if (err) console.error('Sub error:', err);
        else console.log('Subscribed.');
    });
});

client.on('message', (topic, payload) => {
    console.log(`[${new Date().toISOString()}] MSG on ${topic}:`);
    console.log(payload.toString().substring(0, 100)); // Log first 100 chars
});

client.on('error', console.error);

setTimeout(() => {
    const fakePayload = JSON.stringify({
        sensors: { temperature: 99, humidity: 99, light_intensity: 99, gas_level: 100, motion: 1 },
        devices: { den: { state: "on" } },
        power: { total_wh: 123.45 }
    });
    const topic = `house/${HOUSE_ID}/device/esp32_device_1/telemetry`;
    console.log("Injecting fake data to", topic);
    client.publish(topic, fakePayload);
}, 2000);
