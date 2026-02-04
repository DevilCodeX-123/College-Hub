const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');

// GET all clubs
router.get('/', async (req, res) => {
    try {
        const { college, requestingUserId } = req.query;
        let query = {};


        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                // Force filter to requester's college bubble (Case Insensitive)
                if (requester.college) {
                    const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    query.college = { $regex: new RegExp(`^${collegeName}$`, 'i') };
                }
            }
        }

        const collegeFilter = college ? college.trim() : null;
        if (collegeFilter && (!query.college || query.college === collegeFilter)) {
            query.college = { $regex: collegeFilter, $options: 'i' };
        }

        // Use standard find to benefit from Mongoose features, lean for performance
        const clubs = await Club.find(query).lean();

        // Enhance clubs with actual member counts from User collection
        const enhancedClubs = await Promise.all(clubs.map(async (c) => {
            const clubIdStr = c._id.toString();
            // Match by both ObjectId and String to handle inconsistent data migrations
            const actualCount = await User.countDocuments({
                joinedClubs: { $in: [c._id, clubIdStr] }
            });
            console.log(`[ClubCount] ${c.name} (${clubIdStr}): ${actualCount} members`);
            return {
                ...c,
                id: clubIdStr,
                memberCount: actualCount
            };
        }));

        res.json(enhancedClubs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all clubs managed by a user (Coordinator, Head, or Core Team)
router.get('/managed/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUser = await User.findById(req.query.requestingUserId || userId);

        let query = {
            $or: [
                { coordinatorId: userId },
                { 'coreTeam.userId': userId }
            ]
        };

        // Owner can see everything, but for "managed" they usually want their own or all
        if (requestingUser && requestingUser.role === 'owner') {
            // For consistency let owner see all clubs as "managed" or keep it specific
            // Let's keep it specific to where they are actually listed if they want "MY" clubs
        }

        const clubs = await Club.find(query).lean();

        const enhancedClubs = await Promise.all(clubs.map(async (club) => {
            club.id = club._id.toString();
            const actualCount = await User.countDocuments({ joinedClubs: club._id });
            club.memberCount = actualCount;
            return club;
        }));

        res.json(enhancedClubs);
    } catch (err) {
        console.error('[Managed Clubs Error]', err);
        res.status(500).json({ message: err.message });
    }
});

// GET club by coordinator ID or core team membership (Fallback/Single Compatibility)
router.get('/coordinator/:userId', async (req, res) => {
    try {

        const requestingUser = await User.findById(req.query.requestingUserId || req.params.userId);
        console.log(`[Club Lookup] UserId: ${req.params.userId}, Role: ${requestingUser?.role}`);

        if (requestingUser && requestingUser.role === 'owner') {
            // Owner can see any club, default to the first one for testing purposes
            const club = await Club.findOne().lean();
            if (!club) return res.status(404).json({ message: 'No clubs found in system' });
            club.id = club._id.toString();
            return res.json(club);
        }

        // Find club where user is coordinator OR in core team
        const club = await Club.findOne({
            $or: [
                { coordinatorId: req.params.userId },
                { 'coreTeam.userId': req.params.userId }
            ]
        }).lean();

        console.log(`[Club Lookup] Found club: ${club ? club.name : 'NONE'}`);
        if (club) {
            console.log(`[Club Lookup] CoordinatorId: ${club.coordinatorId}, CoreTeam:`, club.coreTeam?.map(m => `${m.name}(${m.userId})`));
        }

        if (!club) {
            return res.status(404).json({ message: 'Club not found for this user' });
        }

        // Bubble check: If requestingUser is not the coordinator, check college
        if (requestingUser && requestingUser.role !== 'owner' && requestingUser._id.toString() !== req.params.userId) {
            const userCollege = requestingUser.college ? requestingUser.college.trim().toLowerCase() : '';
            const clubCollege = club.college ? club.college.trim().toLowerCase() : '';
            if (userCollege !== clubCollege) {
                return res.status(403).json({ message: 'Access Denied: Club is in a different college bubble' });
            }
        }

        club.id = club._id.toString();
        // Accurate member count
        const actualCount = await User.countDocuments({ joinedClubs: club._id });
        club.memberCount = actualCount;
        res.json(club);
    } catch (err) {
        console.error('[Club Lookup Error]', err);
        res.status(500).json({ message: err.message });
    }
});

// GET one club
router.get('/:id', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const club = await Club.findById(req.params.id).lean();
        if (!club) return res.status(404).json({ message: 'Club not found' });


        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                const userCollege = requester.college ? requester.college.trim().toLowerCase() : '';
                const clubCollege = club.college ? club.college.trim().toLowerCase() : '';

                if (userCollege !== clubCollege) {
                    return res.status(403).json({ message: 'Access Denied: Club is in a different college bubble' });
                }
            }
        }

        const clubIdStr = club._id.toString();
        club.id = clubIdStr;
        // Accurate member count - Check both formats
        const actualCount = await User.countDocuments({
            joinedClubs: { $in: [club._id, clubIdStr] }
        });
        club.memberCount = actualCount;
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
        // If a coordinator is assigned, add them as a member immediately
        if (req.body.coordinatorId) {
            const User = require('../models/User');
            const coordinator = await User.findById(req.body.coordinatorId);
            if (coordinator) {
                const clubIdStr = club._id.toString();
                const isAlreadyJoined = coordinator.joinedClubs.some(cid => cid.toString() === clubIdStr);
                if (!isAlreadyJoined) {
                    coordinator.joinedClubs.push(club._id);
                    await coordinator.save();
                    club.memberCount = 1; // Initialize count
                }
            }
        }

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

        // Trigger Auto-Sync for member count and coordinator name
        await syncClubMetadata(club._id);

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

        if (user) {
            const clubIdStr = club._id.toString();
            const isAlreadyJoined = user.joinedClubs.some(cid => cid.toString() === clubIdStr);
            if (!isAlreadyJoined) {
                user.joinedClubs.push(club._id);
                // Add to user activity
                user.activity.push({
                    type: 'club',
                    refId: club._id,
                    title: club.name,
                    status: 'joined',
                    timestamp: new Date()
                });
                await user.save();
            }
        }

        // Trigger Auto-Sync
        await syncClubMetadata(club._id);

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
        const clubIdStr = club._id.toString();
        user.joinedClubs = user.joinedClubs.filter(id => id.toString() !== clubIdStr);
        await user.save();

        // Decrement Club member count (Basic decrement, will be fixed by sync)
        if (club.memberCount > 0) {
            club.memberCount -= 1;
        }

        // Also remove from coreTeam if present
        club.coreTeam = club.coreTeam.filter(m => m.userId !== userId);

        await club.save();

        // Trigger Auto-Sync
        await syncClubMetadata(club._id);

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
        // Add to user activity
        user.activity.push({
            type: 'club',
            refId: club._id,
            title: club.name,
            status: 'joined',
            timestamp: new Date()
        });
        await user.save();

        club.memberCount += 1;
        await club.save();

        // Trigger Auto-Sync
        await syncClubMetadata(club._id);

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

// UPDATE Achievement
router.put('/:id/achievements/:itemId', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const achievement = club.achievements.id(req.params.itemId);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

        // Update fields
        Object.assign(achievement, req.body);

        await club.save();
        res.json({ message: 'Achievement updated', club });
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

// Helper to sync club metadata (Count & Coordinator)
async function syncClubMetadata(clubId) {
    try {
        const Club = require('../models/Club');
        const User = require('../models/User');

        const club = await Club.findById(clubId);
        if (!club) return;

        // 1. Recalculate Member Count
        const clubIdStr = club._id.toString();
        const memberCount = await User.countDocuments({
            joinedClubs: { $in: [club._id, clubIdStr] }
        });
        club.memberCount = memberCount;

        // 2. Sync Coordinator Name
        // Priority: Coordinator > Head
        let coordinatorName = null;
        let coordinatorId = null;

        // Check Core Team array first
        const coordinatorObj = club.coreTeam.find(m => m.role === 'club_coordinator') ||
            club.coreTeam.find(m => m.role === 'club_head');

        if (coordinatorObj) {
            coordinatorName = coordinatorObj.name;
            coordinatorId = coordinatorObj.userId;
        }

        club.coordinator = coordinatorName;
        club.coordinatorId = coordinatorId;
        await club.save();
        console.log(`[Sync] Club ${club.name} synced: ${memberCount} members, Coord: ${coordinatorName}`);
    } catch (e) {
        console.error("[Sync] Error syncing club metadata:", e);
    }
}

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

            // 1. Bubble Isolation
            if (requester.role !== 'owner') {
                if (requester.role === 'admin') {
                    const userCollege = requester.college ? requester.college.trim().toLowerCase() : '';
                    const clubCollege = club.college ? club.college.trim().toLowerCase() : '';
                    if (userCollege !== clubCollege) return res.status(403).json({ message: 'Access Denied: College mismatch' });
                } else {
                    const isCoordinatingThisClub = club.coordinatorId?.toString() === requestingUserId;
                    const isHeadOfThisClub = club.coreTeam.some(m => m.userId === requestingUserId && m.role === 'club_head');
                    if (!isCoordinatingThisClub && !isHeadOfThisClub) return res.status(403).json({ message: 'Access Denied: Not a manager' });
                }
            }

            // 2. Hierarchy Check
            if (requester.role !== 'owner' && newRolePower >= requesterPower) {
                return res.status(403).json({ message: 'Insufficient permission (Hierarchy Violation)' });
            }
        }

        const ROLE_HIERARCHY = {
            'owner': 100,
            'admin': 5,
            'club_coordinator': 4,
            'club_head': 3,
            'core_member': 2,
            'club_member': 1,
            'student': 0
        };

        // Handle Coordinator Replacement
        if (role === 'club_coordinator') {
            const existingCoord = club.coreTeam.find(m => m.role === 'club_coordinator');
            if (existingCoord && existingCoord.userId !== userId) {
                existingCoord.role = 'core_member';
                // Only demote user if they don't have higher roles globally (simple check for now)
                const coordUser = await User.findById(existingCoord.userId);
                if (coordUser && (ROLE_HIERARCHY[coordUser.role] || 0) <= ROLE_HIERARCHY['club_coordinator']) {
                    coordUser.role = 'core_member';
                    await coordUser.save();
                }
            }
        }

        // Enforce Single Club Head
        if (role === 'club_head') {
            const existingHead = club.coreTeam.find(m => m.role === 'club_head' && m.userId !== userId);
            if (existingHead) {
                existingHead.role = 'core_member';
                existingHead.customTitle = 'Former Head';
                const headUser = await User.findById(existingHead.userId);
                if (headUser && (ROLE_HIERARCHY[headUser.role] || 0) <= ROLE_HIERARCHY['club_head']) {
                    headUser.role = 'core_member';
                    await headUser.save();
                }
            }
        }

        // Update User Role globally ONLY if the new role is higher than current OR current is basic
        const currentPower = ROLE_HIERARCHY[user.role] || 0;
        const newPower = ROLE_HIERARCHY[role] || 0;
        if (newPower > currentPower || currentPower <= 2) {
            user.role = role;
            await user.save();
        }

        // Update Club Core Team Array
        club.coreTeam = club.coreTeam.filter(m => m.userId !== userId);
        club.coreTeam.push({
            userId,
            name: user.name,
            role: role,
            customTitle: customTitle || ''
        });

        await club.save();

        // Trigger Auto-Sync
        await syncClubMetadata(club._id);

        res.json({ message: 'Core team updated', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REMOVE Core Team Member
router.delete('/:id/core-team/:userId', async (req, res) => {
    try {
        const User = require('../models/User');
        const club = await Club.findById(req.params.id);
        const user = await User.findById(req.params.userId);

        if (!club || !user) return res.status(404).json({ message: 'Club or User not found' });

        user.role = 'club_member';
        await user.save();

        club.coreTeam = club.coreTeam.filter(m => m.userId !== req.params.userId);
        await club.save();

        // Trigger Auto-Sync
        await syncClubMetadata(club._id);

        res.json({ message: 'Member demoted', club });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
