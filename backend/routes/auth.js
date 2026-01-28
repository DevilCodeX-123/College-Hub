const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { calculateLevelFromXP } = require('../utils/leveling');

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, college } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password, // In real app, hash this!
            college,
            role: 'student' // Default role
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret', // Use env var in production
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                // Return full user object excluding password
                const userObj = user.toObject();
                delete userObj.password;
                res.json({ token, user: userObj });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    try {
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Daily Login Reward Check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
        if (lastLogin) {
            lastLogin.setHours(0, 0, 0, 0);
        }

        if (!lastLogin || lastLogin.getTime() < today.getTime()) {
            user.points = (user.points || 0) + 20;
            user.totalEarnedXP = (user.totalEarnedXP || 0) + 20;
            user.weeklyXP = (user.weeklyXP || 0) + 20;
            user.level = calculateLevelFromXP(user.totalEarnedXP);
            user.lastLoginDate = new Date();

            user.pointsHistory.push({
                amount: 20,
                reason: 'Daily Login Reward',
                sourceType: 'bonus',
                timestamp: new Date()
            });

            await user.save();
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                // Return full user object excluding password
                const userObj = user.toObject();
                delete userObj.password;
                res.json({ token, user: userObj });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Update User (Protected in real app)
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).select('-password'); // Don't return password
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const sendEmail = require('../utils/emailService');
const crypto = require('crypto');

// Get active colleges (all colleges existing in system)
router.get('/colleges', async (req, res) => {
    try {
        const colleges = await User.distinct('college');
        res.json(colleges.filter(Boolean)); // Remove null/undefined
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

        // Hash temporary password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        // Send email
        const message = `Your temporary password for CampusHub is: ${tempPassword}\n\nPlease log in and change your password immediately for security.`;

        await sendEmail({
            email: user.email,
            subject: 'CampusHub Password Reset',
            message
        });

        res.json({ message: 'Temporary password sent to your email' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Create College Admin (Owner only)
router.post('/admin', async (req, res) => {
    const { name, email, password, college } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
            college,
            role: 'admin'
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(201).json({ message: 'College Admin created successfully', user: { id: user.id, name: user.name, email: user.email, college: user.college } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Change Password (Verified)
router.post('/change-password', async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
