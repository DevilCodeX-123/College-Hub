const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Club = require('./models/Club');

const fixMemberCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const clubs = await Club.find({});
        console.log(`Found ${clubs.length} clubs to check.`);

        for (const club of clubs) {
            console.log(`Checking club: ${club.name} (${club._id})`);
            let madeChanges = false;

            // 1. Ensure Coordinator is a Member
            if (club.coordinatorId) {
                const coordinator = await User.findById(club.coordinatorId);
                if (coordinator) {
                    if (!coordinator.joinedClubs.includes(club._id.toString())) {
                        console.log(`  - Coordinator ${coordinator.name} is NOT a member. Adding them...`);
                        coordinator.joinedClubs.push(club._id.toString());
                        await coordinator.save();
                        madeChanges = true;
                    } else {
                        console.log(`  - Coordinator ${coordinator.name} is already a member.`);
                    }
                } else {
                    console.log(`  - Coordinator ID ${club.coordinatorId} not found in Users.`);
                }
            }

            // 2. Recalculate Member Count from Users collection
            // We count how many users have this club._id in their joinedClubs array
            const realMemberCount = await User.countDocuments({ joinedClubs: club._id.toString() });

            if (club.memberCount !== realMemberCount) {
                console.log(`  - Mismatch! stored: ${club.memberCount}, real: ${realMemberCount}. Updating...`);
                club.memberCount = realMemberCount;
                await club.save();
                madeChanges = true;
            } else {
                console.log(`  - Member count is correct (${realMemberCount}).`);
            }
        }

        console.log('Fix complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixMemberCounts();
