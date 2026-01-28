const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

const originalData = [
    {
        currentTitle: 'Robo-Genesis 2026',
        oldTitle: 'Hhiiii',
        clubName: 'Robotics Club, RTU'
    },
    {
        currentTitle: 'Guess',
        oldTitle: 'Guess',
        clubName: 'Literary Society, RTU'
    },
    {
        currentTitle: 'Dance meet',
        oldTitle: 'Dance meet ',
        clubName: 'Cultural & Arts Club, RTU'
    }
];

async function revertEventData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (const item of originalData) {
            const event = await Event.findOne({ title: item.currentTitle });
            if (event) {
                event.title = item.oldTitle;
                // Clear the fields I added
                event.duration = undefined;
                event.organizingClub = undefined;
                event.coverImage = undefined;
                event.isCompleted = true; // Keep as completed if they were past events

                await event.save();
                console.log(`Reverted: ${item.currentTitle} -> ${item.oldTitle}`);
            }
        }

        console.log('Data restoration complete.');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

revertEventData();
