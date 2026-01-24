const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Poll = require('../models/Poll');
const Club = require('../models/Club');
const { calculateLevelFromXP } = require('../utils/leveling');

// GET all events
router.get('/', async (req, res) => {
    try {
        const { college } = req.query;
        let query = {};
        if (college) {
            const cleanCollege = college.trim();
            const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
        }
        const events = await Event.find(query).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE an event
router.post('/', async (req, res) => {
    if (req.body.college) req.body.college = req.body.college.trim();
    const event = new Event(req.body);
    try {
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE an event
router.put('/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// REGISTER for an event
router.post('/:id/register', async (req, res) => {
    try {
        const { userId, name, email, program, comments } = req.body;
        const event = await Event.findById(req.params.id);
        const user = await User.findById(userId);

        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.stopRegistration) {
            return res.status(400).json({ message: 'Registration for this event is closed' });
        }

        if (event.isCompleted) {
            return res.status(400).json({ message: 'This event has already been completed' });
        }

        // Check if already registered
        const existing = event.registrations.find(r => r.userId === userId);
        if (existing) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Add to registrations
        event.registrations.push({ userId, name, email, program, comments });
        await event.save();

        // XP will be awarded upon event attendance/completion

        res.json({ message: 'Registration successful', event });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ATTEND/JOIN (Legacy/Simple Check-in)
router.post('/:id/attend', async (req, res) => {
    try {
        const { userId } = req.body;
        const event = await Event.findById(req.params.id);
        const user = await User.findById(userId);

        if (!event || !user) return res.status(404).json({ message: 'Event or User not found' });

        // Award XP
        const xpEarned = event.xpReward || 150;
        user.points += xpEarned;
        user.totalEarnedXP += xpEarned;
        user.weeklyXP = (user.weeklyXP || 0) + xpEarned;
        user.level = calculateLevelFromXP(user.totalEarnedXP);

        await user.save();
        res.json({ message: 'Marked as attending and XP awarded', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// COMPLETE an event
router.post('/:id/complete', async (req, res) => {
    try {
        const { reportData, coordinatorId } = req.body;
        console.log(`Completing event ID: ${req.params.id}`);

        const event = await Event.findById(req.params.id);
        if (!event) {
            console.error('Event not found during completion');
            return res.status(404).json({ message: 'Event not found' });
        }

        const club = await Club.findById(event.clubId);
        if (!club) {
            console.error('Club not found for this event');
        }
        if (event.isCompleted) return res.status(400).json({ message: 'Event already completed' });

        // Mark event as completed
        event.isCompleted = true;
        event.stopRegistration = true;

        // Sync modified fields from reportData if provided
        if (reportData) {
            if (reportData.title) event.title = reportData.title;
            if (reportData.date) event.date = reportData.date;
            if (reportData.description) event.description = reportData.description;
            if (reportData.location) event.location = reportData.location;
            if (reportData.type) event.type = reportData.type;
            if (reportData.coverImage) event.coverImage = reportData.coverImage;
        }

        await event.save();

        // Calculate and award registration points to club (5 pts per reg)
        const regPoints = (event.registrations?.length || 0) * 5;
        if (club) {
            club.points = (club.points || 0) + regPoints;
            club.monthlyPoints = (club.monthlyPoints || 0) + regPoints;

            // Add to club history
            const historyItem = {
                ...reportData,
                type: 'event',
                date: event.date,
                title: event.title,
                _id: event._id.toString()
            };
            club.history.push(historyItem);

            await club.save();
        }

        // Create a Rating Poll for the event
        const ratingPoll = new Poll({
            question: `How would you rate the event: ${event.title}?`,
            options: [
                { text: '1 Star ⭐', votes: 0 },
                { text: '2 Stars ⭐⭐', votes: 0 },
                { text: '3 Stars ⭐⭐⭐', votes: 0 },
                { text: '4 Stars ⭐⭐⭐⭐', votes: 0 },
                { text: '5 Stars ⭐⭐⭐⭐⭐', votes: 0 }
            ],
            createdBy: coordinatorId,
            targetRoles: ['all'],
            college: club?.college || null,
            clubId: event.clubId,
            eventId: event._id,
            isRatingPoll: true
        });
        await ratingPoll.save();

        res.json({
            message: 'Event completed, points awarded, and rating poll generated.',
            event,
            awardedPoints: regPoints
        });
    } catch (err) {
        console.error('Error completing event:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
