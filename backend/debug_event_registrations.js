const mongoose = require('mongoose');
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/college-hub', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    checkRegistrations();
}).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
});

async function checkRegistrations() {
    try {
        const events = await Event.find({ 'registrations.0': { $exists: true } }).sort({ updatedAt: -1 }).limit(5);

        console.log(`Found ${events.length} events with registrations.`);

        events.forEach(event => {
            console.log(`\nEvent: ${event.title} (ID: ${event._id})`);
            console.log(`Total Registrations: ${event.registrations.length}`);
            event.registrations.forEach((reg, idx) => {
                console.log(`  [${idx + 1}] ${reg.name} (${reg.email})`);
                if (reg.teamMembers && reg.teamMembers.length > 0) {
                    console.log(`      Team Members (${reg.teamMembers.length}):`);
                    reg.teamMembers.forEach(tm => {
                        console.log(`      - ${tm.name} (${tm.email})`);
                    });
                } else {
                    console.log(`      No Team Members found (field: ${JSON.stringify(reg.teamMembers)})`);
                }
            });
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}
