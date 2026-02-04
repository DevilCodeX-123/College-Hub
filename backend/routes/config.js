const express = require('express');
const router = express.Router();
const PlatformConfig = require('../models/PlatformConfig');
const User = require('../models/User');

// Middleware to check if user is owner
const isOwner = async (req, res, next) => {
    try {
        const userId = req.body.requestingUserId || req.query.requestingUserId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const user = await User.findById(userId);
        if (user && user.role === 'owner') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Owner only.' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route   GET api/config
// @desc    Get platform configuration
// @access  Public
router.get('/', async (req, res) => {
    try {
        let config = await PlatformConfig.findOne();
        if (!config) {
            // Create default config if it doesn't exist
            config = new PlatformConfig();
            await config.save();
        }
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT api/config
// @desc    Update platform configuration
// @access  Owner
router.put('/', isOwner, async (req, res) => {
    try {
        let config = await PlatformConfig.findOne();
        if (!config) {
            config = new PlatformConfig(req.body);
        } else {
            Object.assign(config, req.body);
        }
        await config.save();
        res.json(config);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
