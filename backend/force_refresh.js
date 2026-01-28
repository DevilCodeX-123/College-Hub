const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function forceRefresh() {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGO_URI);

    // Hardcoded for 'Devil Boss' and 'Robotics Club' based on previous logs
    const club = await Club.findOne({ name: { $regex: 'Robotics', $options: 'i' } });
    const user = await User.findOne({ name: { $regex: 'Devil', $options: 'i' } });

    if (!club || !user) {
        console.log('Club or User not found');
        process.exit(1);
    }

    console.log(`Club ID: ${club._id} (Type: ${typeof club._id})`);
    console.log(`User originally had clubs: ${user.joinedClubs}`);

    // 1. Clear clubs
    console.log('Clearing joinedClubs...');
    user.joinedClubs = [];
    await user.save();

    // 2. Re-add as pure ObjectId
    console.log('Re-adding Club ID...');
    user.joinedClubs.push(club._id);
    await user.save();

    // 3. Verify
    const freshUser = await User.findById(user._id);
    console.log(`User now has clubs: ${freshUser.joinedClubs}`);

    const count = await User.countDocuments({ joinedClubs: club._id });
    console.log(`Count with club._id: ${count}`);

    // Force update club count
    club.memberCount = count;
    await club.save();
    console.log('Club member count updated.');

    process.exit(0);
}

forceRefresh();
