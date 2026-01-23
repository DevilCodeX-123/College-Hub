const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TaskSubmission = require('../models/TaskSubmission');
const User = require('../models/User');
const { calculateLevelFromXP } = require('../utils/leveling');

const Club = require('../models/Club');

// GET all tasks (filtered by user access and status)
router.get('/', async (req, res) => {
    try {
        const { userId, email, joinedClubs, status, requestingUserId } = req.query;
        let query = {};

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (!requester) return res.status(404).json({ message: 'Requester not found' });
            // Note: Tasks are primarily filtered by joinedClubs and targetType below.
            // Here we just ensure requestingUserId is a valid user.
        }

        if (status) {
            query.status = status;
        } else {
            query.status = 'active';
        }

        // If filtering provided, return only relevant tasks
        if (userId) {
            const clubsArray = joinedClubs ? joinedClubs.split(',') : [];
            query.$or = [
                { targetType: 'all' },
                { targetType: 'club', clubId: { $in: clubsArray } },
                { targetType: 'specific', targetEmails: email }
            ];
        }

        const tasks = await Task.find(query);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// SUBMIT a task (Unchanged but ensuring consistency)
router.post('/submit', async (req, res) => {
    try {
        const { taskId, userId, userName, taskTitle, submissionLink } = req.body;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.category === 'daily') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const alreadySubmitted = await TaskSubmission.findOne({
                taskId,
                userId,
                createdAt: { $gte: today }
            });
            if (alreadySubmitted) {
                return res.status(400).json({ message: 'Already submitted this task today' });
            }
        }

        const submission = new TaskSubmission({
            taskId,
            userId,
            userName,
            taskTitle,
            submissionLink
        });

        await submission.save();
        res.status(201).json(submission);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all submissions (Optionally filter by club)
router.get('/submissions', async (req, res) => {
    try {
        const { clubId, taskId } = req.query;
        let query = {};
        if (taskId) {
            query.taskId = taskId;
        } else if (clubId) {
            // Find tasks for this club first
            const tasks = await Task.find({ clubId });
            const taskIds = tasks.map(t => t._id);
            query.taskId = { $in: taskIds };
        }

        const submissions = await TaskSubmission.find(query).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REVIEW a submission (Award 5 points to club on approval)
router.post('/submissions/:id/review', async (req, res) => {
    try {
        const { status, pointsAwarded, feedback, reviewedBy } = req.body;
        const submission = await TaskSubmission.findById(req.params.id);

        if (!submission) return res.status(404).json({ message: 'Submission not found' });
        if (submission.status !== 'pending') return res.status(400).json({ message: 'Submission already reviewed' });

        submission.status = status;
        submission.pointsAwarded = pointsAwarded || 0;
        submission.feedback = feedback;
        submission.reviewedBy = reviewedBy;
        submission.reviewedAt = new Date();

        await submission.save();

        if (status === 'approved') {
            // Award User XP
            if (pointsAwarded > 0) {
                const user = await User.findById(submission.userId);
                if (user) {
                    user.points = (user.points || 0) + pointsAwarded;
                    user.totalEarnedXP = (user.totalEarnedXP || 0) + pointsAwarded;
                    user.weeklyXP = (user.weeklyXP || 0) + pointsAwarded;
                    user.level = calculateLevelFromXP(user.totalEarnedXP);
                    await user.save();
                }
            }

            // Award Club 5 points
            const task = await Task.findById(submission.taskId);
            if (task && task.clubId) {
                await Club.findByIdAndUpdate(task.clubId, {
                    $inc: {
                        points: 5,
                        monthlyPoints: 5
                    }
                });
            }
        }

        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a task (Award 20 points to club)
router.post('/', async (req, res) => {
    try {
        const taskData = req.body;
        const task = new Task(taskData);
        await task.save();

        // Award Club 20 points if it's a club-related task created for a club
        if (task.clubId && (task.category === 'club' || task.category === 'daily')) {
            await Club.findByIdAndUpdate(task.clubId, { $inc: { points: 20, monthlyPoints: 20 } });
        }

        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a task (Set status to inactive)
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.status = 'inactive';
        await task.save();

        res.json({ message: 'Task marked as inactive' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
