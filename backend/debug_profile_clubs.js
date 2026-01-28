require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Club = require('./models/Club');

const MONGODB_URI = process.env.MONGO_URI;

async function debugUserClubs() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ name: /devil/i });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`User: ${user.name}`);
        console.log(`College: "${user.college}"`);
        console.log(`joinedClubs IDs:`, user.joinedClubs);

        for (const id of user.joinedClubs) {
            try {
                const club = await Club.findById(id);
                if (club) {
                    console.log(`- Found Club: ${club.name} (College: "${club.college}")`);
                } else {
                    console.log(`- Club ID ${id} not found in database!`);
                    // Try searching by _id string in raw collection
                    const rawClub = await mongoose.connection.db.collection('clubs').findOne({ _id: new mongoose.Types.ObjectId(id) });
                    if (rawClub) {
                        console.log(`  - Found in raw collection: ${rawClub.name} (College: "${rawClub.college}")`);
                    } else {
                        console.log(`  - Still not found in raw collection.`);
                    }
                }
            } catch (e) {
                console.log(`- Error looking up club ${id}: ${e.message}`);
            }
        }

        console.log('\nAll clubs in system for this college:');
        const collegeClubs = await mongoose.connection.db.collection('clubs').find({
            college: { $regex: new RegExp(`^${user.college.trim()}$`, 'i') }
        }).toArray();
        collegeClubs.forEach(c => console.log(`- ${c.name} (${c._id})`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugUserClubs();
