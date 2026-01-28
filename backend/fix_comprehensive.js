const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function comprehensiveFix() {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Find the Robotics Club
    const club = await Club.findOne({ name: { $regex: 'Robotics', $options: 'i' } });
    if (!club) {
        console.log('Club not found');
        process.exit(1);
    }

    const clubObjectId = club._id;
    const clubIdStr = club._id.toString();
    console.log(`Target Club: ${club.name} (${clubIdStr})`);

    // 2. Find all users who should be members
    const targetNames = ['Abc', 'Ojasava', 'John doe', 'Devil Boss', 'Om gupta'];
    const users = await User.find({});

    let membersAdded = 0;

    for (const user of users) {
        // Check if this user should be a member
        const isTargetMember = targetNames.some(n =>
            user.name.toLowerCase().includes(n.toLowerCase())
        );

        if (!isTargetMember) continue;

        console.log(`\nProcessing: ${user.name}`);
        console.log(`  Current joinedClubs: ${JSON.stringify(user.joinedClubs)}`);

        // Check if already properly joined (as ObjectId)
        let hasProperMembership = false;
        const cleanedClubs = [];

        for (const cid of user.joinedClubs) {
            const cidStr = cid.toString();
            if (cidStr === clubIdStr) {
                // Convert to proper ObjectId if needed
                if (mongoose.isValidObjectId(cid) && cid instanceof mongoose.Types.ObjectId) {
                    hasProperMembership = true;
                    cleanedClubs.push(cid);
                } else {
                    // Replace with proper ObjectId
                    console.log(`  Fixing: Converting ${typeof cid} to ObjectId`);
                    cleanedClubs.push(clubObjectId);
                    hasProperMembership = true;
                }
            } else {
                // Keep other club memberships
                cleanedClubs.push(cid);
            }
        }

        // If not found at all, add it
        if (!hasProperMembership) {
            console.log(`  Adding: Club membership`);
            cleanedClubs.push(clubObjectId);
            membersAdded++;
        }

        // Save cleaned array
        user.joinedClubs = cleanedClubs;
        await user.save();
        console.log(`  Saved: ${JSON.stringify(user.joinedClubs)}`);
    }

    // 3. Verify count
    const finalCount = await User.countDocuments({ joinedClubs: clubObjectId });
    console.log(`\n--- Final Verification ---`);
    console.log(`Members with ObjectId match: ${finalCount}`);

    // 4. Update Club document
    club.memberCount = finalCount;

    // Find coordinator from coreTeam
    const coordinator = club.coreTeam.find(m => m.role === 'club_coordinator') ||
        club.coreTeam.find(m => m.role === 'club_head');
    if (coordinator) {
        club.coordinator = coordinator.name;
        club.coordinatorId = coordinator.userId;
        console.log(`Coordinator set to: ${coordinator.name}`);
    }

    await club.save();
    console.log(`Club memberCount set to: ${club.memberCount}`);

    console.log('\nFix complete!');
    process.exit(0);
}

comprehensiveFix().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
