const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function fixFinalData() {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Find Club
    const club = await Club.findOne({ name: { $regex: 'Robotics', $options: 'i' } });
    if (!club) { console.log('Club not found'); process.exit(1); }

    console.log(`Target Club: ${club.name} (${club._id})`);

    // 2. Find Members
    // User mentioned these names in screenshots: Abc, Ojasava, John doe, Devil Boss, Om gupta
    const memberNames = ['Abc', 'Ojasava', 'John doe', 'Devil Boss', 'Om gupta'];
    const users = await User.find({
        name: { $in: memberNames.map(n => new RegExp(n, 'i')) }
    });

    console.log(`Found ${users.length} users matching target list.`);

    // 3. Fix Membership (Ensure Clean ObjectId)
    const clubId = club._id;
    let coordinatorName = "Unknown";

    for (const u of users) {
        console.log(`Processing ${u.name}...`);

        // Ensure joinedClubs has the ID
        const hasClub = u.joinedClubs.some(c => c.toString() === clubId.toString());
        if (!hasClub) {
            u.joinedClubs.push(clubId);
            console.log(`  - Added to club`);
        }

        // Clean up duplicates if any
        const uniqueClubs = [];
        u.joinedClubs.forEach(c => {
            if (!uniqueClubs.some(uc => uc.toString() === c.toString())) {
                uniqueClubs.push(c);
            }
        });
        u.joinedClubs = uniqueClubs;

        // Check role for Coordinator
        if (u.role === 'club_coordinator' || u.name.toLowerCase().includes('abc') || u.name.toLowerCase().includes('ojasava')) {
            // Prefer explicitly named coordinator if possible, or just take the first one found
            if (coordinatorName === "Unknown" || u.role === 'club_coordinator') {
                coordinatorName = u.name;
            }
        }

        await u.save();
    }

    // 4. Update Club Data
    // Hard set count to 5 (or valid count)
    const validCount = await User.countDocuments({ joinedClubs: clubId });
    console.log(`Database Real Count: ${validCount}`);

    club.memberCount = validCount;

    // Fix Coordinator Name ("John Don" -> Real Name)
    if (coordinatorName !== "Unknown") {
        console.log(`Updating Coordinator from "${club.coordinator}" to "${coordinatorName}"`);
        club.coordinator = coordinatorName;
        // Also update coordinatorId if we found the user
        const coordUser = users.find(u => u.name === coordinatorName);
        if (coordUser) {
            club.coordinatorId = coordUser._id;
        }
    }

    await club.save();
    console.log('Club updated successfully.');

    process.exit(0);
}

fixFinalData();
