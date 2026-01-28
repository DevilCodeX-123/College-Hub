require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URI;

async function forceUpdateBadgeDetails() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ name: /devil/i });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Updating badges for ${user.name}...`);

        user.badges.forEach(badge => {
            if (badge.name.trim() === 'Grandmaster') {
                badge.challengeName = 'RTU Hackathon 2026';
                badge.clubName = 'Robotics Club';
            } else if (badge.name.includes('Week 5')) {
                badge.challengeName = 'Weekly Sprint #5';
                badge.clubName = 'Campus Hub';
            } else {
                // Ensure other existing badges have something
                if (!badge.challengeName) badge.challengeName = 'Legacy Achievement';
                if (!badge.clubName) badge.clubName = 'Campus Hub';
            }
        });

        await user.save();
        console.log('✅ Badges updated in database.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

forceUpdateBadgeDetails();
