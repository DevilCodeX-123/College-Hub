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
                query.college = requester.college;
            }
        }

        if (clubId) {
            query.clubId = clubId;
        } else if (college) {
            // Respect passed college but it's restricted by query.college above if not owner
            if (!query.college || query.college === college) {
                query.college = college;
            }
        }

        const challenges = await Challenge.find(query).sort({ createdAt: -1 });
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a challenge
router.post('/', async (req, res) => {
    try {
        const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        // phases should be passed in req.body
        const challengeData = { ...req.body, joinCode };
        const challenge = new Challenge(challengeData);
        const newChallenge = await challenge.save();

        // Award 100 coins to the club
        if (req.body.clubId) {
            const club = await Club.findById(req.body.clubId);
            if (club) {
                club.coins = (club.coins || 0) + 100;
                club.points = (club.points || 0) + 50;
                club.monthlyPoints = (club.monthlyPoints || 0) + 50;
                await club.save();
            }
        }

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

        // Award 2 coins to the club for participation
        if (challenge.clubId) {
            const club = await Club.findById(challenge.clubId);
            if (club) {
                club.coins = (club.coins || 0) + 2;
                await club.save();
            }
        }

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

        // Award 2 coins to the club
        if (challenge.clubId) {
            const club = await Club.findById(challenge.clubId);
            if (club) {
                club.coins = (club.coins || 0) + 2;
                await club.save();
            }
        }

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

        // Validate Phase Deadline
        if (phaseId && challenge.phases && challenge.phases.length > 0) {
            const phase = challenge.phases.id(phaseId);
            if (!phase) return res.status(404).json({ message: 'Phase not found' });

            if (phase.deadline && new Date() > new Date(phase.deadline)) {
                return res.status(400).json({ message: `Deadline for ${phase.name} has passed.` });
            }
        }
        // Fallback main deadline check for non-phase challenges
        else if (challenge.deadline && new Date() > new Date(challenge.deadline)) {
            return res.status(400).json({ message: 'Challenge deadline has passed.' });
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

        // Calculate XP based on marks
        const xpEarned = Math.round((marks / 100) * challenge.points);

        // Award XP if passed
        if (marks >= 40) {
            student.points += xpEarned;
            student.totalEarnedXP += xpEarned;
            student.weeklyXP += xpEarned;
            student.level = calculateLevelFromXP(student.totalEarnedXP);

            // Update activity status to completed
            const activity = student.activity.find(a =>
                a.type === 'challenge' && a.refId && a.refId.toString() === challengeId
            );
            if (activity) {
                activity.status = 'completed';
            }

            // Award Badge if provided
            if (awardBadge) {
                student.badges.push({
                    name: awardBadge.name,
                    icon: awardBadge.icon || 'award',
                    description: awardBadge.description || `Awarded for ${challenge.title}`,
                    earnedAt: new Date()
                });
            }

            // Award Skill if provided
            if (awardSkill && !student.skills.includes(awardSkill)) {
                student.skills.push(awardSkill);
            }
        }

        await student.save();

        // Create notification for student
        const Notification = require('../models/Notification');
        let notifMessage = marks >= 40
            ? `Your submission for "${challenge.title}" has been approved! You earned ${xpEarned} XP. Marks: ${marks}/100${feedback ? `. Feedback: ${feedback}` : ''}`
            : `Your submission for "${challenge.title}" needs improvement. Marks: ${marks}/100${feedback ? `. Feedback: ${feedback}` : ''}`;

        if (awardBadge) notifMessage += ` You also earned the "${awardBadge.name}" badge!`;
        if (awardSkill) notifMessage += ` You were endorsed for "${awardSkill}"!`;

        await Notification.create({
            recipient: userId,
            sender: reviewerId,
            title: marks >= 40 ? 'Challenge Approved!' : 'Challenge Needs Improvement',
            message: notifMessage,
            type: marks >= 40 ? 'success' : 'warning'
        });

        res.json({
            message: marks >= 40
                ? `Submission approved! ${xpEarned} XP awarded to ${student.name}.`
                : `Submission marked. Student notified.`,
            student,
            xpEarned: marks >= 40 ? xpEarned : 0
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

        const challenge = await Challenge.findByIdAndUpdate(
            challengeId,
            updates,
            { new: true, runValidators: true }
        );

        // If status changed to 'completed', add to club history
        if (updates.status === 'completed' && oldChallenge.status !== 'completed') {
            const club = await Club.findById(challenge.clubId);
            if (club) {
                club.history.push({
                    type: 'challenge',
                    title: challenge.title,
                    date: new Date(),
                    description: challenge.description || 'Completed challenge.',
                    link: `/challenges` // Link to challenges page or specific challenge if exists
                });
                await club.save();
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
        const challenge = await Challenge.findByIdAndDelete(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.json({ message: 'Challenge deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
