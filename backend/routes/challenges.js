const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const ChallengeTeam = require('../models/ChallengeTeam');
const Club = require('../models/Club');
const crypto = require('crypto');
const User = require('../models/User');
const { calculateLevelFromXP } = require('../utils/leveling');

// GET all challenges
router.get('/', async (req, res) => {
    try {
        const { college, clubId, requestingUserId } = req.query;
        let query = {};

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                // Determine college for isolation
                // If not owner, they can ONLY see challenges from their college
                if (requester.college) {
                    const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
                }
            }
        }

        if (clubId) {
            query.clubId = clubId;
        } else if (college) {
            // Respect passed college but it's restricted by query.college above if not owner
            if (!query.college) {
                const cleanCollege = college.trim();
                const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
            }
        }
        const challenges = await Challenge.find(query).sort({ createdAt: -1 });
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a single challenge
router.get('/:id', async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
        res.json(challenge);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a challenge
router.post('/', async (req, res) => {
    try {
        // Future Date Enforcement
        if (req.body.deadline) {
            const deadlineDate = new Date(req.body.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (deadlineDate < today) {
                return res.status(400).json({ message: 'Challenge deadline cannot be in the past' });
            }
        }

        const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        // Fetch club to get college
        let college = req.body.college;
        if (req.body.clubId && !college) {
            const club = await Club.findById(req.body.clubId);
            if (club) {
                college = club.college;
            }
        }

        // Calculate XP and Club Points
        const phaseCount = req.body.phases?.length || 0;
        const studentXP = 100 + (phaseCount > 1 ? (phaseCount - 1) * 50 : 0);
        // phases should be passed in req.body
        const challengeData = {
            ...req.body,
            joinCode,
            college,
            points: studentXP // Enforce calculated XP
        };
        const challenge = new Challenge(challengeData);
        const newChallenge = await challenge.save();

        // REWARD DELAYED: Club coordination points moved to completion

        res.status(201).json(newChallenge);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// JOIN by code
router.post('/join-by-code', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const challenge = await Challenge.findOne({ joinCode: code });
        const user = await User.findById(userId);

        if (!challenge) return res.status(404).json({ message: 'Invalid join code' });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent double joining
        if (user.activity.some(a => a.refId && a.refId.toString() === challenge._id.toString())) {
            return res.status(400).json({ message: 'Already joined this challenge' });
        }

        // Check if user has enough points for entry fee
        const fee = challenge.entryFee || 0;
        if (user.points < fee) {
            return res.status(400).json({ message: `Insufficient points. This challenge requires ${fee} XP to join.` });
        }

        // Deduct fee
        user.points -= fee;
        user.totalEarnedXP -= fee;
        user.weeklyXP = (user.weeklyXP || 0) - fee;
        user.level = calculateLevelFromXP(user.totalEarnedXP);

        challenge.participants += 1;
        await challenge.save();

        user.activity.push({
            type: 'challenge',
            refId: challenge._id,
            title: challenge.title,
            status: 'started',
            timestamp: new Date()
        });

        await user.save();
        res.json({ message: `Joined challenge! ${fee > 0 ? fee + ' XP deducted. ' : ''}Task is now visible.`, user, challenge });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// JOIN/ACCEPT a challenge
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const challenge = await Challenge.findById(req.params.id);
        const user = await User.findById(userId);

        if (!challenge || !user) return res.status(404).json({ message: 'Challenge or User not found' });

        // Prevent double joining
        if (user.activity.some(a => a.refId && a.refId.toString() === challenge._id.toString())) {
            return res.status(400).json({ message: 'Already joined this challenge' });
        }

        // Check if user has enough points for entry fee
        const fee = challenge.entryFee || 0;
        if (user.points < fee) {
            return res.status(400).json({ message: `Insufficient points. This challenge requires ${fee} XP to join.` });
        }

        // Deduct fee
        user.points -= fee;
        user.totalEarnedXP -= fee;
        user.weeklyXP = (user.weeklyXP || 0) - fee;
        user.level = calculateLevelFromXP(user.totalEarnedXP);

        // Increment participants
        challenge.participants += 1;
        await challenge.save();

        // Add to user activity
        user.activity.push({
            type: 'challenge',
            refId: challenge._id,
            title: challenge.title,
            status: 'started',
            timestamp: new Date()
        });

        await user.save();
        res.json({ message: `Challenge joined! ${fee} XP deducted. Task is now visible.`, user, challenge });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET participants for a club's challenges
router.get('/participants/:clubId', async (req, res) => {
    try {
        const { clubId } = req.params;
        const clubChallenges = await Challenge.find({ clubId });
        const challengeIds = clubChallenges.map(c => c._id.toString());

        const users = await User.find({
            'activity.refId': { $in: challengeIds }
        });

        const participants = users.map(user => {
            const userActivities = user.activity.filter(a =>
                a.type === 'challenge' && challengeIds.includes(a.refId?.toString())
            );

            return userActivities.map(activity => ({
                userId: user._id,
                userName: user.name,
                userEmail: user.email,
                userAvatar: user.avatar,
                challengeId: activity.refId,
                challengeTitle: activity.title,
                status: activity.status,
                joinedAt: activity.timestamp
            }));
        }).flat();

        res.json(participants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// VERIFY challenge completion
router.post('/verify-completion', async (req, res) => {
    try {
        const { userId, challengeId } = req.body;
        const user = await User.findById(userId);
        const challenge = await Challenge.findById(challengeId);

        if (!user || !challenge) return res.status(404).json({ message: 'User or Challenge not found' });

        const activity = user.activity.find(a =>
            a.type === 'challenge' && a.refId?.toString() === challengeId.toString()
        );

        if (!activity) return res.status(404).json({ message: 'Challenge activity not found for this user' });
        if (activity.status === 'completed') return res.status(400).json({ message: 'Challenge already verified as completed' });

        // Update activity status
        activity.status = 'completed';

        // Award XP
        const xpEarned = challenge.points || 200;
        user.points += xpEarned;
        user.totalEarnedXP += xpEarned;
        user.weeklyXP += xpEarned;
        user.level = calculateLevelFromXP(user.totalEarnedXP);

        user.pointsHistory.push({
            amount: xpEarned,
            reason: `Verified completion of challenge: ${challenge.title}`,
            sourceId: challenge._id,
            sourceType: 'challenge',
            clubId: challenge.clubId,
            timestamp: new Date()
        });

        await user.save();

        res.json({ message: `Challenge verified! ${xpEarned} XP awarded to ${user.name}.`, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET user's team for a challenge
router.get('/my-team/:challengeId', async (req, res) => {
    try {
        const { userId } = req.query;
        const team = await ChallengeTeam.findOne({
            challengeId: req.params.challengeId,
            members: userId
        }).populate('members', 'name avatar email');
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET user's team for a challenge (alternate route pattern)
router.get('/:challengeId/team/:userId', async (req, res) => {
    try {
        const { challengeId, userId } = req.params;
        const team = await ChallengeTeam.findOne({
            challengeId: challengeId,
            members: userId
        }).populate('members', 'name avatar email');
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all teams for a challenge
router.get('/:challengeId/teams', async (req, res) => {
    try {
        const teams = await ChallengeTeam.find({
            challengeId: req.params.challengeId
        }).populate('members', 'name avatar email').populate('leaderId', 'name');
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a team for a challenge
router.post('/:id/create-team', async (req, res) => {
    try {
        const { userId, teamName } = req.body;
        const challengeId = req.params.id;

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
        if (!challenge.isTeamChallenge) return res.status(400).json({ message: 'This is not a team challenge' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if user is already in a team for this challenge
        const existingTeam = await ChallengeTeam.findOne({ challengeId, members: userId });
        if (existingTeam) return res.status(400).json({ message: 'You are already in a team for this challenge' });

        // Check if team name already exists for this challenge
        const existingTeamName = await ChallengeTeam.findOne({
            challengeId,
            name: { $regex: new RegExp(`^${teamName}$`, 'i') }
        });
        if (existingTeamName) {
            return res.status(400).json({ message: 'This team name is already taken. Please choose another one.' });
        }

        // Check if user has enough points for entry fee
        const fee = challenge.entryFee || 0;
        if (user.points < fee) {
            return res.status(400).json({ message: `Insufficient points. This challenge requires ${fee} XP to join.` });
        }

        // Deduct fee
        user.points -= fee;
        user.totalEarnedXP -= fee;
        user.weeklyXP = (user.weeklyXP || 0) - fee;
        user.level = calculateLevelFromXP(user.totalEarnedXP);

        const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const team = new ChallengeTeam({
            challengeId,
            name: teamName,
            leaderId: userId,
            members: [userId],
            joinCode
        });

        await team.save();

        // Award Club points for new team unit (25 pts = 20 bonus + 5 unit)
        if (challenge.clubId) {
            const club = await Club.findById(challenge.clubId);
            if (club) {
                club.points += 25;
                club.monthlyPoints += 25;
                await club.save();
            }
        }

        // Update user activity if not already joined challenge (or update status)
        const activityIndex = user.activity.findIndex(a => a.refId === challengeId);
        if (activityIndex > -1) {
            user.activity[activityIndex].status = 'started';
        } else {
            user.activity.push({
                type: 'challenge',
                refId: challengeId,
                title: challenge.title,
                status: 'started',
                timestamp: new Date()
            });
        }
        await user.save();

        res.status(201).json(team);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// JOIN a team by code
router.post('/join-team', async (req, res) => {
    try {
        const { userId, joinCode } = req.body;
        const team = await ChallengeTeam.findOne({ joinCode: joinCode.toUpperCase() });

        if (!team) return res.status(404).json({ message: 'Invalid Join Code' });

        const challenge = await Challenge.findById(team.challengeId);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

        if (team.members.includes(userId)) {
            return res.status(400).json({ message: 'You are already in this team' });
        }

        // Check if user is already in ANOTHER team for this challenge
        const existingTeam = await ChallengeTeam.findOne({ challengeId: team.challengeId, members: userId });
        if (existingTeam) return res.status(400).json({ message: 'You are already in a team for this challenge' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if user has enough points for entry fee
        const fee = challenge.entryFee || 0;
        if (user.points < fee) {
            return res.status(400).json({ message: `Insufficient points. This challenge requires ${fee} XP to join.` });
        }

        // Deduct fee
        user.points -= fee;
        user.totalEarnedXP -= fee;
        user.weeklyXP = (user.weeklyXP || 0) - fee;
        user.level = calculateLevelFromXP(user.totalEarnedXP);

        team.members.push(userId);
        await team.save();

        // Update user activity
        const activityIndex = user.activity.findIndex(a => a.refId === challenge.id.toString() || a.refId === challenge._id.toString());
        if (activityIndex > -1) {
            user.activity[activityIndex].status = 'started';
        } else {
            user.activity.push({
                type: 'challenge',
                refId: challenge._id,
                title: challenge.title,
                status: 'started',
                timestamp: new Date()
            });
        }
        await user.save();

        res.json({ message: 'Successfully joined team', team });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REMOVE a member from team (leader only)
router.post('/remove-team-member', async (req, res) => {
    try {
        const { teamId, memberId, leaderId } = req.body;
        const team = await ChallengeTeam.findById(teamId);

        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Check if requester is the team leader
        if (team.leaderId.toString() !== leaderId) {
            return res.status(403).json({ message: 'Only team leader can remove members' });
        }

        // Prevent leader from removing themselves
        if (memberId === leaderId) {
            return res.status(400).json({ message: 'Leader cannot remove themselves' });
        }

        // Remove member from team
        team.members = team.members.filter(m => m.toString() !== memberId);
        await team.save();

        // Remove challenge from user's activity
        const user = await User.findById(memberId);
        if (user) {
            user.activity = user.activity.filter(a =>
                !(a.type === 'challenge' && a.refId.toString() === team.challengeId.toString())
            );
            await user.save();
        }

        res.json({ message: 'Member removed successfully', team });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// EXIT team (member leaves voluntarily)
router.post('/exit-team', async (req, res) => {
    try {
        const { teamId, userId } = req.body;
        const team = await ChallengeTeam.findById(teamId);

        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Check if user is in the team
        if (!team.members.includes(userId)) {
            return res.status(400).json({ message: 'You are not in this team' });
        }

        // Check if user is leader
        const isLeader = team.leaderId.toString() === userId;

        // Remove member from team
        team.members = team.members.filter(m => m.toString() !== userId);

        // If user was leader and there are remaining members, assign new leader
        if (isLeader && team.members.length > 0) {
            // The next member in the list becomes the leader
            team.leaderId = team.members[0];
        }

        // If team is now empty, delete it
        if (team.members.length === 0) {
            await ChallengeTeam.findByIdAndDelete(teamId);
        } else {
            await team.save();
        }

        // Remove challenge from user's activity
        const user = await User.findById(userId);
        if (user) {
            user.activity = user.activity.filter(a =>
                !(a.type === 'challenge' && a.refId.toString() === team.challengeId.toString())
            );
            await user.save();
        }

        res.json({ message: 'Successfully left the team', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// SUBMIT challenge work
router.post('/:id/submit', async (req, res) => {
    try {
        const { userId, submissionLink, phaseId } = req.body;
        const challengeId = req.params.id;

        const challenge = await Challenge.findById(challengeId);
        const user = await User.findById(userId);

        if (!challenge || !user) {
            return res.status(404).json({ message: 'Challenge or User not found' });
        }

        // Check if user has joined the challenge
        const hasJoined = user.activity.some(a =>
            a.type === 'challenge' && a.refId && a.refId.toString() === challengeId
        );

        if (!hasJoined) {
            return res.status(400).json({ message: 'You must join the challenge first' });
        }

        // Team Challenge Validation
        if (challenge.isTeamChallenge) {
            // Find user's team
            const team = await ChallengeTeam.findOne({
                challengeId,
                members: userId
            });

            if (!team) {
                return res.status(400).json({ message: 'You must be in a team to submit this challenge' });
            }

            // Check if user is the team leader
            if (team.leaderId.toString() !== userId) {
                return res.status(403).json({ message: 'Only the team leader can submit work for this challenge' });
            }

            // Validate team size
            const teamSize = team.members.length;
            const minSize = challenge.minTeamSize || 2;
            const maxSize = challenge.maxTeamSize || 4;

            if (teamSize < minSize || teamSize > maxSize) {
                return res.status(400).json({
                    message: `Team size must be between ${minSize} and ${maxSize} members. Current size: ${teamSize}`
                });
            }
        }

        // Validate Phase Deadline
        if (phaseId && challenge.phases && challenge.phases.length > 0) {
            const phase = challenge.phases.id(phaseId);
            if (!phase) return res.status(404).json({ message: 'Phase not found' });

            if (phase.deadline) {
                const deadlineDate = new Date(phase.deadline);
                deadlineDate.setHours(23, 59, 59, 999);
                if (new Date() > deadlineDate) {
                    return res.status(400).json({ message: `Deadline for ${phase.name} has passed.` });
                }
            }
        }
        // Fallback main deadline check for non-phase challenges
        else if (challenge.deadline) {
            const deadlineDate = new Date(challenge.deadline);
            deadlineDate.setHours(23, 59, 59, 999);
            if (new Date() > deadlineDate) {
                return res.status(400).json({ message: 'Challenge deadline has passed.' });
            }
        }

        // Check if already submitted (for this phase if phased)
        let existingSubmission;
        if (phaseId) {
            existingSubmission = challenge.submissions.find(
                s => s.userId && s.userId.toString() === userId && s.phaseId && s.phaseId.toString() === phaseId
            );
        } else {
            // For non-phased challenges, only one submission allowed per user
            existingSubmission = challenge.submissions.find(
                s => s.userId && s.userId.toString() === userId
            );
        }

        if (existingSubmission) {
            // Update existing submission
            existingSubmission.submissionLink = submissionLink;
            existingSubmission.submittedAt = new Date();
            existingSubmission.status = 'pending';
        } else {
            // Add new submission
            challenge.submissions.push({
                userId,
                userName: user.name,
                submissionLink,
                phaseId: phaseId || undefined,
                submittedAt: new Date(),
                status: 'pending'
            });
        }

        await challenge.save();

        res.json({
            message: 'Submission received! Waiting for coordinator review.',
            challenge
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GRADE/MARK a submission
router.post('/:id/grade/:submissionId', async (req, res) => {
    try {
        const { marks, feedback, reviewerId, awardBadge, awardSkill } = req.body;
        const challengeId = req.params.id;
        const submissionId = req.params.submissionId;

        const challenge = await Challenge.findById(challengeId);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Find the submission by ID
        const submission = challenge.submissions.id(submissionId);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        const userId = submission.userId;
        const student = await User.findById(userId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Update submission with marks and feedback
        submission.marks = marks;
        submission.feedback = feedback || '';
        submission.status = marks >= 40 ? 'approved' : 'rejected';
        submission.reviewedAt = new Date();
        submission.reviewedBy = reviewerId;

        await challenge.save();

        // REWARD DELAYED: Rewards moved to challenge completion block

        // Create notification for student
        const Notification = require('../models/Notification');
        const xpEarned = Math.round((marks / 100) * challenge.points);
        let notifMessage = marks >= 40
            ? `Your submission for "${challenge.title}" has been approved! You will receive ${xpEarned} XP once the challenge is officially completed. Marks: ${marks}/100${feedback ? `. Feedback: ${feedback}` : ''}`
            : `Your submission for "${challenge.title}" needs improvement. Marks: ${marks}/100${feedback ? `. Feedback: ${feedback}` : ''}`;

        if (awardBadge) notifMessage += ` You also earned the "${awardBadge.name}" badge!`;
        if (awardSkill) notifMessage += ` You were endorsed for "${awardSkill}"!`;

        await Notification.create({
            recipient: userId,
            sender: reviewerId,
            title: marks >= 40 ? 'Challenge Approved (Points Pending)!' : 'Challenge Needs Improvement',
            message: notifMessage,
            type: marks >= 40 ? 'success' : 'warning'
        });

        res.json({
            message: marks >= 40
                ? `Submission approved! XP will be awarded when the challenge ends.`
                : `Submission marked. Student notified.`,
            student,
            xpEarned: 0 // Delayed
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE challenge (for edit functionality)
router.put('/:id', async (req, res) => {
    try {
        const challengeId = req.params.id;
        const updates = req.body;

        // Find old challenge to check status change
        const oldChallenge = await Challenge.findById(challengeId);
        if (!oldChallenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Enforce point rules on update
        if (updates.phases) {
            const phaseCount = updates.phases.length || 0;
            updates.points = 100 + (phaseCount > 1 ? (phaseCount - 1) * 50 : 0);
        }

        const challenge = await Challenge.findByIdAndUpdate(
            challengeId,
            updates,
            { new: true, runValidators: true }
        );

        // If status changed to 'completed', award points/XP to all approved students and the club
        if (updates.status === 'completed' && oldChallenge.status !== 'completed') {
            const club = await Club.findById(challenge.clubId);
            const approvedSubmissions = challenge.submissions.filter(sub => sub.status === 'approved');

            // 1. Award Club points
            if (club) {
                // Coordination (50) + Grading (50 per student)
                const coordinationPoints = 50;
                const gradingPoints = approvedSubmissions.length * 50;
                const totalClubPoints = coordinationPoints + gradingPoints;

                club.points = (club.points || 0) + totalClubPoints;
                club.monthlyPoints = (club.monthlyPoints || 0) + totalClubPoints;

                club.pointsHistory.push({
                    amount: totalClubPoints,
                    reason: `Coordination and grading points for challenge: ${challenge.title}`,
                    sourceId: challenge._id,
                    sourceType: 'challenge',
                    timestamp: new Date()
                });

                await club.save();
            }

            // 2. Award Students their XP
            for (let sub of approvedSubmissions) {
                const student = await User.findById(sub.userId);
                if (student) {
                    const xpEarned = Math.round((sub.marks / 100) * challenge.points);
                    student.points = (student.points || 0) + xpEarned;
                    student.totalEarnedXP = (student.totalEarnedXP || 0) + xpEarned;
                    student.weeklyXP = (student.weeklyXP || 0) + xpEarned;
                    student.level = calculateLevelFromXP(student.totalEarnedXP);

                    student.pointsHistory.push({
                        amount: xpEarned,
                        reason: `Finished challenge with ${sub.marks}/100 marks: ${challenge.title}`,
                        sourceId: challenge._id,
                        sourceType: 'challenge',
                        clubId: challenge.clubId,
                        timestamp: new Date()
                    });

                    await student.save();
                }
            }

            if (club) {
                // Construct high-detail leaderboard for archival
                const sortedSubs = [...approvedSubmissions].sort((a, b) => (b.marks || 0) - (a.marks || 0));

                const leaderboard = await Promise.all(sortedSubs.map(async (sub, index) => {
                    const student = await User.findById(sub.userId).select('avatar');
                    return {
                        userId: sub.userId,
                        name: sub.userName,
                        avatar: student?.avatar || '',
                        rank: index + 1,
                        score: sub.marks || 0,
                        submissionLink: sub.submissionLink
                    };
                }));

                club.history.push({
                    type: 'challenge',
                    id: challenge._id,
                    challengeId: challenge._id.toString(), // Link to original Challenge ID
                    title: challenge.title,
                    date: new Date(),
                    description: challenge.description || 'Completed challenge.',
                    category: challenge.category || 'Challenge',
                    points: challenge.points || 0,
                    participantCount: challenge.participants || approvedSubmissions.length,
                    leaderboard: leaderboard,
                    link: `/challenges`
                });
                await club.save();

                // Create a Rating Poll for the challenge
                const Poll = require('../models/Poll');
                const ratingPoll = new Poll({
                    question: `How would you rate the challenge: ${challenge.title}?`,
                    options: [
                        { text: '1 Star ⭐', votes: 0 },
                        { text: '2 Stars ⭐⭐', votes: 0 },
                        { text: '3 Stars ⭐⭐⭐', votes: 0 },
                        { text: '4 Stars ⭐⭐⭐⭐', votes: 0 },
                        { text: '5 Stars ⭐⭐⭐⭐⭐', votes: 0 }
                    ],
                    createdBy: challenge.instructorId || club.coordinatorId,
                    targetRoles: ['all'],
                    college: club.college || null,
                    clubId: challenge.clubId,
                    challengeId: challenge._id,
                    isRatingPoll: true,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
                });
                await ratingPoll.save();
            }
        }

        res.json(challenge);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE challenge
router.delete('/:id', async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // REMOVE POINTS ON DELETION
        // 1. Remove Club points
        const club = await Club.findById(challenge.clubId);
        if (club) {
            let totalToDeduct = 0;

            // Deduction only happens if the challenge was completed (rewards were issued)
            if (challenge.status === 'completed') {
                const approvedCount = challenge.submissions.filter(s => s.status === 'approved').length;
                totalToDeduct = 50 + (approvedCount * 50); // Coordination (50) + Grading (50/std)
            }

            if (totalToDeduct > 0) {
                club.points = Math.max(0, (club.points || 0) - totalToDeduct);
                club.monthlyPoints = Math.max(0, (club.monthlyPoints || 0) - totalToDeduct);
                await club.save();
            }
        }

        // 2. Remove Student XP if completed
        if (challenge.status === 'completed') {
            for (let sub of challenge.submissions) {
                if (sub.status === 'approved') {
                    const student = await User.findById(sub.userId);
                    if (student) {
                        const xpToDeduct = Math.round((sub.marks / 100) * challenge.points);
                        student.points = Math.max(0, (student.points || 0) - xpToDeduct);
                        student.totalEarnedXP = Math.max(0, (student.totalEarnedXP || 0) - xpToDeduct);
                        student.weeklyXP = Math.max(0, (student.weeklyXP || 0) - xpToDeduct);
                        student.level = calculateLevelFromXP(student.totalEarnedXP);
                        await student.save();
                    }
                }
            }

            // ❌ 3. Revoke Rating Poll Points from Club
            const Poll = require('../models/Poll');
            const poll = await Poll.findOne({ challengeId: req.params.id, isRatingPoll: true });
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

        await Challenge.findByIdAndDelete(req.params.id);
        res.json({ message: 'Challenge deleted successfully. Associated points and voter rewards have been revoked.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
