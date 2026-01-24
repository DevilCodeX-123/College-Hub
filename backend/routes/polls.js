const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const User = require('../models/User');
const Club = require('../models/Club');

// GET all active polls (filtered by user)
router.get('/', async (req, res) => {
    try {
        const { userId, role, email, clubId, college, status } = req.query;

        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        } else if (!status) {
            query.status = 'active'; // Default to active for backward compatibility
        }

        if (college) {
            const cleanCollege = college.trim();
            const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
        }

        if (clubId) {
            query.clubId = clubId;
        }

        // If user context is provided, filter based on targeting
        if (userId && role) {
            const audienceQuery = {
                $or: [
                    { targetRoles: 'all' },
                    { targetRoles: { $in: [role] } },
                    { specificEmails: { $in: [email] } }
                ]
            };
            query = { ...query, ...audienceQuery };
        }

        const polls = await Poll.find(query).sort({ createdAt: -1 });

        // Scrub votes if user is not the creator
        const sanitizedPolls = polls.map(poll => {
            const pollObj = poll.toObject();
            const hasVoted = userId && poll.votedBy.includes(userId);
            const isCreator = userId && poll.createdBy.toString() === userId;

            if (userId && !isCreator && !hasVoted) {
                pollObj.options = pollObj.options.map(opt => ({
                    _id: opt._id,
                    text: opt.text,
                    votes: undefined
                })); // Remove votes count for non-participants
                pollObj.votedBy = undefined; // Hide voter list
            }
            return pollObj;
        });

        res.json(sanitizedPolls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create a new poll
router.post('/', async (req, res) => {
    try {
        const { question, options, createdBy, targetRoles, specificEmails, clubId, college, expiresAt } = req.body;

        const formattedOptions = options.map(opt => ({ text: opt, votes: 0 }));

        const poll = new Poll({
            question,
            options: formattedOptions,
            createdBy,
            targetRoles: targetRoles || ['all'],
            specificEmails: specificEmails || [],
            clubId: clubId || null,
            college: college ? college.trim() : null,
            expiresAt: expiresAt || null
        });

        const newPoll = await poll.save();
        res.status(201).json(newPoll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST vote on a poll
router.post('/:id/vote', async (req, res) => {
    try {
        const { userId, optionIndex } = req.body;
        const poll = await Poll.findById(req.params.id);

        if (!poll) return res.status(404).json({ message: 'Poll not found' });
        if (poll.status !== 'active') return res.status(400).json({ message: 'Poll is closed' });

        if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
            return res.status(400).json({ message: 'Poll has expired' });
        }

        // Check if user is in the target audience
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // If poll is targeted, verify user role/email
        const isTargeted = poll.targetRoles.includes('all') ||
            poll.targetRoles.includes(user.role) ||
            poll.specificEmails.includes(user.email);

        if (!isTargeted) {
            return res.status(403).json({ message: 'You are not authorized to vote on this poll' });
        }

        if (poll.votedBy.includes(userId)) {
            return res.status(400).json({ message: 'You have already voted' });
        }

        poll.options[optionIndex].votes += 1;
        poll.votedBy.push(userId);

        await poll.save();

        // Award points if it's a rating poll
        if (poll.isRatingPoll && poll.clubId) {
            try {
                const club = await Club.findById(poll.clubId);
                if (club) {
                    // Extract numerical value from option text (e.g. "3 Stars" -> 3)
                    const ratingValue = parseInt(poll.options[optionIndex].text) || 0;
                    if (ratingValue > 0) {
                        club.points = (club.points || 0) + ratingValue;
                        club.monthlyPoints = (club.monthlyPoints || 0) + ratingValue;
                        await club.save();
                    }
                }
            } catch (clubErr) {
                console.error('Error awarding club points from poll:', clubErr);
                // Don't fail the vote if club update fails
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
        res.json({ message: 'Poll deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH update poll status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const poll = await Poll.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(poll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH extend poll duration
router.patch('/:id/extend', async (req, res) => {
    try {
        const { hours } = req.body;
        const poll = await Poll.findById(req.params.id);

        if (!poll) return res.status(404).json({ message: 'Poll not found' });

        let newExpiry;
        if (poll.expiresAt) {
            newExpiry = new Date(new Date(poll.expiresAt).getTime() + (hours * 60 * 60 * 1000));
        } else {
            newExpiry = new Date(Date.now() + (hours * 60 * 60 * 1000));
        }

        poll.expiresAt = newExpiry;
        poll.status = 'active'; // Re-open if closed automatically (logic to be handled by cron/check later, but safe to set active here)
        await poll.save();

        res.json(poll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
