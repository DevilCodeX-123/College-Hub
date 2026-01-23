const mongoose = require('mongoose');
const Club = require('./models/Club');

const URI = 'mongodb+srv://dbadmin:Devil%40123@cluster0.wrxge6j.mongodb.net/college-chronicle?retryWrites=true&w=majority&appName=Cluster0';

async function fixClubData() {
    console.log('Starting data fix...');
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');

        const result = await Club.updateMany(
            { $or: [{ college: { $exists: false } }, { college: null }, { college: "undefined" }] },
            { $set: { college: "DTU" } }
        );

        console.log(`Updated ${result.modifiedCount} clubs to have college="DTU".`);

        const clubs = await Club.find({});
        clubs.forEach(c => {
            console.log(`Club: "${c.name}", College: "${c.college}"`);
        });

        console.log('Fix complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixClubData();
