const mongoose = require('mongoose');
const Device = require('./models/Device');

require('dotenv').config(); // Load .env for MONGO_URI

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://baokhanh1205:baokhanh1205@smarthome.jj6xhuy.mongodb.net/smart_home';

async function run() {
    try {
        console.log('Connecting to DB:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const collection = mongoose.connection.collection('devices');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const hwIndex = indexes.find(idx => idx.key.hardwareId === 1 && idx.unique === true);

        if (hwIndex) {
            console.log(`Found unique index on hardwareId: ${hwIndex.name}. Dropping it...`);
            await collection.dropIndex(hwIndex.name);
            console.log('✅ Index dropped. Now hardwareId is not unique globally.');
        } else {
            console.log('No unique index found on hardwareId.');
        }

        // Optional: Create compound unique index (houseId + hardwareId) to ensure uniqueness only within a house
        // await collection.createIndex({ houseId: 1, hardwareId: 1 }, { unique: true });
        // console.log('✅ Created compound unique index (houseId + hardwareId)');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
