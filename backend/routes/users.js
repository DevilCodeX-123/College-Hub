const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');

router.get('/', async (req, res) => {
    try {
        const { college, requestingUserId } = req.query;
        let query = {};

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner') {
                // Force filter to requester's college bubble
                query.college = requester.college;
            } else if (!requester && !college) {
                // If no requester and no college filter, return none to be safe (except for owner who has no requesterId passed yet in some cases)
                // In a stricter system, always require a requester ID or token
            }
        }

        // Apply additional filter if provided (but restrained by bubble above)
        if (college && (!query.college || query.college === college)) {
            query.college = college;
        }

        const users = await User.find(query).populate('joinedClubs', 'name coreTeam coordinatorId');

        // Enrich users with their specific roles in each club
        const enrichedUsers = users.map(user => {
            const userObj = user.toObject();
            userObj.clubRoles = [];

            if (userObj.joinedClubs && userObj.joinedClubs.length > 0) {
                userObj.joinedClubs.forEach(club => {
                    const clubRole = {
                        clubId: club._id,
                        clubName: club.name,
                        role: 'club_member' // default
                    };

                    // Check if user is coordinator
                    if (club.coordinatorId === userObj._id.toString()) {
                        clubRole.role = 'club_coordinator';
                    } else if (club.coreTeam) {
                        // Check core team for specific role
                        const teamMember = club.coreTeam.find(m => m.userId === userObj._id.toString());
                        if (teamMember) {
                            clubRole.role = teamMember.role;
                            clubRole.customTitle = teamMember.customTitle;
                        }
                    }

                    userObj.clubRoles.push(clubRole);
                });
            }

            return userObj;
        });

        res.json(enrichedUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get total user count
// Get total and college-specific user count
router.get('/count', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const total = await User.countDocuments();
        let college = 0;

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.college) {
                college = await User.countDocuments({ college: requester.college });
            }
        }

        res.json({ total, college });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        const targetUser = await User.findById(req.params.id).populate('joinedClubs');
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (requester && requester.role !== 'owner' && requester.college !== targetUser.college) {
                return res.status(403).json({ message: 'Access Denied: User is in a different college bubble' });
            }
        }

        res.json(targetUser);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user profile, role or status
router.put('/:id', async (req, res) => {
    try {
        const { role, clubId, blocked, name, email, avatar, college, primaryGoal, secondaryGoal, skills, branch, year, customTitle, requestingUserId } = req.body;

        const ROLE_HIERARCHY = {
            'owner': 100,
            'admin': 10,
            'co_admin': 9,
            'club_coordinator': 8,
            'club_co_coordinator': 7,
            'club_head': 6,
            'core_member': 4,
            'student': 1
        };

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Authorization check
        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (!requester) return res.status(403).json({ message: 'Requester not found' });

            // 1. Hierarchy Check: Strictly LOWER power only (no same position)
            const requesterPower = ROLE_HIERARCHY[requester.role] || 0;
            const targetPower = ROLE_HIERARCHY[targetUser.role] || 0;

            if (requester.role !== 'owner' && requesterPower <= targetPower) {
                return res.status(403).json({ message: 'Insufficient permission to modify this user (Hierarchy Violation: Must be strictly higher)' });
            }

            // 2. Bubble Isolation
            if (requester.role !== 'owner' && requester.college !== targetUser.college) {
                return res.status(403).json({ message: 'Access Denied: User is in a different college bubble' });
            }

            // 3. Prevent assigning own role or higher
            if (role && requester.role !== 'owner') {
                const newRolePower = ROLE_HIERARCHY[role] || 0;
                if (newRolePower >= requesterPower) {
                    return res.status(403).json({ message: 'Cannot assign a role equal to or higher than your own' });
                }
            }
        }

        const updates = {};
        if (role) updates.role = role;
        if (blocked) updates.blocked = blocked;
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (avatar) updates.avatar = avatar;
        if (college) updates.college = college;
        if (primaryGoal) updates.primaryGoal = primaryGoal;
        if (secondaryGoal) updates.secondaryGoal = secondaryGoal;
        if (skills) updates.skills = skills;
        if (branch) updates.branch = branch;
        if (year) updates.year = year;
        if (customTitle) updates.customTitle = customTitle;

        // Contextual Update (Club)
        if (clubId && role) {
            const club = await Club.findById(clubId);
            if (club) {
                if (role === 'club_coordinator') {
                    club.coordinator = targetUser.name;
                    club.coordinatorId = targetUser.id;
                }

                // Add to core team if not already there
                const isAlreadyInTeam = club.coreTeam.some(m => m.userId === targetUser.id);
                if (!isAlreadyInTeam && (role === 'club_head' || role === 'core_member' || role === 'club_coordinator')) {
                    club.coreTeam.push({
                        userId: targetUser.id,
                        name: targetUser.name,
                        role: role,
                        customTitle: customTitle || ''
                    });
                } else if (isAlreadyInTeam) {
                    // Update existing role in team
                    const memberIndex = club.coreTeam.findIndex(m => m.userId === targetUser.id);
                    club.coreTeam[memberIndex].role = role;
                }
                await club.save();
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user status (block/unblock)
router.put('/:id/status', async (req, res) => {
    try {
        const { website, clubs, challenges } = req.body;
        const updates = {};
        if (typeof website === 'boolean') updates['blocked.website'] = website;
        if (typeof clubs === 'boolean') updates['blocked.clubs'] = clubs;
        if (typeof challenges === 'boolean') updates['blocked.challenges'] = challenges;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    const user = new User(req.body);
    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Award Badge
router.post('/:id/award-badge', async (req, res) => {
    try {
        const { name, icon, description, earnedAt } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.badges.push({ name, icon, description, earnedAt: earnedAt || new Date() });
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Award Badge Batch
router.post('/award-badge/batch', async (req, res) => {
    try {
        const { userIds, badge } = req.body; // badge: { name, icon, description, earnedAt }
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ message: 'userIds array is required' });
        }

        const badgeData = {
            ...badge,
            earnedAt: badge.earnedAt || new Date()
        };

        await User.updateMany(
            { _id: { $in: userIds } },
            { $push: { badges: badgeData } }
        );

        res.json({ success: true, message: `Badge awarded to ${userIds.length} users` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Award Skill
router.post('/:id/add-skill', async (req, res) => {
    try {
        const { skill } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.skills.includes(skill)) {
            user.skills.push(skill);
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Manual Weekly Reset Trigger (for testing/admin use)
router.post('/weekly-reset', async (req, res) => {
    try {
        const { requestingUserId } = req.body;

        // Only allow admin or owner to trigger manual reset
        if (requestingUserId) {
            const requester = await User.findById(requestingUserId);
            if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
                return res.status(403).json({ message: 'Only admins and owners can trigger weekly reset' });
            }
        }

        console.log('[Manual Weekly Reset] Starting...');
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);

        // Award CLUB-SPECIFIC badges to Top 3 in each club
        const clubs = await Club.find();
        let badgesAwarded = 0;

        for (const club of clubs) {
            const clubMembers = await User.find({ joinedClubs: club._id })
                .sort({ weeklyXP: -1 })
                .limit(3);

            for (let i = 0; i < clubMembers.length; i++) {
                const member = clubMembers[i];
                const rank = i + 1;

                if (member.weeklyXP && member.weeklyXP > 0) {
                    member.clubWeeklyBadges = member.clubWeeklyBadges || [];
                    member.clubWeeklyBadges.push({
                        clubId: club._id,
                        clubName: club.name,
                        rank: rank,
                        weekStart: weekStart,
                        earnedAt: new Date()
                    });
                    await member.save();
                    badgesAwarded++;
                }
            }
        }

        // Reset weeklyXP for all users
        const resetResult = await User.updateMany({}, { weeklyXP: 0 });

        res.json({
            success: true,
            message: 'Weekly reset completed',
            badgesAwarded,
            usersReset: resetResult.modifiedCount
        });
    } catch (err) {
        console.error('[Manual Weekly Reset] Error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
