/**
 * Leveling Logic Utility (Backend)
 */

function calculateLevelFromXP(totalXP) {
    let level = 1;
    let currentLevelStep = 1000;
    let accumulatedXPToNext = 1000;

    while (totalXP >= accumulatedXPToNext) {
        level++;
        currentLevelStep = Math.round((currentLevelStep * 1.5) / 50) * 50;
        accumulatedXPToNext += currentLevelStep;
    }
    return level;
}

module.exports = { calculateLevelFromXP };
