const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { calculateLevelFromXP } = require('../utils/leveling');
const User = require('../models/User');

const Notification = require('../models/Notification');
const Club = require('../models/Club');
const crypto = require('crypto');

router.get('/', async (req, res) => {
    try {
        const { college, clubId, userId, requestingUserId } = req.query;
        let query = {};

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                // Force filter to requester's college bubble
                if (requester.college) {
                    const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
                }
            }
        }

        if (college && (!query.college || query.college === college)) {
            const cleanCollege = college.trim();
            const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
        }
        if (clubId) {
            query.clubId = clubId;
        }
        if (userId) {
            query.team = userId;
        }

        // Return projects, sorting by newest first
        const projects = await Project.find(query).sort({ createdAt: -1 }).populate('team', 'name email');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const project = await Project.findById(req.params.id).populate('team', 'name email');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                const userCollege = (requester.college || '').trim().toLowerCase();
                const projectCollege = (project.college || '').trim().toLowerCase();
                if (userCollege !== projectCollege) {
                    return res.status(403).json({ message: 'Access Denied: Project is in a different college bubble' });
                }
            }
        }

        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a project (starts as PENDING proposal)
router.post('/', async (req, res) => {
    try {
        const { title, description, type, memberLimit, problemStatement, idea, requestedBy, clubId, clubName } = req.body;

        // Fetch the club first to get the college and coordinator ID
        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        const project = new Project({
            title,
            description,
            type,
            memberLimit,
            problemStatement,
            idea,
            requestedBy,
            clubId,
            clubName,
            college: club.college ? club.college.trim() : null,
            status: 'pending',
            team: [requestedBy] // Creator is first member
        });

        const newProject = await project.save();

        // Notify Coordinator of the selected club
        if (club.coordinatorId) {
            const notification = new Notification({
                recipient: club.coordinatorId,
                sender: requestedBy,
                title: 'New Project Proposal',
                message: `User has proposed a new project: "${title}". Please review and approve.`,
                type: 'info'
            });
            await notification.save();
        }

        res.status(201).json(newProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// APPROVE a project (Admin/Coordinator Only)
router.post('/:id/approve', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Generate a 6-character unique join code
        const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        project.status = 'in_progress';
        project.joinCode = joinCode;
        await project.save();

        // Award 10 club points to the club
        if (project.clubId) {
            const club = await Club.findById(project.clubId);
            if (club) {
                club.points = (club.points || 0) + 10;
                club.monthlyPoints = (club.monthlyPoints || 0) + 10;
                await club.save();
            }
        }

        // Notify the creator
        const notification = new Notification({
            recipient: project.requestedBy,
            sender: project.requestedBy, // Fallback
            title: 'Project Approved!',
            message: `Your project "${project.title}" has been approved. Your Join Code is: ${joinCode}`,
            type: 'success'
        });
        await notification.save();

        res.json({ message: 'Project approved', project: await Project.findById(project._id).populate('team', 'name email') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REJECT a project (Admin/Coordinator Only)
router.post('/:id/reject', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.status = 'rejected';
        await project.save();

        // Notify the creator
        const notification = new Notification({
            recipient: project.requestedBy,
            sender: project.requestedBy, // Fallback
            title: 'Project Proposal Update',
            message: `Your project "${project.title}" proposal has been rejected by the club administration.`,
            type: 'alert'
        });
        await notification.save();

        res.json({ message: 'Project rejected', project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// JOIN a project BY CODE
router.post('/join-by-code', async (req, res) => {
    try {
        const { userId, joinCode } = req.body;
        const project = await Project.findOne({ joinCode: joinCode.toUpperCase() });
        const user = await User.findById(userId);

        if (!project) return res.status(404).json({ message: 'Invalid Join Code' });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (project.team.length >= project.memberLimit) {
            return res.status(400).json({ message: 'Project team is already full' });
        }

        if (project.team.includes(userId)) {
            return res.status(400).json({ message: 'You are already in this team' });
        }

        project.team.push(userId);
        await project.save();

        // Add to user activity
        user.activity.push({
            type: 'project',
            refId: project._id,
            title: project.title,
            status: 'joined team',
            timestamp: new Date()
        });

        // Award XP
        const xpEarned = project.xpReward || 200;
        user.points += xpEarned;
        user.totalEarnedXP += xpEarned;
        user.weeklyXP = (user.weeklyXP || 0) + xpEarned;
        user.level = calculateLevelFromXP(user.totalEarnedXP);

        await user.save();

        res.json({ message: 'Successfully joined project team', user, project: await Project.findById(project._id).populate('team', 'name email') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// LEGACY JOIN (Keep for compatibility if needed, but updated to use leveling)
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const project = await Project.findById(req.params.id);
        const user = await User.findById(userId);

        if (!project || !user) return res.status(404).json({ message: 'Project or User not found' });

        // Add to project team if not already there
        if (!project.team.includes(userId)) {
            if (project.team.length >= (project.memberLimit || 4)) {
                return res.status(400).json({ message: 'Team full' });
            }
            project.team.push(userId);
            await project.save();

            // Add to user activity
            user.activity.push({
                type: 'project',
                refId: project._id,
                title: project.title,
                status: 'joined team',
                timestamp: new Date()
            });

            // Award XP
            const xpEarned = project.xpReward || 200;
            user.points += xpEarned;
            user.totalEarnedXP += xpEarned;
            user.weeklyXP = (user.weeklyXP || 0) + xpEarned;
            user.level = calculateLevelFromXP(user.totalEarnedXP);

            await user.save();
        }

        res.json({ message: 'Joined project team', user, project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MARK PROJECT AS COMPLETED
router.post('/:id/complete', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.status = 'completed';
        project.progress = 100;
        await project.save();

        // 1. Notify all team members
        const teamNotifications = project.team.map(memberId => ({
            recipient: memberId,
            sender: project.requestedBy,
            title: 'Project Completed! 🎉',
            message: `Congratulations! The project "${project.title}" has been marked as completed. Well done team!`,
            type: 'success'
        }));
        await Notification.insertMany(teamNotifications);

        // 2. Notify the Club Coordinator
        const club = await Club.findById(project.clubId);
        if (club && club.coordinatorId) {
            const coordNotification = new Notification({
                recipient: club.coordinatorId,
                sender: project.requestedBy,
                title: 'Project Finished',
                message: `Project "${project.title}" in your club has been completed by the team.`,
                type: 'info'
            });
            await coordNotification.save();
        }

        res.json({ message: 'Project marked as completed', project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// EXIT PROJECT
router.post('/:id/exit', async (req, res) => {
    try {
        const { userId } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.team.includes(userId)) return res.status(400).json({ message: 'You are not in this project team' });

        // Remove user from team
        project.team = project.team.filter(id => id !== userId);

        const isLeader = userId === project.requestedBy;

        // If user was the leader (requestedBy)
        if (isLeader) {
            if (project.team.length > 0) {
                // Assign new leader (next member who added - which is now the first in the array)
                const newLeaderId = project.team[0];
                project.requestedBy = newLeaderId;
                await project.save();

                // Notify new leader
                const notification = new Notification({
                    recipient: newLeaderId,
                    sender: 'System', // System notification
                    title: 'You are now the Project Leader',
                    message: `The previous leader left the project "${project.title}". You have been assigned as the new leader.`,
                    type: 'info'
                });
                await notification.save();

                return res.json({ message: 'You left the project. Leadership transferred.', project });
            } else {
                // Last member left - Delete project
                await Project.findByIdAndDelete(req.params.id);

                // Notify Club Coordinator / Core Team
                if (project.clubId) {
                    const club = await Club.findById(project.clubId);
                    if (club && club.coordinatorId) {
                        const notification = new Notification({
                            recipient: club.coordinatorId,
                            sender: 'System',
                            title: 'Project Terminated',
                            message: `The project "${project.title}" was deleted because the last member left without completing it.`,
                            type: 'alert'
                        });
                        await notification.save();
                    }
                }

                return res.json({ message: 'Project deleted as all members left.', deleted: true });
            }
        } else {
            // Normal member exit
            await project.save();
            return res.json({ message: 'You have left the project.', project });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// NOTIFY TEAM
router.post('/:id/notify', async (req, res) => {
    try {
        const { title, message, senderId, type } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const notifications = project.team
            .filter(memberId => memberId.toString() !== senderId.toString())
            .map(memberId => ({
                recipient: memberId.toString(),
                sender: senderId,
                title: title || `Project Update: ${project.title}`,
                message,
                type: type || 'info',
                timestamp: new Date()
            }));

        await Notification.insertMany(notifications);
        res.json({ message: 'Notifications sent to team' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MARK PROJECT AS ON-HOLD (TEMPORARILY STOP)
router.post('/:id/on-hold', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.status = 'on_hold';
        await project.save();

        // Notify team members
        const teamNotifications = project.team.map(memberId => ({
            recipient: memberId,
            sender: project.requestedBy,
            title: 'Project On Hold ⏸️',
            message: `The project "${project.title}" has been temporarily put on hold by the club administration.`,
            type: 'alert'
        }));
        await Notification.insertMany(teamNotifications);

        res.json({ message: 'Project put on hold', project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// RESUME PROJECT
router.post('/:id/resume', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.status = 'in_progress';
        await project.save();

        // Notify team members
        const teamNotifications = project.team.map(memberId => ({
            recipient: memberId,
            sender: project.requestedBy,
            title: 'Project Resumed! ▶️',
            message: `The project "${project.title}" has been resumed. You can continue working on it.`,
            type: 'success'
        }));
        await Notification.insertMany(teamNotifications);

        res.json({ message: 'Project resumed', project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PERMANENTLY DELETE PROJECT
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const title = project.title;
        const clubId = project.clubId;

        await Project.findByIdAndDelete(req.params.id);

        // Notify Club Coordinator / Core Team
        if (clubId) {
            const club = await Club.findById(clubId);
            if (club && club.coordinatorId) {
                const notification = new Notification({
                    recipient: club.coordinatorId,
                    sender: 'System',
                    title: 'Project Permanently Deleted',
                    message: `The project "${title}" has been permanently deleted from the club records.`,
                    type: 'alert'
                });
                await notification.save();
            }
        }

        res.json({ message: 'Project permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE PROJECT PROGRESS (Leader Only)
router.patch('/:id/progress', async (req, res) => {
    try {
        const { progress, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Check if requester is the leader
        if (project.requestedBy !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can update progress' });
        }

        project.progress = progress;
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADD TIME GOAL (Leader Only)
router.post('/:id/goals', async (req, res) => {
    try {
        const { title, deadline, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can set goals' });
        }

        project.timeGoals.push({
            title,
            deadline,
            assigneeId: req.body.assigneeId,
            assigneeName: req.body.assigneeName
        });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE GOAL STATUS (Leader Only)
router.patch('/:id/goals/:goalId', async (req, res) => {
    try {
        const { status, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can update goals' });
        }

        const goal = project.timeGoals.id(req.params.goalId);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        goal.status = status;
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// SUBMIT GOAL (Assignee Only)
router.post('/:id/goals/:goalId/submit', async (req, res) => {
    try {
        const { submissionLink, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const goal = project.timeGoals.id(req.params.goalId);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (goal.assigneeId !== requestingUserId) {
            return res.status(403).json({ message: 'Only the assigned user can submit this goal' });
        }

        goal.submissionLink = submissionLink;
        goal.status = 'completed';
        goal.completedAt = new Date();

        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE TIME GOAL (Leader Only)
router.delete('/:id/goals/:goalId', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can remove goals' });
        }

        project.timeGoals.pull({ _id: req.params.goalId });
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADD RESOURCE LINK (Any Team Member)
router.post('/:id/resources', async (req, res) => {
    try {
        const { title, description, url, addedBy, addedByName } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (!project.team.includes(addedBy)) {
            return res.status(403).json({ message: 'Only team members can add resources' });
        }

        project.resources.push({ title, description, url, addedBy, addedByName });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE RESOURCE LINK (AddedBy or Leader)
router.delete('/:id/resources/:resourceId', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const resource = project.resources.id(req.params.resourceId);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        if (resource.addedBy.toString() !== requestingUserId && project.requestedBy !== requestingUserId) {
            return res.status(403).json({ message: 'Not authorized to remove this resource' });
        }

        project.resources.pull({ _id: req.params.resourceId });
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
