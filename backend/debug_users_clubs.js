const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function inspectUsers() {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("--- Users & Joined Clubs Inspection ---");
    const users = await User.find({}, 'name email joinedClubs branch year role');
    const club = await Club.findOne({ name: { $regex: 'Robotics', $options: 'i' } });

    const clubId = club ? club._id.toString() : "UNKNOWN";
    console.log(`Target Club ID: ${clubId}`);

    users.forEach(u => {
        const clubData = u.joinedClubs.map(c => ({
            val: c.toString(),
            type: typeof c,
            isObjectId: c instanceof mongoose.Types.ObjectId,
            matchesTarget: c.toString() === clubId
        }));

        console.log(`\nUser: ${u.name} (${u._id})`);
        console.log(`   Branch: ${u.branch || 'N/A'}, Year: ${u.year || 'N/A'}, Role: ${u.role}`);
        console.log(`   Joined Clubs Raw:`, u.joinedClubs);
        console.log(`   Analysis:`, JSON.stringify(clubData));
    });

    // Check count
    if (club) {
        const countObj = await User.countDocuments({ joinedClubs: club._id });
        const countStr = await User.countDocuments({ joinedClubs: clubId });
        // Robust check
        const countDual = await User.countDocuments({ joinedClubs: { $in: [club._id, clubId] } });

        console.log(`\n--- Backend Count Check ---`);
        console.log(`Count (ObjectId): ${countObj}`);
        console.log(`Count (String): ${countStr}`);
        console.log(`Count (Dual $in): ${countDual}`);
    }

    process.exit(0);
}

inspectUsers();
