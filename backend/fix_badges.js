require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string from .env
const MONGODB_URI = process.env.MONGO_URI;

async function fixBadges() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all users with badges
        const users = await User.find({ 'badges.0': { $exists: true } });
        console.log(`Found ${users.length} users with badges`);

        let fixedCount = 0;

        for (const user of users) {
            let modified = false;

            for (const badge of user.badges) {
                // Fix badges where name is "award" and description contains the actual award name
                if (badge.name === 'award' && badge.description) {
                    console.log(`\nFixing badge for user: ${user.name}`);
                    console.log(`  Before: name="${badge.name}", description="${badge.description}"`);

                    // Move description to name
                    badge.name = badge.description;
                    badge.description = badge.description; // Keep description same for now

                    console.log(`  After: name="${badge.name}", description="${badge.description}"`);
                    modified = true;
                }

                // Fix challengeName if it's "Special Award" or empty
                if (!badge.challengeName || badge.challengeName === 'Special Award') {
                    // If we don't have a proper challenge name, use a placeholder
                    // Coordinators should update this when awarding badges
                    if (!badge.challengeName) {
                        badge.challengeName = 'Competition Award';
                        modified = true;
                    }
                }

                // Ensure clubName exists
                if (!badge.clubName) {
                    badge.clubName = 'Campus Hub';
                    modified = true;
                }
            }

            if (modified) {
                await user.save();
                fixedCount++;
                console.log(`✓ Fixed badges for ${user.name}`);
            }
        }

        console.log(`\n✅ Successfully fixed badges for ${fixedCount} users`);
        console.log('\nSummary of all badges:');

        // Show summary
        for (const user of users) {
            console.log(`\n${user.name}:`);
            user.badges.forEach((badge, idx) => {
                console.log(`  Badge ${idx + 1}:`);
                console.log(`    Name: ${badge.name}`);
                console.log(`    Challenge: ${badge.challengeName || 'N/A'}`);
                console.log(`    Club: ${badge.clubName || 'N/A'}`);
            });
        }

    } catch (error) {
        console.error('Error fixing badges:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

fixBadges();
