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
        const { userId, email, joinedClubs, clubId, status, requestingUserId } = req.query;
        let query = {};

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (!requester) return res.status(404).json({ message: 'Requester not found' });

            if (requester.role !== 'owner' && requester.college) {
                const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
            }
        }

        // Initialize $and to combine all filters
        query.$and = [];

        // 1. Status Filter
        if (status) {
            query.$and.push({ status });
        } else {
            query.$and.push({ status: 'active' });
        }

        // 2. Deadline Filter (Only for active status)
        const isRequestingActive = status === 'active' || !status;
        if (isRequestingActive) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.$and.push({
                $or: [
                    { deadline: { $exists: false } },
                    { deadline: null },
                    { deadline: { $gte: today } }
                ]
            });
        }

        // 3. Admin/Club Filter
        if (clubId) {
            query.$and.push({ clubId });
        }

        // 4. Student Targeting Filter
        if (userId) {
            const clubsArray = joinedClubs ? joinedClubs.split(',') : [];
            query.$and.push({
                $or: [
                    { targetType: 'all' },
                    { targetType: 'club', clubId: { $in: clubsArray } },
                    { targetType: 'specific', targetEmails: email }
                ]
            });
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

        // Check for deadline expiration
        if (task.deadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (task.deadline < today) {
                return res.status(400).json({ message: 'Mission has expired and can no longer be submitted.' });
            }
        }

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

        const task = await Task.findById(submission.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        submission.status = status;
        // Allow awarding more than reward (for bonuses)
        submission.pointsAwarded = pointsAwarded || 0;
        submission.feedback = feedback;
        submission.reviewedBy = reviewedBy;
        submission.reviewedAt = new Date();

        await submission.save();

        if (status === 'approved') {
            // Check for deadline expiration before awarding points
            if (task.deadline) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (task.deadline < today) {
                    return res.status(400).json({ message: 'Cannot approve an expired mission.' });
                }
            }

            // Award User XP (Fixed 25 per mission)
            const user = await User.findById(submission.userId);
            if (user) {
                const xpAward = 25;
                user.points = (user.points || 0) + xpAward;
                user.totalEarnedXP = (user.totalEarnedXP || 0) + xpAward;
                user.weeklyXP = (user.weeklyXP || 0) + xpAward;
                user.level = calculateLevelFromXP(user.totalEarnedXP);

                user.pointsHistory.push({
                    amount: xpAward,
                    reason: `Mission Approved: ${task.title}`,
                    sourceId: task._id,
                    sourceType: 'bonus', // Simple tasks are bonuses
                    timestamp: new Date()
                });

                await user.save();
                // Update submission record with fixed award
                submission.pointsAwarded = xpAward;
                await submission.save();
            }

            // Award Club 25 points (Checking/Approving)
            if (task.clubId) {
                const club = await Club.findById(task.clubId);
                if (club) {
                    club.points = (club.points || 0) + 25;
                    club.monthlyPoints = (club.monthlyPoints || 0) + 25;

                    club.pointsHistory.push({
                        amount: 25,
                        reason: `Reviewed student mission: ${task.title}`,
                        sourceId: task._id,
                        sourceType: 'bonus',
                        timestamp: new Date()
                    });

                    await club.save();
                }
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
        const taskData = { ...req.body };
        if (taskData.college) taskData.college = taskData.college.trim();

        // Validate deadline is not in the past
        if (taskData.deadline) {
            const deadlineDate = new Date(taskData.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (deadlineDate < today) {
                return res.status(400).json({ message: 'Cannot deploy a mission with a past deadline.' });
            }
        }

        // If college not provided but clubId exists, fetch college from club
        if (!taskData.college && taskData.clubId) {
            const club = await Club.findById(taskData.clubId);
            if (club) {
                taskData.college = club.college ? club.college.trim() : null;
            }
        }

        const task = new Task({ ...taskData, points: 25 }); // Strictly 25 XP
        await task.save();

        // REWARD DELAYED: Club coordination points are no longer awarded at creation.
        // Rule: Only award rewards during verification/completion.

        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a task (Revoke Points)
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // ❌ REVOKE POINTS ON DELETION/DEACTIVATION
        // Note: Creation points (25) are no longer awarded, so no deduction here.

        // 2. Revoke Student XP and Club "Checking" points for all approved submissions
        const approvedSubmissions = await TaskSubmission.find({ taskId: task._id, status: 'approved' });
        for (const sub of approvedSubmissions) {
            // Revoke Student XP (25)
            const student = await User.findById(sub.userId);
            if (student) {
                student.points = Math.max(0, (student.points || 0) - 25);
                student.totalEarnedXP = Math.max(0, (student.totalEarnedXP || 0) - 25);
                student.level = calculateLevelFromXP(student.totalEarnedXP);

                student.pointsHistory.push({
                    amount: -25,
                    reason: `Revoked: Mission "${task.title}" was deleted`,
                    sourceId: task._id,
                    sourceType: 'bonus',
                    timestamp: new Date()
                });

                await student.save();
            }
            // Revoke Club "Checking" points (25)
            if (task.clubId) {
                const club = await Club.findById(task.clubId);
                if (club) {
                    club.points = Math.max(0, club.points - 25);
                    club.monthlyPoints = Math.max(0, club.monthlyPoints - 25);

                    club.pointsHistory.push({
                        amount: -25,
                        reason: `Revoked: Mission "${task.title}" (Evaluation points)`,
                        sourceId: task._id,
                        sourceType: 'bonus',
                        timestamp: new Date()
                    });

                    await club.save();
                }
            }
        }

        task.status = 'inactive'; // Soft delete
        await task.save();

        res.json({ message: 'Task deactivated and all associated points/XP have been revoked.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
