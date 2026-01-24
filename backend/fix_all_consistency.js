const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Club = require('./models/Club');
const User = require('./models/User');
const Challenge = require('./models/Challenge');
const Event = require('./models/Event');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Poll = require('./models/Poll');
const Note = require('./models/Note');
const CampusLocation = require('./models/CampusLocation');

const normalize = (str) => (str ? str.trim() : null);

const fixConsistency = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fix Users
        const users = await User.find({});
        for (const u of users) {
            const clean = normalize(u.college);
            if (u.college !== clean) {
                u.college = clean;
                await u.save();
                console.log(`Normalized User College: ${u.name}`);
            }
        }

        // 2. Fix Clubs
        const clubs = await Club.find({});
        for (const c of clubs) {
            const clean = normalize(c.college);
            if (c.college !== clean) {
                c.college = clean;
                await c.save();
                console.log(`Normalized Club College: ${c.name}`);
            }
        }

        // 3. Fix Challenges (Ensure college exists)
        const challenges = await Challenge.find({});
        for (const ch of challenges) {
            const clean = normalize(ch.college);
            if (!ch.college || ch.college !== clean) {
                if (!clean && ch.clubId) {
                    const club = await Club.findById(ch.clubId);
                    if (club) ch.college = normalize(club.college);
                } else {
                    ch.college = clean;
                }
                await ch.save();
                console.log(`Normalized/Backfilled Challenge: ${ch.title}`);
            }
        }

        // 4. Fix Tasks (ENSURE COLLEGE EXISTS - IMPORTANT)
        const tasks = await Task.find({});
        for (const t of tasks) {
            const clean = normalize(t.college);
            if (!t.college || t.college !== clean) {
                if (!clean && t.clubId) {
                    const club = await Club.findById(t.clubId);
                    if (club) t.college = normalize(club.college);
                } else {
                    t.college = clean;
                }
                await t.save();
                console.log(`Normalized/Backfilled Task: ${t.title}`);
            }
        }

        // 5. Fix Events, Projects, Polls, Notes, Locations
        const models = [
            { name: 'Event', m: Event, titleField: 'title' },
            { name: 'Project', m: Project, titleField: 'title' },
            { name: 'Poll', m: Poll, titleField: 'question' },
            { name: 'Note', m: Note, titleField: 'title' },
            { name: 'CampusLocation', m: CampusLocation, titleField: 'name' }
        ];

        for (const { name, m, titleField } of models) {
            const docs = await m.find({});
            for (const doc of docs) {
                const clean = normalize(doc.college);
                if (doc.college !== clean) {
                    doc.college = clean;
                    await doc.save();
                    console.log(`Normalized ${name} College: ${doc[titleField]}`);
                }
            }
        }

        console.log('Master Consistency Fix Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixConsistency();
