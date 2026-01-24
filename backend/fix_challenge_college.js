const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Club = require('./models/Club');
const Challenge = require('./models/Challenge');

const fixChallengeCollege = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const challenges = await Challenge.find({});
        console.log(`Found ${challenges.length} challenges to check.`);

        for (const challenge of challenges) {
            console.log(`Checking challenge: ${challenge.title} (${challenge._id})`);

            if (!challenge.college) {
                if (challenge.clubId) {
                    const club = await Club.findById(challenge.clubId);
                    if (club) {
                        console.log(`  - Found club: ${club.name}, College: ${club.college}`);
                        challenge.college = club.college;
                        // Also sync clubName if missing
                        if (!challenge.clubName) challenge.clubName = club.name;

                        await challenge.save();
                        console.log('  - Updated challenge with college.');
                    } else {
                        console.log('  - Club not found for this challenge.');
                    }
                } else {
                    console.log('  - No clubId on this challenge.');
                }
            } else {
                console.log(`  - College already set: ${challenge.college}`);
            }
        }

        console.log('Fix complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixChallengeCollege();
