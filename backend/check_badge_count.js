require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URI;

async function checkUserDetails() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const user = await User.findOne({ name: /devil/i });

        if (user) {
            console.log(`User: ${user.name}`);
            console.log(`Database badges: ${user.badges.length}`);
            console.log(`Joined clubs: ${user.joinedClubs?.length || 0}`);
            console.log(`\nBadge names:`);
            user.badges.forEach((b, i) => console.log(`  ${i + 1}. ${b.name}`));

            // Calculate system achievements
            const systemBadges = [
                { name: 'Early Adopter', locked: false },
                { name: 'First Challenge', locked: false },
                { name: 'Team Player', locked: (user.joinedClubs?.length || 0) < 1 },
            ];

            const unlockedSystemBadges = systemBadges
                .filter(sb => !user.badges.some(ub => ub.name === sb.name))
                .filter(b => !b.locked);

            console.log(`\nSystem achievements (unlocked and not earned):`);
            unlockedSystemBadges.forEach((b, i) => console.log(`  ${i + 1}. ${b.name}`));

            console.log(`\nTotal badge count: ${user.badges.length + unlockedSystemBadges.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUserDetails();
