const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Club = require('./models/Club');

const cleanupAndPopulate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const roboticsClubId = '6974551ab366b3e419273f30';
        const club = await Club.findById(roboticsClubId);
        if (!club) {
            console.log('Club not found');
            process.exit(1);
        }

        const users = await User.find({});
        console.log(`Cleaning up ${users.length} users...`);

        for (const user of users) {
            // Fix corrupted joinedClubs (must be array of valid ObjectIds/Strings)
            let fixedClubs = [];
            if (Array.isArray(user.joinedClubs)) {
                fixedClubs = user.joinedClubs.filter(cid => {
                    if (!cid) return false;
                    const s = cid.toString();
                    return s.length === 24 || s.length === 12; // Basic hex check
                });
            }
            user.joinedClubs = fixedClubs;

            // For testing: add top 3 users to the club
            if (users.indexOf(user) < 3) {
                if (!user.joinedClubs.includes(roboticsClubId)) {
                    user.joinedClubs.push(roboticsClubId);
                    console.log(`Added user ${user.name} to Robotics Club`);
                }
            }
            await user.save();
        }

        // Final sync
        const finalCount = await User.countDocuments({ joinedClubs: roboticsClubId });
        club.memberCount = finalCount;
        await club.save();
        console.log(`Final member count for Robotics Club: ${finalCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupAndPopulate();
