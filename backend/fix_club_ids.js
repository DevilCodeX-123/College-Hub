const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function fixJoinedClubs() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const users = await User.find({ joinedClubs: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with clubs.`);

    for (const user of users) {
        let changed = false;
        const newJoined = [];

        for (const cid of user.joinedClubs) {
            // Attempt to cast to ObjectId
            try {
                if (typeof cid === 'string') {
                    newJoined.push(new mongoose.Types.ObjectId(cid));
                    changed = true;
                } else {
                    newJoined.push(cid);
                }
            } catch (e) {
                console.error(`Invalid Club ID for user ${user.name}:`, cid);
            }
        }

        if (changed) {
            console.log(`Fixing user ${user.name}: Converting strings to ObjectIds...`);
            user.joinedClubs = newJoined;
            await user.save();
        } else {
            // Force save to ensure uniqueness or any middleware runs if needed
            // await user.save(); 
        }
    }

    // Now verification
    console.log('Verifying counts...');
    const clubs = await Club.find();
    for (const club of clubs) {
        // Query utilizing the fact that schema defines it as ObjectId
        const count = await User.countDocuments({ joinedClubs: club._id });
        const countStr = await User.countDocuments({ joinedClubs: club._id.toString() });
        console.log(`Club: ${club.name} | Count(ObjectId): ${count} | Count(StringQuery): ${countStr}`);

        // Force update the club memberCount
        club.memberCount = count;
        await club.save();
    }

    console.log('Done.');
    process.exit(0);
}

fixJoinedClubs();
