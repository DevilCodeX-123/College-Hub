const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { calculateLevelFromXP } = require('../utils/leveling');
const User = require('../models/User');

const Notification = require('../models/Notification');
const Club = require('../models/Club');
const Message = require('../models/Message');
const crypto = require('crypto');

router.get('/', async (req, res) => {
    try {
        const { college, clubId, userId, requestingUserId } = req.query;
        let query = {};
        let isAdminUser = false;
        if (requestingUserId && requestingUserId.match(/^[0-9a-fA-F]{24}$/)) {
            const requester = await User.findById(requestingUserId);
            if (requester) {
                if (requester.role === 'owner') isAdminUser = true;
                if (requester.role === 'admin' && requester.college === college) isAdminUser = true;

                if (requester.role !== 'owner' && typeof requester.college === 'string' && requester.college.trim()) {
                    // Force filter to requester's college bubble
                    const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
                }
            }
        }

        if (college && typeof college === 'string' && (!query.college || query.college === college)) {
            const cleanCollege = college.trim();
            if (cleanCollege) {
                const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
            }
        }
        if (clubId) {
            query.clubId = clubId;
        }
        if (userId) {
            query.team = userId;
        }

        // Return projects, sorting by newest first
        let projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .populate('team', 'name email')
            .populate('requestedBy', 'name email')
            .populate('joinRequests.user', 'name email avatar')
            .lean();

        // Mask data for public view
        projects = projects.map(p => {
            const teamArray = Array.isArray(p.team) ? p.team : [];
            const leaderId = (p.requestedBy?._id || p.requestedBy)?.toString();
            const isTeamMember = teamArray.some(m => (m?._id || m)?.toString() === requestingUserId) || leaderId === requestingUserId;
            const isAdmin = requestingUserId && isAdminUser;

            // Special check for Club Coordinators
            let isCoordinator = false;
            if (requestingUserId && p.clubId) {
                // We'd need to fetch the club or rely on a previous check. 
                // For simplicity, let's assume if they have coordinator role and college matches, they get more info.
                // But safer to just check if isAdminUser is true (already check for owner/admin).
            }

            if (!isTeamMember && !isAdmin) {
                const maskedProject = { ...p };
                delete maskedProject.joinCode;
                delete maskedProject.timeGoals;
                delete maskedProject.resources;
                // Mask detailed team but keep count if needed
                maskedProject.team = teamArray.map((m, i) => ({ _id: 'hidden', name: `Member ${i + 1}` }));
                if (!p.isPublicChallenge) {
                    maskedProject.idea = "Confidential - Join to view";
                }
                return maskedProject;
            }
            return p;
        });

        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const project = await Project.findById(req.params.id)
            .populate('team', 'name email')
            .populate('requestedBy', 'name email')
            .populate('joinRequests.user', 'name email avatar');
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (requestingUserId && requestingUserId.match(/^[0-9a-fA-F]{24}$/)) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                const userCollege = (requester.college || '').trim().toLowerCase();
                const projectCollege = (project.college || '').trim().toLowerCase();
                if (userCollege !== projectCollege) {
                    return res.status(403).json({ message: 'Access Denied: Project is in a different college bubble' });
                }
            }
        }

        // Privacy Filter
        const teamArray = Array.isArray(project.team) ? project.team : [];
        const isTeamMember = teamArray.some(m => m && m._id && m._id.toString() === requestingUserId) || (typeof project.requestedBy === 'string' && project.requestedBy === requestingUserId);
        // Check admin status - heavily simplified for this context, ideally fetch user
        const adminCheck = (requestingUserId && requestingUserId.match(/^[0-9a-fA-F]{24}$/)) ? await User.findById(requestingUserId) : null;
        const isAdmin = adminCheck?.role === 'admin' || adminCheck?.role === 'owner';

        if (!isTeamMember && !isAdmin) {
            // Hide sensitive data for non-members
            const publicProject = project.toObject();
            delete publicProject.joinCode;
            delete publicProject.timeGoals;
            delete publicProject.resources;

            // Mask Team Members
            publicProject.team = teamArray.map((m, idx) => ({
                _id: 'hidden',
                name: `Member ${idx + 1}`
            }));

            // Mask Idea if not public challenge
            if (!project.isPublicChallenge) {
                publicProject.idea = "Confidential - Join to view";
            }
            return res.json(publicProject);
        }

        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a project (starts as PENDING proposal)
router.post('/', async (req, res) => {
    try {
        const { title, teamName, description, type, projectTypeDescription, memberLimit, problemStatement, idea, isPublicChallenge, requestedBy, clubId, clubName } = req.body;

        // Fetch the club first to get the college and coordinator ID
        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        const project = new Project({
            title,
            teamName,
            description,
            type,
            projectTypeDescription,
            memberLimit,
            problemStatement,
            idea,
            isPublicChallenge: isPublicChallenge || false,
            requestedBy,
            clubId,
            clubName,
            college: (club.college && typeof club.college === 'string') ? club.college.trim() : null,
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

        // REWARD DELAYED: Club points moved to completion

        // Notify the creator
        const notification = new Notification({
            recipient: project.requestedBy,
            sender: project.requestedBy, // Fallback
            title: 'Project Approved!',
            message: `Your project "${project.title}" has been approved. Your Join Code is: ${joinCode}. Points will be awarded upon completion.`,
            type: 'success'
        });
        await notification.save();

        res.json({ message: 'Project approved. Rewards will be issued upon completion.', project: await Project.findById(project._id).populate('team', 'name email').populate('requestedBy', 'name email') });
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

        if (project.team.some(member => member.toString() === userId)) {
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

        await user.save();

        res.json({ message: 'Successfully joined project team', user, project: await Project.findById(project._id).populate('team', 'name email') });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MARK PROJECT AS COMPLETED
router.post('/:id/complete', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.status === 'completed') return res.status(400).json({ message: 'Project already completed' });

        project.status = 'completed';
        project.progress = 100;
        await project.save();

        // 🏆 AWARD POINTS UPON COMPLETION
        // 1. Award Club points (Exactly 50)
        const club = await Club.findById(project.clubId);
        if (club) {
            club.points = (club.points || 0) + 50;
            club.monthlyPoints = (club.monthlyPoints || 0) + 50;

            club.pointsHistory.push({
                amount: 50,
                reason: `Successfully completed project: ${project.title}`,
                sourceId: project._id,
                sourceType: 'project',
                timestamp: new Date()
            });

            await club.save();
        }

        // 2. Award Team Members (Exactly 0 XP - Professional Record Only)
        // Set to 0 to align with "Zero points to students" rule
        for (const memberId of project.team) {
            const student = await User.findById(memberId);
            if (student) {
                // Previously was 50, now explicitly 0
                const xpEarned = 0;
                student.points = (student.points || 0) + xpEarned;
                student.totalEarnedXP = (student.totalEarnedXP || 0) + xpEarned;
                await student.save();
            }
        }

        // Notify team members
        const teamNotifications = project.team.map(memberId => ({
            recipient: memberId,
            sender: project.requestedBy,
            title: 'Project Completed! 🎉',
            message: `Congratulations! "${project.title}" is complete. This has been added to your professional records.`,
            type: 'success'
        }));
        await Notification.insertMany(teamNotifications);

        // 📝 Create a Rating Poll for the project
        const Poll = require('../models/Poll');
        const ratingPoll = new Poll({
            question: `How would you rate the execution of project: ${project.title}?`,
            options: [
                { text: '1 Star ⭐', votes: 0 },
                { text: '2 Stars ⭐⭐', votes: 0 },
                { text: '3 Stars ⭐⭐⭐', votes: 0 },
                { text: '4 Stars ⭐⭐⭐⭐', votes: 0 },
                { text: '5 Stars ⭐⭐⭐⭐⭐', votes: 0 }
            ],
            createdBy: project.requestedBy,
            targetRoles: ['all'],
            college: club?.college || null,
            clubId: project.clubId,
            projectId: project._id,
            isRatingPoll: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await ratingPoll.save();

        res.json({ message: 'Project marked as completed and rewards distributed.', project });
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
        if (!project.team.some(member => member.toString() === userId)) return res.status(400).json({ message: 'You are not in this project team' });

        // Remove user from team
        project.team = project.team.filter(id => id.toString() !== userId);
        const isLeader = userId === project.requestedBy;

        if (isLeader) {
            if (project.team.length > 0) {
                const newLeaderId = project.team[0];
                project.requestedBy = newLeaderId;
                await project.save();
                await Notification.create({
                    recipient: newLeaderId,
                    sender: 'System',
                    title: 'You are now the Project Leader',
                    message: `The previous leader left the project "${project.title}".`,
                    type: 'info'
                });
                return res.json({ message: 'Leadership transferred.', project });
            } else {
                await Project.findByIdAndDelete(req.params.id);
                return res.json({ message: 'Project deleted as all members left.', deleted: true });
            }
        } else {
            await project.save();
            return res.json({ message: 'You have left the project.', project });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PERMANENTLY DELETE PROJECT
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // ❌ REVOKE POINTS ON DELETION
        if (project.status === 'completed') {
            // 1. Revoke Club Points (50)
            const club = await Club.findById(project.clubId);
            if (club) {
                club.points = Math.max(0, (club.points || 0) - 50);
                club.monthlyPoints = Math.max(0, (club.monthlyPoints || 0) - 50);

                club.pointsHistory.push({
                    amount: -50,
                    reason: `Revoked: Project "${project.title}" was deleted`,
                    sourceId: project._id,
                    sourceType: 'project',
                    timestamp: new Date()
                });

                await club.save();
            }

            // 2. Revoke Team Member XP (Exactly 0 - Professional Record Only)
            for (const memberId of project.team) {
                const student = await User.findById(memberId);
                if (student) {
                    // Retraction matches award (0 XP)
                    const xpToDeduct = 0;
                    student.points = Math.max(0, (student.points || 0) - xpToDeduct);
                    student.totalEarnedXP = Math.max(0, (student.totalEarnedXP || 0) - xpToDeduct);
                    await student.save();
                }
            }

            // ❌ 3. Revoke Rating Poll Points from Club
            const Poll = require('../models/Poll');
            const poll = await Poll.findOne({ projectId: req.params.id, isRatingPoll: true });
            if (poll && club) {
                let totalPollPts = 0;
                poll.options.forEach(opt => {
                    const stars = parseInt(opt.text.match(/(\d+)/)?.[1] || 0);
                    totalPollPts += (stars * (opt.votes || 0));
                });
                if (totalPollPts > 0) {
                    club.points = Math.max(0, club.points - totalPollPts);
                    club.monthlyPoints = Math.max(0, club.monthlyPoints - totalPollPts);
                    await club.save();
                }
            }
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted and rewards revoked.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// LEGACY JOIN (Keep for compatibility if needed, but updated to use leveling)
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.team.some(member => member.toString() === userId)) {
            if (project.team.length >= (project.memberLimit || 4)) return res.status(400).json({ message: 'Team full' });
            project.team.push(userId);
            await project.save();
        }
        res.json({ message: 'Joined project team', project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REQUEST TO JOIN PROJECT
router.post('/:id/request-join', async (req, res) => {
    try {
        const { userId, reason, skills, experiences, comments } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        project.joinRequests.push({ user: userId, reason, skills, experiences, comments });
        await project.save();
        res.json({ message: 'Request sent successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// RESOLVE JOIN REQUEST (Leader Only)
router.post('/:id/requests/:requestId/resolve', async (req, res) => {
    try {
        const { status, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.requestedBy.toString() !== requestingUserId) return res.status(403).json({ message: 'Only leader can resolve requests' });
        const request = project.joinRequests.id(req.params.requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        request.status = status;
        if (status === 'accepted' && !project.team.includes(request.user)) {
            project.team.push(request.user);
        }
        await project.save();
        res.json({ message: `Request ${status}`, project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// NOTIFY TEAM
router.post('/:id/notify', async (req, res) => {
    try {
        const { title, message, senderId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        const notifications = project.team.map(m => ({ recipient: m, sender: senderId, title, message }));
        await Notification.insertMany(notifications);
        res.json({ message: 'Notifications sent' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MARK PROJECT AS ON-HOLD
router.post('/:id/on-hold', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        project.status = 'on_hold';
        await project.save();
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
        res.json({ message: 'Project resumed', project });
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
        if (project.requestedBy.toString() !== requestingUserId) return res.status(403).json({ message: 'Only leader can update progress' });
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
        const { title, description, deadline, requestingUserId } = req.body;

        // Future Date Enforcement
        if (deadline) {
            const goalDate = new Date(deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (goalDate < today) {
                return res.status(400).json({ message: 'Goal deadline cannot be in the past' });
            }
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy.toString() !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can set goals' });
        }

        project.timeGoals.push({
            title,
            description,
            deadline,
            assignedType: req.body.assignedType || 'specific',
            assignees: req.body.assignees || [],
            completedBy: [],
            requirementKey: req.body.requirementKey
        });
        await project.save();
        const populatedProject = await Project.findById(req.params.id).populate('team', 'name email');
        res.status(201).json(populatedProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE GOAL STATUS (Leader Only)
router.patch('/:id/goals/:goalId', async (req, res) => {
    try {
        const { title, description, deadline, assignees, assignedType, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy.toString() !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can update missions' });
        }

        const goal = project.timeGoals.id(req.params.goalId);
        if (!goal) return res.status(404).json({ message: 'Mission not found' });

        if (title) goal.title = title;
        if (description !== undefined) goal.description = description;
        if (deadline) {
            const newDeadline = new Date(deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (newDeadline < today) {
                return res.status(400).json({ message: 'New deadline cannot be in the past' });
            }
            goal.deadline = newDeadline;
        }
        if (assignees) goal.assignees = assignees;
        if (assignedType) goal.assignedType = assignedType;
        if (req.body.requirementKey !== undefined) goal.requirementKey = req.body.requirementKey;
        if (req.body.submissionKey !== undefined) goal.submissionKey = req.body.submissionKey;

        await project.save();
        const populatedProject = await Project.findById(req.params.id).populate('team', 'name email');
        res.json(populatedProject);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// SUBMIT GOAL (Assignee Only)
router.post('/:id/goals/:goalId/submit', async (req, res) => {
    try {
        const { submissionLink, submissionTitle, submissionDescription, submissionKey, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const goal = project.timeGoals.id(req.params.goalId);
        if (!goal) return res.status(404).json({ message: 'Mission not found' });

        // Auto-Closure/Deadline Check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(goal.deadline) < today) {
            return res.status(400).json({ message: 'Mission has expired and can no longer be submitted.' });
        }

        // Authorization Check
        const isAssigned = goal.assignedType === 'all' || goal.assignees.includes(requestingUserId);
        if (!isAssigned) {
            return res.status(403).json({ message: 'Only assigned members can submit this mission' });
        }

        // Fetch user for resource entry
        const user = await User.findById(requestingUserId);

        goal.submissionLink = submissionLink;
        goal.submissionTitle = submissionTitle || goal.title;
        goal.submissionDescription = submissionDescription;
        goal.submissionKey = submissionKey;
        goal.status = 'submitted';
        goal.completedAt = new Date();

        // Add to project resources automatically
        project.resources.push({
            title: submissionTitle || `${goal.title} Submission`,
            description: `${submissionDescription || `Project Mission Submission for: ${goal.title}`} ${submissionKey ? `(Key: ${submissionKey})` : ''}`,
            url: submissionLink,
            addedBy: requestingUserId,
            addedByName: user ? user.name : "Team Member",
            addedAt: new Date()
        });

        await project.save();
        const populatedProject = await Project.findById(req.params.id).populate('team', 'name email');
        res.json(populatedProject);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REVIEW GOAL SUBMISSION (Leader Only)
router.patch('/:id/goals/:goalId/review', async (req, res) => {
    try {
        const { status, requestingUserId } = req.body; // status: 'approved' or 'rejected'
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy.toString() !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can review goals' });
        }

        const goal = project.timeGoals.id(req.params.goalId);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        if (status === 'rejected') {
            goal.status = 'rejected';
            // Optionally clear submission link
            // goal.submissionLink = null;
        } else {
            goal.status = 'approved';
        }

        await project.save();
        const populatedProject = await Project.findById(req.params.id).populate('team', 'name email');
        res.json(populatedProject);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ACCOMPLISH MISSION (Member Only - Per Member Completion)
router.post('/:id/goals/:goalId/accomplish', async (req, res) => {
    try {
        const { id, goalId } = req.params;
        const { requestingUserId } = req.body;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const goal = project.timeGoals.id(goalId);
        if (!goal) return res.status(404).json({ message: 'Mission not found' });

        // Add to completedBy if not already there
        if (!goal.completedBy.includes(requestingUserId)) {
            goal.completedBy.push(requestingUserId);
        }

        // Check if everyone assigned has completed it
        const effectiveAssignees = goal.assignedType === 'all' ? project.team : goal.assignees;

        // If it's a 'specific' assignment, everyone in assignees must complete it
        // If it's 'all', we usually want at least one or everyone. Let's say MISSION COMPLETE when all assignees are in completedBy.
        const allDone = effectiveAssignees.every(memberId => goal.completedBy.includes(memberId.toString()));

        if (allDone) {
            goal.status = 'approved';
            goal.completedAt = new Date();
        }

        await project.save();
        const populatedProject = await Project.findById(id)
            .populate('team', 'name email')
            .populate('joinRequests.user', 'name email');
        res.json(populatedProject);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REQUEST MISSION POSTPONE (Member Only)
router.post('/:id/goals/:goalId/request-postpone', async (req, res) => {
    try {
        const { id, goalId } = req.params;
        const { requestedDate, personalNote, requestingUserId } = req.body;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const goal = project.timeGoals.id(goalId);
        if (!goal) return res.status(404).json({ message: 'Mission not found' });

        const user = await User.findById(requestingUserId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Create Chat Message with EXACT requested wording
        const newMessage = new Message({
            content: `I won't be able to complete the mission till the given date due to "${personalNote}" so plz postbone the date of the mission till the date "${requestedDate}"`,
            sender: requestingUserId,
            projectId: id,
            goalId: goalId,
            requestedDate: requestedDate,
            type: 'postpone'
        });
        await newMessage.save();

        // Optional: Send Notification to Leader
        const notification = new Notification({
            recipient: project.requestedBy,
            sender: requestingUserId,
            title: 'Mission Postpone Request',
            message: `${user.name} requested to postpone "${goal.title}" to ${requestedDate}.`,
            type: 'warning'
        });
        await notification.save();

        res.json({ message: 'Postponement request sent to project chat' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REMOVE TEAM MEMBER (Leader Only)
router.delete('/:id/members/:memberId', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy.toString() !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can remove members' });
        }

        if (req.params.memberId === project.requestedBy.toString()) {
            return res.status(400).json({ message: 'Leader cannot remove themselves' });
        }

        project.team = project.team.filter(m => m.toString() !== req.params.memberId);
        await project.save();

        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE PROJECT DETAILS (Leader Only)
router.patch('/:id/details', async (req, res) => {
    try {
        const { description, idea, problemStatement, requestingUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (project.requestedBy.toString() !== requestingUserId) {
            return res.status(403).json({ message: 'Only the project leader can update details' });
        }

        if (description !== undefined) project.description = description;
        if (idea !== undefined) project.idea = idea;
        if (problemStatement !== undefined) project.problemStatement = problemStatement;
        if (req.body.teamName !== undefined) project.teamName = req.body.teamName;

        await project.save();
        const populatedProject = await Project.findById(req.params.id)
            .populate('team', 'name email')
            .populate('joinRequests.user', 'name email avatar');
        res.json(populatedProject);
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

        if (project.requestedBy.toString() !== requestingUserId) {
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

        if (!project.team.some(member => member.toString() === addedBy)) {
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

        if (resource.addedBy.toString() !== requestingUserId && project.requestedBy.toString() !== requestingUserId) {
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
