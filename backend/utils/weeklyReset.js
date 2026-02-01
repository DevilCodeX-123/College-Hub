const User = require('../models/User');
const Club = require('../models/Club');

/**
 * Get the Monday of the current week (00:00:00)
 */
function getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Award weekly badges to top 3 performers in each club
 * and reset weeklyXP to 0 for all users
 */
async function performWeeklyReset() {
    try {
        console.log('[Weekly Reset] Starting weekly reset process...');
        const weekStart = getWeekStart();

        // Get all clubs
        const clubs = await Club.find().lean();
        console.log(`[Weekly Reset] Processing ${clubs.length} clubs`);

        for (const club of clubs) {
            const clubId = club._id;

            // Get all members of this club sorted by weeklyXP
            const members = await User.find({
                joinedClubs: clubId
            }).sort({ weeklyXP: -1 }).limit(3);

            console.log(`[Weekly Reset] Club: ${club.name} - Top 3 members found: ${members.length}`);

            // Award badges to top 3 if they have any XP
            for (let i = 0; i < Math.min(3, members.length); i++) {
                const member = members[i];
                const rank = i + 1;

                // Only award if they have earned some XP this week
                if (member.weeklyXP && member.weeklyXP > 0) {
                    await User.findByIdAndUpdate(member._id, {
                        $push: {
                            clubWeeklyBadges: {
                                clubId: clubId,
                                clubName: club.name,
                                rank: rank,
                                weekStart: weekStart,
                                earnedAt: new Date()
                            }
                        }
                    });

                    console.log(`[Weekly Reset] Awarded rank ${rank} badge to ${member.name} for ${club.name} (${member.weeklyXP} XP)`);
                }
            }
        }

        // Reset weeklyXP for ALL users
        const resetResult = await User.updateMany({}, { weeklyXP: 0 });
        console.log(`[Weekly Reset] Reset weeklyXP for ${resetResult.modifiedCount} users`);

        console.log('[Weekly Reset] Weekly reset completed successfully!');
        return { success: true, message: 'Weekly reset completed' };
    } catch (error) {
        console.error('[Weekly Reset] Error during weekly reset:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if it's Monday and perform reset if needed
 */
async function checkAndResetIfMonday() {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // If it's Monday (1) and it's between midnight and 1 AM
    if (dayOfWeek === 1 && now.getHours() === 0) {
        console.log('[Weekly Reset] It\'s Monday! Starting weekly reset...');
        await performWeeklyReset();
    }
}

module.exports = {
    performWeeklyReset,
    checkAndResetIfMonday,
    getWeekStart
};
