const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Club = require('./models/Club');

const populateMembers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const roboticsClubId = '6974551ab366b3e419273f30';
        const club = await Club.findById(roboticsClubId);

        const users = await User.find({});
        console.log(`Ensuring more members for Robotics Club (out of ${users.length} total users)...`);

        // Add ALL users to the club for a "proper" look during testing
        for (const user of users) {
            if (!user.joinedClubs.includes(roboticsClubId)) {
                user.joinedClubs.push(roboticsClubId);
                console.log(`Added user ${user.name} to Robotics Club`);
                await user.save();
            }
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

populateMembers();
