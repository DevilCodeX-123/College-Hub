require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URI;

async function checkBadges() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find the user "Devil Boss"
        const user = await User.findOne({ name: /devil/i });

        if (user) {
            console.log(`User: ${user.name}`);
            console.log(`Total badges: ${user.badges.length}\n`);

            user.badges.forEach((badge, idx) => {
                console.log(`Badge ${idx + 1}:`);
                console.log(`  name: "${badge.name}"`);
                console.log(`  icon: "${badge.icon || 'N/A'}"`);
                console.log(`  description: "${badge.description || 'N/A'}"`);
                console.log(`  challengeName: "${badge.challengeName || 'N/A'}"`);
                console.log(`  clubName: "${badge.clubName || 'N/A'}"`);
                console.log('');
            });
        } else {
            console.log('User not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkBadges();
