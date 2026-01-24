const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const fixUserXP = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Checking ${users.length} users for missing XP fields...`);

        for (const user of users) {
            let changed = false;
            if (user.weeklyXP === undefined || user.weeklyXP === null) {
                user.weeklyXP = 0;
                changed = true;
            }
            if (user.totalEarnedXP === undefined || user.totalEarnedXP === null) {
                user.totalEarnedXP = 0;
                changed = true;
            }

            if (changed) {
                console.log(`Initializing XP for user: ${user.name}`);
                await user.save();
            }
        }

        console.log('XP Fix complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixUserXP();
