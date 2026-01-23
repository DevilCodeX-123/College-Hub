const express = require('express');
const router = express.Router();
const Club = require('../models/Club');

// GET all clubs
router.get('/', async (req, res) => {
    try {
        const { college, requestingUserId } = req.query;
        let query = {};

        const User = require('../models/User');
        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                // Force filter to requester's college bubble
                query.college = requester.college;
            }
        }

        const collegeFilter = college ? college.trim() : null;
        if (collegeFilter && (!query.college || query.college === collegeFilter)) {
            query.college = { $regex: collegeFilter, $options: 'i' };
        }

        // Use raw collection to bypass stale schema
        const clubs = await Club.collection.find(query).toArray();
        const formattedClubs = clubs.map(c => ({ ...c, id: c._id.toString() }));
        res.json(formattedClubs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET club by coordinator ID
router.get('/coordinator/:userId', async (req, res) => {
    try {
        const User = require('../models/User');
        const requestingUser = await User.findById(req.query.requestingUserId || req.params.userId);

        if (requestingUser && requestingUser.role === 'owner') {
            // Owner can see any club, default to the first one for testing purposes
            // Use raw collection to bypass stale schema
            const club = await Club.collection.findOne();
            if (!club) return res.status(404).json({ message: 'No clubs found in system' });
            club.id = club._id.toString();
            return res.json(club);
        }

        // Use raw collection to bypass stale schema
        const club = await Club.collection.findOne({ coordinatorId: req.params.userId });
        if (!club) {
            return res.status(404).json({ message: 'Club not found for this coordinator' });
        }

        // Bubble check: If requestingUser is not the coordinator, check college
        if (requestingUser && requestingUser.role !== 'owner' && requestingUser._id.toString() !== req.params.userId) {
            if (requestingUser.college !== club.college) {
                return res.status(403).json({ message: 'Access Denied: Club is in a different college bubble' });
            }
        }

        club.id = club._id.toString();
        res.json(club);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one club
router.get('/:id', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const mongoose = require('mongoose');
        const club = await Club.collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const User = require('../models/User');
        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner' && requester.college !== club.college) {
                return res.status(403).json({ message: 'Access Denied: Club is in a different college bubble' });
            }
        }

        club.id = club._id.toString();
        res.json(club);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a club
router.post('/', async (req, res) => {
    if (req.body.college) {
        req.body.college = req.body.college.trim();
    }
    console.log(`Creating new club: "${req.body.name}" for college: "${req.body.college}"`);
    const club = new Club(req.body);
    try {
        const newClub = await club.save();
        res.status(201).json(newClub);
    } catch (err) {
        console.error("Error creating club:", err);
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a club
router.put('/:id', async (req, res) => {
    try {
        console.log(`Updating club ${req.params.id} with data:`, req.body);
        const mongoose = require('mongoose');
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;

        const club = await Club.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!club) return res.status(404).json({ message: 'Club not found' });

        const formattedClub = club.toObject();
        formattedClub.id = club._id.toString();

        res.json(formattedClub);
    } catch (err) {
        console.error("UPDATE ERROR:", err);
        res.status(400).json({ message: err.message });
    }
});

// DELETE a club
router.delete('/:id', async (req, res) => {
    try {
        await Club.findByIdAndDelete(req.params.id);
        res.json({ message: 'Club deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REQUEST to join a club
router.post('/:id/request-join', async (req, res) => {
    try {
        const { userId, name, email } = req.body;
        const club = await Club.findById(req.params.id);

        if (!club) return res.status(404).json({ message: 'Club not found' });

        // Check if already a member or already has a pending request
        const isAlreadyPending = club.pendingMembers.some(m => m.userId === userId);
        if (isAlreadyPending) {
            return res.status(400).json({ message: 'Join request already pending' });
        }

        club.pendingMembers.push({ userId, name, email });
        await club.save();

        res.json({ message: 'Join request sent successfully', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// APPROVE a join request
router.post('/:id/approve-join/:userId', async (req, res) => {
    try {
        const User = require('../models/User');
        const club = await Club.findById(req.params.id);
        const user = await User.findById(req.params.userId);

        if (!club || !user) return res.status(404).json({ message: 'Club or User not found' });

        // Move from pending to member
        club.pendingMembers = club.pendingMembers.filter(m => m.userId !== req.params.userId);
        club.memberCount += 1;
        await club.save();

        if (!user.joinedClubs.includes(req.params.id)) {
            user.joinedClubs.push(req.params.id);
            await user.save();
        }

        res.json({ message: 'Join request approved', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REJECT a join request
router.post('/:id/reject-join/:userId', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        club.pendingMembers = club.pendingMembers.filter(m => m.userId !== req.params.userId);
        await club.save();

        res.json({ message: 'Join request rejected', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REMOVE a member from club
router.post('/:id/remove-member', async (req, res) => {
    try {
        const { userId } = req.body;
        const User = require('../models/User');

        const club = await Club.findById(req.params.id);
        const user = await User.findById(userId);

        if (!club || !user) return res.status(404).json({ message: 'Club or User not found' });

        // Remove from User's joinedClubs
        if (user.joinedClubs.includes(req.params.id)) {
            user.joinedClubs = user.joinedClubs.filter(id => id.toString() !== req.params.id);
            await user.save();
        }

        // Decrement Club member count
        // We assume memberCount is accurate or we might want to recalculate it from Users count, but simple decrement is faster
        if (club.memberCount > 0) {
            club.memberCount -= 1;
        }

        // Also remove from coreTeam if present
        club.coreTeam = club.coreTeam.filter(m => m.userId !== userId);

        await club.save();

        res.json({ message: 'Member removed successfully', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Legacy/Direct join (Optional: kept for compatibility if needed elsewhere)
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const User = require('../models/User');

        const user = await User.findById(userId);
        const club = await Club.findById(req.params.id);

        if (!user || !club) return res.status(404).json({ message: 'User or Club not found' });

        if (user.joinedClubs.includes(req.params.id)) {
            return res.status(400).json({ message: 'Already a member' });
        }

        user.joinedClubs.push(req.params.id);
        await user.save();

        club.memberCount += 1;
        await club.save();

        res.json({ user, club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// SUGGEST a challenge
router.post('/:id/suggest-challenge', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        club.challengeSuggestions.push(req.body);
        await club.save();
        res.json({ message: 'Challenge suggestion submitted', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// APPROVE a challenge suggestion
router.post('/:id/approve-challenge/:suggestionId', async (req, res) => {
    try {
        const Challenge = require('../models/Challenge');
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const suggestion = club.challengeSuggestions.id(req.params.suggestionId);
        if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

        // Create the actual challenge
        const newChallenge = new Challenge({
            title: suggestion.title,
            description: suggestion.description,
            points: suggestion.points,
            difficulty: suggestion.difficulty,
            clubId: club._id,
            clubName: club.name,
            status: 'active'
        });
        await newChallenge.save();

        // Update suggestion status
        suggestion.status = 'approved';
        await club.save();

        res.json({ message: 'Challenge approved and created', club, challenge: newChallenge });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REJECT a challenge suggestion
router.post('/:id/reject-challenge/:suggestionId', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const suggestion = club.challengeSuggestions.id(req.params.suggestionId);
        if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

        suggestion.status = 'rejected';
        await club.save();

        res.json({ message: 'Challenge suggestion rejected', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADD History Item (Past Event/Challenge)
router.post('/:id/history', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        club.history.push(req.body);
        await club.save();
        res.json({ message: 'History item added', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE History Item
router.delete('/:id/history/:itemId', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        club.history = club.history.filter(item => item._id.toString() !== req.params.itemId);
        await club.save();
        res.json({ message: 'History item removed', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADD Achievement
router.post('/:id/achievements', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        club.achievements.push(req.body);
        await club.save();
        res.json({ message: 'Achievement added', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE Achievement
router.delete('/:id/achievements/:itemId', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        club.achievements = club.achievements.filter(item => item._id.toString() !== req.params.itemId);
        await club.save();
        res.json({ message: 'Achievement removed', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MANAGE Core Team Member (Upsert)
router.post('/:id/core-team', async (req, res) => {
    try {
        const { userId, role, customTitle, requestingUserId } = req.body;
        const User = require('../models/User');
        const club = await Club.findById(req.params.id);
        const user = await User.findById(userId);

        if (!club || !user) return res.status(404).json({ message: 'Club or User not found' });

        // Authorization & Hierarchy Check
        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (!requester) return res.status(403).json({ message: 'Requester not found' });

            const ROLE_HIERARCHY = {
                'owner': 100,
                'admin': 5,
                'club_coordinator': 4,
                'club_head': 3,
                'core_member': 2,
                'student': 1
            };

            const requesterPower = ROLE_HIERARCHY[requester.role] || 0;
            const newRolePower = ROLE_HIERARCHY[role] || 0;

            // 1. Bubble Isolation: Non-owners can only manage their own club/college
            if (requester.role !== 'owner') {
                if (requester.role === 'admin') {
                    // Admin must be in same college as club
                    if (requester.college !== club.college) {
                        return res.status(403).json({ message: 'Access Denied: This club belongs to a different college bubble' });
                    }
                } else {
                    // Coordinator/Secretary must be explicitly assigned to this club
                    const isCoordinatingThisClub = club.coordinatorId?.toString() === requestingUserId;
                    const isHeadOfThisClub = club.coreTeam.some(m => m.userId === requestingUserId && m.role === 'club_head');

                    if (!isCoordinatingThisClub && !isHeadOfThisClub) {
                        return res.status(403).json({ message: 'Access Denied: You do not manage this club bubble' });
                    }
                }
            }

            // 2. Hierarchy Check: Can only assign roles strictly LOWER than own
            if (requester.role !== 'owner' && newRolePower >= requesterPower) {
                return res.status(403).json({ message: 'Insufficient permission to assign this role (Hierarchy Violation)' });
            }
        }

        // Enforce Single Club Secretary
        if (role === 'club_head') {
            const existingHead = club.coreTeam.find(m => m.role === 'club_head' && m.userId !== userId);
            if (existingHead) {
                // Demote existing head to core_member
                existingHead.role = 'core_member';
                existingHead.customTitle = 'Former Secretary';
                await User.findByIdAndUpdate(existingHead.userId, { role: 'core_member' });
            }
        }

        // Update User Role globally if they are being promoted to a management role
        user.role = role;
        await user.save();

        // Update Club Core Team Array
        club.coreTeam = club.coreTeam.filter(m => m.userId !== userId);
        club.coreTeam.push({
            userId,
            name: user.name,
            role: role,
            customTitle: customTitle || ''
        });

        await club.save();
        res.json({ message: 'Core team updated', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REMOVE Core Team Member (Demote to Club Member)
router.delete('/:id/core-team/:userId', async (req, res) => {
    try {
        const User = require('../models/User');
        const club = await Club.findById(req.params.id);
        const user = await User.findById(req.params.userId);

        if (!club || !user) return res.status(404).json({ message: 'Club or User not found' });

        // Update User Role to club_member
        user.role = 'club_member';
        await user.save();

        // Remove from Club Core Team Array
        club.coreTeam = club.coreTeam.filter(m => m.userId !== req.params.userId);

        await club.save();
        res.json({ message: 'Member demoted to regular member', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
