const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Poll = require('./models/Poll');

dotenv.config();

async function checkPolls() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const allPolls = await Poll.find({});
        console.log(`Total polls: ${allPolls.length}`);

        allPolls.forEach(p => {
            console.log(`- Q: ${p.question}, isRating: ${p.isRatingPoll || false}, expiresAt: ${p.expiresAt || 'MISSING'}, status: ${p.status}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPolls();
