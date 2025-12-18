const mongoose = require('mongoose');
const Sensor = require('./models/Sensor');
const House = require('./models/House');

const MONGO_URI = 'mongodb+srv://baokhanh1205:baokhanh1205@smarthome.jj6xhuy.mongodb.net/smart_home';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // From logs in step 262: house_1765982572627
        const mqttCode = 'house_1765982572627';
        const house = await House.findOne({ mqttCode });

        if (!house) {
            console.log('House not found for mqttCode', mqttCode);
            return;
        }

        console.log(`Found House: ${house.name} (${house._id})`);

        const sensors = await Sensor.find({ houseId: house._id });
        console.log(`Found ${sensors.length} sensors.`);

        // Map of correct keys
        // key = current potential wrong key, value = correct key
        // We want the DB mqttKey to match what backend sends: temperature, humidity, light_intensity, gas_level, motion

        for (const s of sensors) {
            let dirty = false;
            const oldKey = s.mqttKey;

            // Fix Temperature
            if (s.type === 'temperature' && s.mqttKey !== 'temperature') {
                s.mqttKey = 'temperature';
                dirty = true;
            }
            // Fix Humidity
            if (s.type === 'humidity' && s.mqttKey !== 'humidity') {
                s.mqttKey = 'humidity';
                dirty = true;
            }
            // Fix Light
            if (s.type === 'light' && s.mqttKey !== 'light_intensity') {
                s.mqttKey = 'light_intensity';
                dirty = true;
            }
            // Fix Gas
            if (s.type === 'gas' && s.mqttKey !== 'gas_level') {
                s.mqttKey = 'gas_level';
                dirty = true;
            }
            // Fix Motion
            if (s.type === 'motion' && s.mqttKey !== 'motion') {
                s.mqttKey = 'motion';
                dirty = true;
            }

            console.log(`Sensor: ${s.name} (${s.type}) | Key: ${oldKey} -> ${s.mqttKey} | Dirty? ${dirty}`);

            if (dirty) {
                await s.save();
                console.log(`✅ Updated sensor ${s.name}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
