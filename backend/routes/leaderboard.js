const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');
const Challenge = require('../models/Challenge');

// Get College Leaderboard (Weekly XP based)
router.get('/college', async (req, res) => {
    try {
        const { college, requestingUserId } = req.query;
        let query = {}; // Remove role filtering to show all students

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                // Determine college for isolation
                if (requester.college) {
                    const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
                }
            }
        }

        if (college && college !== 'undefined' && college !== 'null') {
            const cleanCollege = college.trim();
            // If query.college is already set by bubble logic, respect it
            // Otherwise, apply fuzzy match
            if (!query.college) {
                const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
            }
        }

        const users = await User.find(query)
            .select('name avatar college totalEarnedXP weeklyXP role branch year skills')
            .sort({ weeklyXP: -1 })
            .limit(50);

        const leaderboard = users.map((user, index) => ({
            userId: user.id,
            name: user.name,
            avatar: user.avatar,
            college: user.college,
            branch: user.branch,
            year: user.year,
            skills: user.skills,
            points: user.weeklyXP || 0, // Show weeklyXP as the main leaderboard point
            totalXP: user.totalEarnedXP,
            rank: index + 1
        }));

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Challenge-specific Leaderboard (Marks based)
router.get('/challenge/:challengeId', async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.challengeId);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Filter for approved submissions and sort by marks
        const approvedSubmissions = challenge.submissions
            .filter(sub => sub.status === 'approved')
            .sort((a, b) => {
                const marksDiff = (b.marks || 0) - (a.marks || 0);
                if (marksDiff !== 0) return marksDiff;
                // Tie-breaker: Earlier submission wins
                return new Date(a.submittedAt) - new Date(b.submittedAt);
            });

        const leaderboard = approvedSubmissions.map((sub, index) => ({
            userId: sub.userId,
            name: sub.userName,
            marks: sub.marks,
            submittedAt: sub.submittedAt,
            rank: index + 1
        }));

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Club Leaderboard (Club points based)
router.get('/clubs', async (req, res) => {
    try {
        const { college, requestingUserId } = req.query;
        let query = {};

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                // Determine college for isolation
                if (requester.college) {
                    const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
                }
            }
        }

        if (college && college !== 'undefined' && college !== 'null') {
            const cleanCollege = college.trim();
            // If query.college is already set by bubble logic, respect it
            // Otherwise, apply fuzzy match
            if (!query.college) {
                const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
            }
        }

        const clubs = await Club.find(query)
            .select('name logo points monthlyPoints memberCount coordinator category')
            .sort({ monthlyPoints: -1 })
            .limit(20);

        const leaderboard = clubs.map((club, index) => ({
            clubId: club.id,
            name: club.name,
            logo: club.logo,
            points: club.monthlyPoints || 0,
            totalPoints: club.points,
            memberCount: club.memberCount,
            rank: index + 1
        }));

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
