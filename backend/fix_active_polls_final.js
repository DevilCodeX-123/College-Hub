const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Poll = require('./models/Poll');

dotenv.config();

async function fixAllActivePolls() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Target ALL active polls that don't have a valid expiresAt
        const polls = await Poll.find({
            status: 'active',
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null }
            ]
        });

        console.log(`Found ${polls.length} active polls to fix`);

        for (const poll of polls) {
            const createdAt = poll.createdAt || new Date();
            // Set expiresAt to 24 hours from creation
            poll.expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
            await poll.save();
            console.log(`Fixed poll: "${poll.question}" | New Expiry: ${poll.expiresAt}`);
        }

        console.log('Successfully updated all active polls with 24h expiry.');
        process.exit(0);
    } catch (err) {
        console.error('Error during poll fix:', err);
        process.exit(1);
    }
}

fixAllActivePolls();
