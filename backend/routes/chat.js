const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Project = require('../models/Project');

// Get messages for a club
router.get('/:clubId', async (req, res) => {
    try {
        const messages = await Message.find({ clubId: req.params.clubId })
            .populate('sender', 'name avatar role') // Populate sender details
            .sort({ createdAt: 1 }); // Oldest first
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Post a message to a club
router.post('/:clubId', async (req, res) => {
    const { content, senderId } = req.body; // Expecting senderId from frontend for now (until Auth middleware is fully applied to req.user)

    try {
        const newMessage = new Message({
            content,
            sender: senderId,
            clubId: req.params.clubId
        });

        const savedMessage = await newMessage.save();

        // Populate sender details for the response so UI can display it
        await savedMessage.populate('sender', 'name avatar role');

        res.status(201).json(savedMessage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Project Chat Routes ---

// Get messages for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const messages = await Message.find({ projectId: req.params.projectId })
            .populate('sender', 'name avatar role')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Post a message to a project
router.post('/project/:projectId', async (req, res) => {
    const { content, senderId } = req.body;

    try {
        const project = await Project.findById(req.params.projectId);
        if (project && project.status === 'on_hold') {
            return res.status(403).json({ message: 'Project is paused. Chat disabled.' });
        }

        const newMessage = new Message({
            content,
            sender: senderId,
            projectId: req.params.projectId
        });

        const savedMessage = await newMessage.save();
        await savedMessage.populate('sender', 'name avatar role');

        res.status(201).json(savedMessage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get latest message timestamp for all projects a user belongs to
router.get('/projects/latest-timestamp/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Find all projects the user is in
        const userProjects = await Project.find({ team: userId });
        const projectIds = userProjects.map(p => p._id);

        if (projectIds.length === 0) {
            return res.json({ latestTimestamp: null });
        }

        // 2. Find the most recent message for these projects
        const latestMessage = await Message.findOne({
            projectId: { $in: projectIds }
        })
            .sort({ createdAt: -1 })
            .select('createdAt');

        res.json({ latestTimestamp: latestMessage ? latestMessage.createdAt : null });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
