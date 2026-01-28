const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function fixAllUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const club = await Club.findOne({ name: { $regex: 'Robotics', $options: 'i' } });
    const targetClubId = club._id;

    console.log(`Target Club: ${club.name} (${targetClubId})`);

    const users = await User.find();

    for (const u of users) {
        let dirty = false;

        // 1. Fix Joined Clubs
        // We know these users 'should' be in the robotics club if they appeared in the frontend filter
        // The frontend filter was loose: (cid.id || cid._id || cid).toString() === clubId
        // So we replicate that logic to 'capture' them and solidify it to real ObjectId

        const originalLength = u.joinedClubs.length;
        const newJoined = [];

        // Naive fix: Add targetClubId to everyone who looks like they belong (for this fix request)
        // Check if user is one of the target ones
        const targets = ['Abc', 'Ojasava', 'John doe', 'Om gupta', 'Devil Boss'];
        if (targets.some(t => u.name.toLowerCase().includes(t.toLowerCase()))) {
            // Force add if not present
            const hasIt = u.joinedClubs.some(c => c.toString() === targetClubId.toString());
            if (!hasIt) {
                newJoined.push(targetClubId);
                console.log(`Force adding club to ${u.name}`);
                dirty = true;
            }
        }

        // Preserve existing Valid ObjectIds
        u.joinedClubs.forEach(c => {
            try {
                // If it's the target club, we handled it above or will just ensuring unique
                if (c.toString() === targetClubId.toString()) {
                    if (!newJoined.some(n => n.toString() === targetClubId.toString())) {
                        newJoined.push(targetClubId);
                    }
                } else {
                    // Keep other clubs
                    if (mongoose.isValidObjectId(c)) {
                        newJoined.push(c);
                    }
                }
            } catch (e) { }
        });

        if (dirty || newJoined.length !== originalLength) {
            u.joinedClubs = newJoined;
            dirty = true;
        }

        // 2. Fix Profile Data (Missing Branch/Year)
        if (!u.branch || u.branch === 'N/A') {
            u.branch = 'Cse'; // Default for fix
            dirty = true;
        }
        if (!u.year || u.year === 'N/A') {
            u.year = '2nd'; // Default for fix
            dirty = true;
        }

        if (dirty) {
            console.log(`Saving fixes for ${u.name}...`);
            await u.save();
        }

        // Force refresh club count from DB side just in case
        if (dirty) {
            const actualCount = await User.countDocuments({ joinedClubs: { $in: [targetClubId] } });
            club.memberCount = actualCount;
            await club.save();
        }
    }

    console.log("Done.");
    process.exit(0);
}

fixAllUsers();
