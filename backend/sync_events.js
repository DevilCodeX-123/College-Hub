const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

const eventDetails = {
    'Dance meet': {
        duration: '2:00 PM - 6:00 PM',
        organizingClub: 'Cultural & Arts Club',
        location: 'SAC Auditorium',
        coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200'
    },
    'Guess': {
        duration: '10:00 AM - 1:00 PM',
        organizingClub: 'Literary Society',
        location: 'Main Seminar Hall',
        coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200'
    },
    'Hhiiii': {
        title: 'Robo-Genesis 2026',
        duration: '9:00 AM - 5:00 PM',
        organizingClub: 'Robotics Club',
        location: 'LHC-2 Robotics Lab',
        coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200'
    },
    'Robo-Genesis 2026': {
        duration: '9:00 AM - 5:00 PM',
        organizingClub: 'Robotics Club',
        location: 'LHC-2 Robotics Lab',
        coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200'
    }
};

async function syncEventData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const events = await Event.find({});

        for (const event of events) {
            const title = event.title.trim();
            const updates = eventDetails[title];
            if (updates) {
                Object.assign(event, updates);
                event.isCompleted = true; // Ensure they are marked completed to show in past
                await event.save();
                console.log(`Updated: "${title}"`);
            } else {
                // Default updates for any other unknown events
                event.duration = event.duration || 'Session-1: 10AM - 1PM';
                event.organizingClub = event.organizingClub || event.clubName;
                event.isCompleted = true;
                await event.save();
                console.log(`Finalized: ${event.title}`);
            }
        }

        console.log('Data synchronization complete.');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

syncEventData();
