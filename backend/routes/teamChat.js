const express = require('express');
const router = express.Router();
const TeamChatMessage = require('../models/TeamChatMessage');
const ChallengeTeam = require('../models/ChallengeTeam');
const User = require('../models/User');

// GET all messages for a team
router.get('/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.query;

        // Verify team exists
        const team = await ChallengeTeam.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Verify user is a member of the team
        if (!team.members.includes(userId)) {
            return res.status(403).json({ message: 'You are not a member of this team' });
        }

        // Fetch messages sorted by timestamp
        const messages = await TeamChatMessage.find({ teamId })
            .sort({ timestamp: 1 })
            .limit(100); // Limit to last 100 messages

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new message
router.post('/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId, message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        // Verify team exists
        const team = await ChallengeTeam.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Verify user is a member of the team
        if (!team.members.includes(userId)) {
            return res.status(403).json({ message: 'You are not a member of this team' });
        }

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create and save message
        const chatMessage = new TeamChatMessage({
            teamId,
            senderId: userId,
            senderName: user.name,
            message: message.trim()
        });

        await chatMessage.save();

        res.status(201).json(chatMessage);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
