require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Challenge = require('./models/Challenge');
const Project = require('./models/Project');
const Event = require('./models/Event');
const Club = require('./models/Club');

const MONGODB_URI = process.env.MONGO_URI;

async function backfillActivity() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ name: /devil/i });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Backfilling activity for ${user.name}`);
        const userId = user._id.toString();

        // 1. Find Challenges
        const challenges = await Challenge.find({
            $or: [
                { 'submissions.userId': userId },
                { participants: { $gt: 0 } } // Broad check, we'll refine
            ]
        });

        for (const ch of challenges) {
            const isParticipant = ch.participants > 0; // Simplified
            const hasSubmission = ch.submissions.some(s => s.userId === userId);

            const existingActivity = user.activity.find(a => a.refId && a.refId.toString() === ch._id.toString());

            if (!existingActivity) {
                user.activity.push({
                    type: 'challenge',
                    refId: ch._id,
                    title: ch.title,
                    status: hasSubmission ? 'completed' : 'started',
                    timestamp: ch.createdAt || new Date()
                });
                console.log(`Added challenge activity: ${ch.title}`);
            }
        }

        // 2. Find Projects
        const projects = await Project.find({ team: userId });
        for (const p of projects) {
            const existingActivity = user.activity.find(a => a.refId && a.refId.toString() === p._id.toString());
            if (!existingActivity) {
                user.activity.push({
                    type: 'project',
                    refId: p._id,
                    title: p.title,
                    status: p.status === 'completed' ? 'completed' : 'joined team',
                    timestamp: p.createdAt || new Date()
                });
                console.log(`Added project activity: ${p.title}`);
            }
        }

        // 3. Find Events
        const events = await Event.find({ 'registrations.userId': userId });
        for (const e of events) {
            const existingActivity = user.activity.find(a => a.refId && a.refId.toString() === e._id.toString());
            if (!existingActivity) {
                user.activity.push({
                    type: 'event',
                    refId: e._id,
                    title: e.title,
                    status: 'registered',
                    timestamp: e.date || new Date()
                });
                console.log(`Added event activity: ${e.title}`);
            }
        }

        // 4. Find Clubs
        const clubsIds = user.joinedClubs || [];
        for (const clubId of clubsIds) {
            const club = await Club.findById(clubId);
            if (club) {
                const existingActivity = user.activity.find(a => a.refId && a.refId.toString() === club._id.toString());
                if (!existingActivity) {
                    user.activity.push({
                        type: 'club',
                        refId: club._id,
                        title: club.name,
                        status: 'joined',
                        timestamp: new Date()
                    });
                    console.log(`Added club activity: ${club.name}`);
                }
            }
        }

        await user.save();
        console.log('✅ Backfill complete');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

backfillActivity();
