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
        const { college, clubId } = req.query;
        let query = {};
        if (college) {
            const cleanCollege = college.trim();
            const collegeName = cleanCollege.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
        }
        if (clubId) {
            query.clubId = clubId;
        }
        const events = await Event.find(query).sort({ date: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE an event
router.post('/', async (req, res) => {
    if (req.body.college) req.body.college = req.body.college.trim();

    // Future Date Enforcement (only for upcoming announcements)
    if (req.body.date && !req.body.isCompleted) {
        const eventDate = new Date(req.body.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
            return res.status(400).json({ message: 'Event date cannot be in the past' });
        }
    }

    const event = new Event({ ...req.body, xpReward: 100 });
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
        console.log('Registering Event Body:', req.body);
        const { userId, name, email, program, comments, registrationType, teamMembers, paymentProofUrl, transactionId } = req.body;
        const event = await Event.findById(req.params.id);
        const user = await User.findById(userId);

        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.stopRegistration) {
            return res.status(400).json({ message: 'Registration for this event is closed' });
        }

        if (event.isCompleted) {
            return res.status(400).json({ message: 'This event has already been completed' });
        }

        // Check if payment is required
        const isPaymentRequired = event.paymentQRCode && (
            (registrationType === 'individual' && event.paymentAmountIndividual) ||
            (registrationType === 'team' && event.paymentAmountTeam)
        );

        if (isPaymentRequired && (!paymentProofUrl || !transactionId)) {
            return res.status(400).json({ message: 'Payment proof and transaction ID are required for this event' });
        }

        // Check if already registered for THIS type (allow both individual AND team)
        const existing = event.registrations.find(r => r.userId === userId && r.registrationType === registrationType);
        if (existing) {
            return res.status(400).json({ message: `Already registered as ${registrationType} for this event` });
        }

        // Add to registrations
        event.registrations.push({
            userId,
            name,
            email,
            program,
            comments,
            registrationType: registrationType || 'individual',
            teamMembers: teamMembers || [],
            paymentProofUrl: paymentProofUrl || '',
            transactionId: transactionId || ''
        });

        // Add to user activity
        if (user) {
            user.activity.push({
                type: 'event',
                refId: event._id,
                title: event.title,
                status: 'registered',
                timestamp: new Date()
            });
            await user.save();
        }

        await event.save();

        res.json({ message: 'Registration successful', event });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// EDIT registration (only if registrations are open)
router.put('/:id/registration/:userId', async (req, res) => {
    try {
        const { registrationType, program, comments, teamMembers, paymentProofUrl, transactionId } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.stopRegistration) return res.status(400).json({ message: 'Registrations are closed. Editing is disabled.' });
        if (event.isCompleted) return res.status(400).json({ message: 'Event is completed. Editing is disabled.' });

        const regIndex = event.registrations.findIndex(r =>
            r.userId === req.params.userId && r.registrationType === registrationType
        );

        if (regIndex === -1) return res.status(404).json({ message: 'Registration not found' });

        // Update allowed fields
        if (program !== undefined) event.registrations[regIndex].program = program;
        if (comments !== undefined) event.registrations[regIndex].comments = comments;
        if (teamMembers !== undefined) event.registrations[regIndex].teamMembers = teamMembers;
        if (paymentProofUrl !== undefined) event.registrations[regIndex].paymentProofUrl = paymentProofUrl;
        if (transactionId !== undefined) event.registrations[regIndex].transactionId = transactionId;

        await event.save();
        res.json({ message: 'Registration updated', event });
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

        // REWARD DELAYED: Moved to complete block
        res.json({ message: 'Attendance marked! XP will be awarded when the event is completed.', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// COMPLETE an event
router.post('/:id/complete', async (req, res) => {
    try {
        const { reportData, coordinatorId } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        const club = await Club.findById(event.clubId);
        if (event.isCompleted) return res.status(400).json({ message: 'Event already completed' });

        event.isCompleted = true;
        event.stopRegistration = true;

        if (reportData) {
            if (reportData.title) event.title = reportData.title;
            if (reportData.date) event.date = reportData.date;
            if (reportData.description) event.description = reportData.description;
            if (reportData.location) event.location = reportData.location;
            if (reportData.type) event.type = reportData.type;
            if (reportData.coverImage) event.coverImage = reportData.coverImage;
            if (reportData.highlightsLink) event.highlightsLink = reportData.highlightsLink;
            if (reportData.driveLink) event.driveLink = reportData.driveLink;
            if (reportData.duration) event.duration = reportData.duration;
            if (reportData.scope) event.scope = reportData.scope;
            if (reportData.organizingClub) event.organizingClub = reportData.organizingClub;
            if (reportData.collaboratingClubs) event.collaboratingClubs = reportData.collaboratingClubs;
            if (reportData.chiefGuests) event.chiefGuests = reportData.chiefGuests;
            if (reportData.competitions) event.competitions = reportData.competitions;
            if (reportData.winners) event.winners = reportData.winners;
        }

        await event.save();

        // Check if event was unannounced/direct report
        // Logic: If event creation is very close to now (e.g. < 5 mins) OR no registrations exist
        // This implies it wasn't announced ahead of time for students to register.
        const isUnannounced = (Date.now() - new Date(event.createdAt).getTime() < 5 * 60 * 1000) || !event.registrations || event.registrations.length === 0;

        // Force participant count if registrations exist (Announced Event)
        let finalParticipantCount = (event.registrations?.length || 0);
        if (isUnannounced && (!event.registrations || event.registrations.length === 0)) {
            // If unannounced, trust the input manual count (but apply penalty later)
            finalParticipantCount = (event.registrations?.length || 0) + (parseInt(reportData?.participantCount) || 0);
        }

        const guestPoints = (event.chiefGuests?.length || 0) * 15;
        const compPoints = (event.competitions?.length || 0) * 25;
        const participantPoints = finalParticipantCount * 10;
        let totalCalculatedPoints = guestPoints + compPoints + participantPoints;

        // Apply 50% Penalty for Direct/Unannounced Reports
        if (isUnannounced) {
            totalCalculatedPoints = Math.round(totalCalculatedPoints * 0.5);
        }

        if (club) {
            club.points = (club.points || 0) + totalCalculatedPoints;
            club.monthlyPoints = (club.monthlyPoints || 0) + totalCalculatedPoints;

            club.pointsHistory.push({
                amount: totalCalculatedPoints,
                reason: `Organized event: ${event.title}`,
                sourceId: event._id,
                sourceType: 'event',
                timestamp: new Date()
            });

            if (event.collaboratingClubs?.length > 0) {
                const partnerReward = Math.round(totalCalculatedPoints * 0.75);
                await Club.updateMany(
                    { name: { $in: event.collaboratingClubs } },
                    { $inc: { points: partnerReward, monthlyPoints: partnerReward } }
                );
            }

            // Award Attendance XP to all registrants
            // INDIVIDUAL: 100 XP to leader
            // TEAM: 100 XP to leader AND 100 XP to each team member
            const attendees = event.registrations || [];
            for (const attendee of attendees) {
                const isTeam = attendee.teamMembers && attendee.teamMembers.length > 0;

                // Award to leader
                const student = await User.findById(attendee.userId);
                if (student) {
                    const attendanceXP = 100;
                    student.points = (student.points || 0) + attendanceXP;
                    student.totalEarnedXP = (student.totalEarnedXP || 0) + attendanceXP;
                    student.weeklyXP = (student.weeklyXP || 0) + attendanceXP;
                    student.level = calculateLevelFromXP(student.totalEarnedXP);

                    student.pointsHistory.push({
                        amount: attendanceXP,
                        reason: `Attended event: ${event.title}`,
                        sourceId: event._id,
                        sourceType: 'event',
                        timestamp: new Date()
                    });

                    await student.save();
                }

                // If TEAM registration, also award to all team members
                if (isTeam) {
                    for (const tm of attendee.teamMembers) {
                        const teamStudent = await User.findOne({ email: tm.email });
                        if (teamStudent) {
                            const attendanceXP = 100;
                            teamStudent.points = (teamStudent.points || 0) + attendanceXP;
                            teamStudent.totalEarnedXP = (teamStudent.totalEarnedXP || 0) + attendanceXP;
                            teamStudent.weeklyXP = (teamStudent.weeklyXP || 0) + attendanceXP;
                            teamStudent.level = calculateLevelFromXP(teamStudent.totalEarnedXP);

                            teamStudent.pointsHistory.push({
                                amount: attendanceXP,
                                reason: `Attended event as team member: ${event.title}`,
                                sourceId: event._id,
                                sourceType: 'event',
                                timestamp: new Date()
                            });

                            await teamStudent.save();
                        }
                    }
                }
            }

            // Award XP to Winners
            // INDIVIDUAL: Full XP to winner
            // TEAM: Full XP to winner AND each team member
            if (event.winners?.length > 0) {
                for (const winner of event.winners) {
                    const winnerXP = winner.position === '1st' || winner.position === '1' ? 50 : (winner.position === '2nd' || winner.position === '2' ? 40 : 25);

                    // Find winner's registration to check if team or individual
                    const winnerRegistration = attendees.find(r => r.name === winner.name);
                    const isTeamWinner = winnerRegistration && winnerRegistration.teamMembers && winnerRegistration.teamMembers.length > 0;

                    // Award to winner (leader)
                    const winnerStudent = await User.findOne({ name: winner.name, college: event.college });
                    if (winnerStudent) {
                        winnerStudent.points = (winnerStudent.points || 0) + winnerXP;
                        winnerStudent.totalEarnedXP = (winnerStudent.totalEarnedXP || 0) + winnerXP;
                        winnerStudent.weeklyXP = (winnerStudent.weeklyXP || 0) + winnerXP;
                        winnerStudent.level = calculateLevelFromXP(winnerStudent.totalEarnedXP);

                        winnerStudent.pointsHistory.push({
                            amount: winnerXP,
                            reason: `Won ${winner.position} place in event: ${event.title}`,
                            sourceId: event._id,
                            sourceType: 'event',
                            timestamp: new Date()
                        });

                        await winnerStudent.save();
                    }

                    // If TEAM winner, also award to all team members
                    if (isTeamWinner) {
                        for (const tm of winnerRegistration.teamMembers) {
                            const teamStudent = await User.findOne({ email: tm.email });
                            if (teamStudent) {
                                teamStudent.points = (teamStudent.points || 0) + winnerXP;
                                teamStudent.totalEarnedXP = (teamStudent.totalEarnedXP || 0) + winnerXP;
                                teamStudent.weeklyXP = (teamStudent.weeklyXP || 0) + winnerXP;
                                teamStudent.level = calculateLevelFromXP(teamStudent.totalEarnedXP);

                                teamStudent.pointsHistory.push({
                                    amount: winnerXP,
                                    reason: `Won ${winner.position} place (team) in event: ${event.title}`,
                                    sourceId: event._id,
                                    sourceType: 'event',
                                    timestamp: new Date()
                                });

                                await teamStudent.save();
                            }
                        }
                    }
                }
            }

            club.history.push({ ...reportData, type: 'event', date: event.date, title: event.title, _id: event._id.toString() });
            await club.save();
        }

        const ratingPoll = new Poll({
            question: `How would you rate the event: ${event.title}?`,
            options: [{ text: '1 Star ⭐', votes: 0 }, { text: '2 Stars ⭐⭐', votes: 0 }, { text: '3 Stars ⭐⭐⭐', votes: 0 }, { text: '4 Stars ⭐⭐⭐⭐', votes: 0 }, { text: '5 Stars ⭐⭐⭐⭐⭐', votes: 0 }],
            createdBy: coordinatorId,
            targetRoles: ['all'],
            college: club?.college || null,
            clubId: event.clubId,
            eventId: event._id,
            isRatingPoll: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await ratingPoll.save();

        res.json({ message: 'Event completed and point rules applied.', event, awardedPoints: totalCalculatedPoints });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE an event
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // REVOKE POINTS ON DELETION
        if (event.isCompleted) {
            // 1. Revoke Club Points
            const guestPoints = (event.chiefGuests?.length || 0) * 15;
            const compPoints = (event.competitions?.length || 0) * 25;
            const participantPoints = (event.registrations?.length || 0) * 10;
            const totalToDeduct = guestPoints + compPoints + participantPoints;

            const club = await Club.findById(event.clubId);
            if (club) {
                club.points = Math.max(0, (club.points || 0) - totalToDeduct);
                club.monthlyPoints = Math.max(0, (club.monthlyPoints || 0) - totalToDeduct);

                club.pointsHistory.push({
                    amount: -totalToDeduct,
                    reason: `Revoked: Event "${event.title}" was deleted`,
                    sourceId: event._id,
                    sourceType: 'event',
                    timestamp: new Date()
                });

                await club.save();
            }

            // 2. Revoke Partner Shares
            if (event.collaboratingClubs?.length > 0) {
                const partnerDeduction = Math.round(totalToDeduct * 0.75);
                await Club.updateMany(
                    { name: { $in: event.collaboratingClubs } },
                    { $inc: { points: -partnerDeduction, monthlyPoints: -partnerDeduction } }
                );
            }

            // 3. Revoke Registrant Attendance XP (100)
            const attendees = event.registrations || [];
            for (const attendee of attendees) {
                const student = await User.findById(attendee.userId);
                if (student) {
                    student.points = Math.max(0, (student.points || 0) - 100);
                    student.totalEarnedXP = Math.max(0, (student.totalEarnedXP || 0) - 100);
                    student.level = calculateLevelFromXP(student.totalEarnedXP);

                    student.pointsHistory.push({
                        amount: -100,
                        reason: `Revoked: Attendance for "${event.title}" (event deleted)`,
                        sourceId: event._id,
                        sourceType: 'event',
                        timestamp: new Date()
                    });

                    await student.save();
                }
            }

            // 4. Revoke Winner XP
            if (event.winners?.length > 0) {
                for (const winner of event.winners) {
                    const winnerXP = winner.position === '1st' || winner.position === '1' ? 50 : (winner.position === '2nd' || winner.position === '2' ? 40 : 25);
                    const student = await User.findOne({ name: winner.name, college: event.college });
                    if (student) {
                        student.points = Math.max(0, (student.points || 0) - winnerXP);
                        student.totalEarnedXP = Math.max(0, (student.totalEarnedXP || 0) - winnerXP);
                        student.level = calculateLevelFromXP(student.totalEarnedXP);
                        await student.save();
                    }
                }
            }

            // ❌ 5. Revoke Rating Poll Points from Club
            const poll = await Poll.findOne({ eventId: req.params.id, isRatingPoll: true });
            if (poll && club) {
                let totalPollPts = 0;
                poll.options.forEach(opt => {
                    const stars = parseInt(opt.text.match(/(\d+)/)?.[1] || 0);
                    totalPollPts += (stars * (opt.votes || 0));
                });
                if (totalPollPts > 0) {
                    club.points = Math.max(0, club.points - totalPollPts);
                    club.monthlyPoints = Math.max(0, club.monthlyPoints - totalPollPts);

                    club.pointsHistory.push({
                        amount: -totalPollPts,
                        reason: `Revoked: Rating poll points for deleted event "${event.title}"`,
                        sourceId: event._id,
                        sourceType: 'bonus',
                        timestamp: new Date()
                    });

                    await club.save();
                }
            }
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted and associated points revoked.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
