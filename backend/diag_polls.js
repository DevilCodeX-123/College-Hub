const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const PollSchema = new mongoose.Schema({
    question: String,
    status: String,
    expiresAt: Date,
    createdAt: Date
}, { strict: false });

const Poll = mongoose.model('Poll', PollSchema);

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const now = new Date();
        console.log('Current Time (Server):', now.toISOString());

        const polls = await Poll.find({ question: /Guess|Dance/ });
        console.log(`Found ${polls.length} rating polls.`);

        polls.forEach(p => {
            const isExpired = p.expiresAt && now >= new Date(p.expiresAt);
            console.log('---');
            console.log('Question:', p.question);
            console.log('Status:', p.status);
            console.log('ExpiresAt:', p.expiresAt ? p.expiresAt.toISOString() : 'null');
            console.log('Is Expired?', !!isExpired);
        });

        // Try a manual fix while we are here
        const res = await Poll.updateMany(
            {
                status: 'active',
                expiresAt: { $ne: null, $lte: now }
            },
            { status: 'closed' }
        );
        console.log(`Manual update closed ${res.modifiedCount} polls.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
