const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ joinedClubs: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with clubs`);
    users.forEach(u => {
        console.log(`User ${u.name} (ID: ${u._id}) has clubs:`, u.joinedClubs);
    });

    const clubs = await Club.find();
    for (const club of clubs) {
        const count = await User.countDocuments({ joinedClubs: club._id });
        console.log(`Club ${club.name} (ID: ${club._id}) count: ${count}`);
    }
    process.exit(0);
}

debug();
