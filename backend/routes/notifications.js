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
        const { userId, role } = req.query;

        if (!userId) return res.status(400).json({ message: 'User ID required' });

        // Map roles to recipient group identifiers
        const roleGroups = ['all'];
        if (role === 'student') roleGroups.push('students');
        if (role === 'club_member' || role === 'core_member') roleGroups.push('students', 'members');
        if (role === 'club_coordinator' || role === 'club_co_coordinator' || role === 'club_head') roleGroups.push('coordinators', 'admins');
        if (role === 'admin' || role === 'co_admin') roleGroups.push('admins', 'students', 'coordinators');
        if (role === 'owner') roleGroups.push('owner', 'admins', 'students', 'coordinators');

        console.log(`Fetching notifications for UserID: ${userId}, Role: ${role}, RoleGroups: ${roleGroups}`);

        const query = {
            $or: [
                { recipient: userId },         // Direct message
                { recipient: { $in: roleGroups } } // Role-based or Global
            ]
        };

        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        res.json(notifications);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST send notification
router.post('/', async (req, res) => {
    try {
        const { recipient, title, message, senderId, type, category } = req.body;
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
            sender: senderId,
            title,
            message,
            type,
            category: category || 'general'
        });

        console.log('Attempting to save notification:', { recipient: finalRecipient, title, senderId });
        await notification.save();
        res.status(201).json(notification);
    } catch (err) {
        console.error('Notification Creation Error:', err.message);
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

// PUT mark all as read for a user
router.put('/mark-all-read', async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId) return res.status(400).json({ message: 'User ID required' });

        // Identify which notifications the user can see (sync with GET route)
        const roleGroups = ['all'];
        if (role === 'student') roleGroups.push('students');
        if (role === 'club_member' || role === 'core_member') roleGroups.push('students', 'members');
        if (role === 'club_coordinator' || role === 'club_co_coordinator' || role === 'club_head') roleGroups.push('coordinators', 'admins');
        if (role === 'admin' || role === 'co_admin') roleGroups.push('admins', 'students', 'coordinators');
        if (role === 'owner') roleGroups.push('owner', 'admins', 'students', 'coordinators');

        const query = {
            $or: [
                { recipient: userId },
                { recipient: { $in: roleGroups } }
            ],
            readBy: { $ne: userId } // Only unread ones
        };

        const result = await Notification.updateMany(
            query,
            { $addToSet: { readBy: userId } }
        );

        res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
