const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');
const Club = require('./models/Club');
require('dotenv').config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const query = {};
        console.log('Running Project.find(query)...');
        let projects = await Project.find(query).sort({ createdAt: -1 }).populate('team', 'name email').lean();
        console.log(`Found ${projects.length} projects`);

        projects.forEach((p, idx) => {
            try {
                const teamArray = Array.isArray(p.team) ? p.team : [];
                const requestingUserId = undefined; // Test with undefined
                const isAdminUser = false;

                const isTeamMember = teamArray.some(m => m && m._id && m._id.toString() === requestingUserId) || p.requestedBy === requestingUserId;
                const isAdmin = requestingUserId && isAdminUser;

                if (!isTeamMember) {
                    const masked = { ...p };
                    delete masked.joinCode;
                    delete masked.timeGoals;
                    delete masked.resources;
                    masked.team = (masked.team || []).map((m, i) => ({ _id: 'hidden', name: `Member ${i + 1}` }));
                }
            } catch (err) {
                console.error(`Error processing project at index ${idx}:`, err);
                console.error('Project data:', JSON.stringify(p, null, 2));
                throw err;
            }
        });

        console.log('All projects processed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Debug script failed:', err);
        process.exit(1);
    }
}

debug();
