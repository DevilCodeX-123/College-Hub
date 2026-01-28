const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

async function checkEvents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const events = await Event.find({});
        console.log(`Found ${events.length} events:`);

        events.forEach(event => {
            console.log('---');
            console.log(`ID: ${event._id}`);
            console.log(`Title: ${event.title}`);
            console.log(`Date: ${event.date}`);
            console.log(`Club: ${event.clubName}`);
            console.log(`Organizing Club: ${event.organizingClub}`);
            console.log(`College: ${event.college}`);
            console.log(`Duration: ${event.duration}`);
            console.log(`Location: ${event.location}`);
            console.log(`Cover: ${event.coverImage ? 'Present' : 'MISSING'}`);
            console.log(`Winners: ${event.winners?.length || 0}`);
            console.log(`Xp: ${event.xpReward}`);
            console.log(`Is Completed: ${event.isCompleted}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkEvents();
