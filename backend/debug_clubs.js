const mongoose = require('mongoose');
const Club = require('./models/Club');

const URI = 'mongodb+srv://dbadmin:Devil%40123@cluster0.wrxge6j.mongodb.net/college-chronicle?retryWrites=true&w=majority&appName=Cluster0';

async function inspectClubs() {
    console.log('Starting inspection...');
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');

        const clubs = await Club.find({});
        console.log(`Found ${clubs.length} clubs.`);

        if (clubs.length === 0) {
            console.log('No clubs found in database.');
        }

        clubs.forEach(c => {
            console.log(`Club: "${c.name}", College: "${c.college}", ID: ${c._id}`);
        });

        console.log('Inspection complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

inspectClubs();
