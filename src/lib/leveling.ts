/**
 * Leveling Logic Utility
 * Increment(L) = round(Increment(L-1) * 1.5 / 50) * 50
 * Start Increment(1) = 1000 XP
 */

export const calculateLevelData = (totalXP: number) => {
    let level = 1;
    let currentLevelGoal = 1000;
    let accumulatedXPToReachNext = 1000;
    let previousAccumulatedXP = 0;

    while (totalXP >= accumulatedXPToReachNext) {
        level++;
        previousAccumulatedXP = accumulatedXPToReachNext;
        currentLevelGoal = Math.round((currentLevelGoal * 1.5) / 50) * 50;
        accumulatedXPToReachNext += currentLevelGoal;
    }

    const xpInCurrentLevel = totalXP - previousAccumulatedXP;
    const xpRequiredForNextLevel = accumulatedXPToReachNext - previousAccumulatedXP;

    return {
        level,
        currentXPInLevel: xpInCurrentLevel,
        nextLevelXPRequired: xpRequiredForNextLevel,
        totalXP,
        progress: (xpInCurrentLevel / xpRequiredForNextLevel) * 100,
    };
};
