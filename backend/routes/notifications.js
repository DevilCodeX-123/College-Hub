const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET notifications for the current user (using headers for mock auth or updated middleware)
// Assuming we are passing x-user-id header or similar for now or will assume client sends user info query
// For proper implementation, we should use auth middleware. I'll check how auth is handled.
// The auth middleware isn't fully integrated in other routes yet (e.g. clubs.js checks nothing), 
// but auth.js produces a token. Let's assume the frontend sends 'x-user-role' and 'x-user-id' for now 
// OR we rely on the client to filter. Ideally, backend should filter.

router.get('/', async (req, res) => {
    try {
        const { userId, role } = req.query; // Expecting query params for simplicity as auth middleware isn't universal yet

        if (!userId) return res.status(400).json({ message: 'User ID required' });

        // Find individual messages OR messages for their role OR 'all'
        const notifications = await Notification.find({
            $or: [
                { recipient: userId },
                { recipient: 'all' },
                { recipient: role === 'admin' ? 'admins' : role === 'student' ? 'students' : 'others' }, // Simplified role mapping needed
                // Better approach:
                { recipient: 'students' }, // If user is student
                { recipient: 'coordinators' } // If user is coordinator
            ]
        }).sort({ createdAt: -1 });

        // Filter based on actual role matches if needed, but the $or query above is rough.
        // Let's make it cleaner:

        const query = {
            $or: [
                { recipient: userId }, // Direct message
                { recipient: 'all' }   // Global message
            ]
        };

        if (role === 'student') query.$or.push({ recipient: 'students' });
        if (role === 'club_coordinator') query.$or.push({ recipient: 'coordinators' });
        if (role === 'admin') query.$or.push({ recipient: 'admins' });

        const finalNotifications = await Notification.find(query).sort({ createdAt: -1 });
        res.json(finalNotifications);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST send notification
router.post('/', async (req, res) => {
    try {
        const { recipient, title, message, senderId, type } = req.body;
        console.log('Notification Request Body:', req.body);
        console.log('SenderID Type:', typeof senderId, 'Value:', senderId);

        // If recipient is email, find id
        let finalRecipient = recipient;
        if (recipient.includes('@')) {
            const user = await User.findOne({ email: recipient });
            if (!user) return res.status(404).json({ message: 'User not found' });
            finalRecipient = user.id;
        }

        const notification = new Notification({
            recipient: finalRecipient,
            sender: senderId, // Correct: The schema expects 'sender', but we are passing it 'senderId' from frontend, so variable name here is fine, but lets check schema.
            // Wait, schema has 'sender' field. In destructuring above we have 'senderId'. 
            // So: sender: senderId is correct IF schema has 'sender'.
            // Let me re-read schema.
            title,
            message,
            type
        });

        await notification.save();
        res.status(201).json(notification);
    } catch (err) {
        console.error('Notification Send Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// PUT mark as read
router.put('/:id/read', async (req, res) => {
    try {
        const { userId } = req.body;
        const notification = await Notification.findById(req.params.id);

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        if (!notification.readBy.includes(userId)) {
            notification.readBy.push(userId);
            await notification.save();
        }

        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
