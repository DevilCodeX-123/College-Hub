require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Poll = require('./models/Poll');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Notifications ---');
        const notifs = await Notification.find({}).limit(10);
        console.log(JSON.stringify(notifs, null, 2));

        console.log('--- Polls ---');
        const polls = await Poll.find({}).limit(10);
        console.log(JSON.stringify(polls, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
checkData();
