const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Poll = require('./models/Poll');

dotenv.config();

async function checkRatingPolls() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const polls = await Poll.find({ isRatingPoll: true });
        console.log(`Rating polls found: ${polls.length}`);
        polls.forEach(p => {
            console.log(`JSON_START${JSON.stringify({
                question: p.question,
                status: p.status,
                expiresAt: p.expiresAt,
                createdAt: p.createdAt
            })}JSON_END`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRatingPolls();
