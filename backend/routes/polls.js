const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const User = require('../models/User');
const Club = require('../models/Club');

// GET all active/closed polls
router.get('/', async (req, res) => {
    try {
        const { userId, role, email, clubId, college, status } = req.query;
        const now = new Date();

        // 1. Auto-close expired polls in database
        await Poll.updateMany(
            { status: 'active', expiresAt: { $ne: null, $lte: now } },
            { status: 'closed' }
        );

        let query = {};
        const conditions = [];

        // 2. Filter by status and time
        if (status === 'active') {
            conditions.push({ status: 'active' });
            conditions.push({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
        } else if (status === 'closed') {
            conditions.push({
                $or: [
                    { status: 'closed' },
                    { expiresAt: { $lte: now } }
                ]
            });
        }

        if (college) {
            const cleanCollege = college.trim();
            const collegeNamePattern = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            conditions.push({ college: { $regex: new RegExp(`^\\s*${collegeNamePattern}\\s*$`, 'i') } });
        }

        if (clubId) {
            conditions.push({ clubId });
        }

        if (userId && role) {
            conditions.push({
                $or: [
                    { targetRoles: 'all' },
                    { targetRoles: { $in: [role] } },
                    { specificEmails: { $in: [email] } }
                ]
            });
        }

        if (conditions.length > 0) {
            query = { $and: conditions };
        }

        const polls = await Poll.find(query).sort({ createdAt: -1 });

        const sanitizedPolls = polls.map(poll => {
            const pollObj = poll.toObject();
            const hasVoted = userId && poll.votedBy.some(id => id.toString() === userId.toString());
            const isCreator = userId && poll.createdBy.toString() === userId.toString();

            if (userId && !isCreator && !hasVoted) {
                pollObj.options = pollObj.options.map(opt => ({
                    _id: opt._id,
                    text: opt.text,
                    votes: undefined
                }));
                pollObj.votedBy = undefined;
            }
            return pollObj;
        });

        res.json(sanitizedPolls);
    } catch (err) {
        console.error('Fetch polls error:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST create poll
router.post('/', async (req, res) => {
    try {
        const { question, options, createdBy, targetRoles, specificEmails, clubId, college, expiresAt, isRatingPoll } = req.body;
        const formattedOptions = options.map(opt => ({ text: opt, votes: 0 }));
        const poll = new Poll({
            question,
            options: formattedOptions,
            createdBy,
            targetRoles: targetRoles || ['all'],
            specificEmails: specificEmails || [],
            clubId: clubId || null,
            college: college ? college.trim() : null,
            expiresAt: expiresAt || null,
            isRatingPoll: isRatingPoll || false
        });
        const newPoll = await poll.save();
        res.status(201).json(newPoll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST vote
router.post('/:id/vote', async (req, res) => {
    try {
        const { userId, optionIndex } = req.body;
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found' });
        if (poll.status !== 'active') return res.status(400).json({ message: 'Poll closed' });
        if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) return res.status(400).json({ message: 'Expired' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (poll.votedBy.includes(userId)) return res.status(400).json({ message: 'Already voted' });

        poll.options[optionIndex].votes += 1;
        poll.votedBy.push(userId);
        await poll.save();

        if (poll.isRatingPoll && poll.clubId) {
            const club = await Club.findById(poll.clubId);
            if (club) {
                const val = parseInt(poll.options[optionIndex].text) || 0;
                // Double check if it's a star text like "5 Stars ⭐⭐⭐⭐⭐"
                const starMatch = poll.options[optionIndex].text.match(/(\d+)/);
                const points = starMatch ? parseInt(starMatch[1]) : val;

                if (points > 0) {
                    club.points = (club.points || 0) + points;
                    club.monthlyPoints = (club.monthlyPoints || 0) + points;

                    club.pointsHistory.push({
                        amount: points,
                        reason: `Rating Poll: ${points} stars for activity related to ${poll.question}`,
                        sourceId: poll._id,
                        sourceType: 'bonus', // Ratings are bonuses
                        timestamp: new Date()
                    });

                    await club.save();
                }
            }
        }
        res.json(poll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE poll
router.delete('/:id', async (req, res) => {
    try {
        await Poll.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH status
router.patch('/:id/status', async (req, res) => {
    try {
        const poll = await Poll.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(poll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH extend
router.patch('/:id/extend', async (req, res) => {
    try {
        const { hours } = req.body;
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Not found' });

        const current = poll.expiresAt ? new Date(poll.expiresAt) : new Date();
        poll.expiresAt = new Date(current.getTime() + (hours * 60 * 60 * 1000));
        poll.status = 'active';
        await poll.save();
        res.json(poll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
