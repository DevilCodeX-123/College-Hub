require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGO_URI;

async function fixBadgeIcons() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const users = await User.find({ 'badges.0': { $exists: true } });
        console.log(`Found ${users.length} users with badges\n`);

        let fixedCount = 0;

        for (const user of users) {
            let modified = false;

            for (const badge of user.badges) {
                // Fix icon if it's "award" or other text
                if (badge.icon === 'award' || badge.icon === '🏅' || !badge.icon) {
                    console.log(`Fixing icon for ${user.name} - Badge: ${badge.name}`);
                    console.log(`  Old icon: "${badge.icon}"`);

                    // Set appropriate icon based on badge name
                    if (badge.name && badge.name.toLowerCase().includes('grandmaster')) {
                        badge.icon = '👑';
                    } else if (badge.name && badge.name.toLowerCase().includes('rank 1')) {
                        badge.icon = '🥇';
                    } else if (badge.name && badge.name.toLowerCase().includes('rank 2')) {
                        badge.icon = '🥈';
                    } else if (badge.name && badge.name.toLowerCase().includes('rank 3')) {
                        badge.icon = '🥉';
                    } else if (badge.name && badge.name.toLowerCase().includes('winner')) {
                        badge.icon = '🏆';
                    } else {
                        badge.icon = '🏅'; // Default trophy icon
                    }

                    console.log(`  New icon: "${badge.icon}"`);
                    modified = true;
                }

                // Clean up trailing spaces in name
                if (badge.name && badge.name !== badge.name.trim()) {
                    badge.name = badge.name.trim();
                    modified = true;
                }
            }

            if (modified) {
                await user.save();
                fixedCount++;
                console.log(`✓ Fixed badges for ${user.name}\n`);
            }
        }

        console.log(`\n✅ Successfully fixed badges for ${fixedCount} users\n`);

        // Show final state
        console.log('Final badge state:');
        for (const user of users) {
            console.log(`\n${user.name}:`);
            user.badges.forEach((badge, idx) => {
                console.log(`  Badge ${idx + 1}: ${badge.icon} ${badge.name}`);
                console.log(`    Challenge: ${badge.challengeName || 'N/A'}`);
                console.log(`    Club: ${badge.clubName || 'N/A'}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

fixBadgeIcons();
