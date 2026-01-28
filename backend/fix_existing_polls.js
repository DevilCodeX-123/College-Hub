const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Poll = require('./models/Poll');

dotenv.config();

async function fixPolls() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all active polls without expiresAt
        const polls = await Poll.find({
            status: 'active',
            expiresAt: { $exists: false }
        });

        console.log(`Found ${polls.length} polls to fix`);

        for (const poll of polls) {
            // Set expiresAt to createdAt + 24 hours
            const createdAt = poll.createdAt || new Date();
            poll.expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
            await poll.save();
            console.log(`Fixed poll: ${poll.question}`);
        }

        console.log('Finished fixing polls');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixPolls();
