require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URI;

async function checkUserBadges() {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await User.findOne({ name: /devil/i }).lean();
        console.log('User Badges:', JSON.stringify(user.badges, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUserBadges();
