const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');
require('dotenv').config();

async function debug() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}).limit(5).lean();
        console.log(`Found ${users.length} users to test with`);

        for (const testUser of users) {
            console.log(`\n--- Testing with user: ${testUser.name} (${testUser._id}) ---`);
            const requestingUserId = testUser._id.toString();

            // Mimic projects.js query construction
            let query = {};
            if (requestingUserId && requestingUserId.match(/^[0-9a-fA-F]{24}$/)) {
                const requester = await User.findById(requestingUserId);
                if (requester && requester.role !== 'owner') {
                    if (requester.college) {
                        const collegeName = requester.college.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        query.college = { $regex: new RegExp(`^\\s*${collegeName}\\s*$`, 'i') };
                    }
                }
            }

            console.log('Query:', JSON.stringify(query));
            let projects = await Project.find(query).sort({ createdAt: -1 }).populate('team', 'name email').lean();
            console.log(`Found ${projects.length} projects`);

            projects.forEach((p, idx) => {
                try {
                    const teamArray = Array.isArray(p.team) ? p.team : [];
                    const isTeamMember = teamArray.some(m => m && m._id && m._id.toString() === requestingUserId) || p.requestedBy === requestingUserId;
                    const isAdmin = false; // Simplified

                    if (!isTeamMember) {
                        teamArray.map((m, i) => {
                            if (!m) return { _id: 'hidden', name: `Deleted Member ${i + 1}` };
                            return { _id: 'hidden', name: `Member ${i + 1}` };
                        });
                    }
                    // console.log(`  - Project ${idx} passed`);
                } catch (err) {
                    console.error(`!!!! CRASH on project ${idx}:`, err.message);
                }
            });
        }

        console.log('\n--- Testing with NO user ---');
        let emptyQuery = {};
        let projects = await Project.find(emptyQuery).sort({ createdAt: -1 }).populate('team', 'name email').lean();
        projects.forEach((p, idx) => {
            try {
                const teamArray = Array.isArray(p.team) ? p.team : [];
                const isTeamMember = false;
                if (!isTeamMember) {
                    teamArray.map((m, i) => ({ _id: 'hidden', name: `Member ${i + 1}` }));
                }
            } catch (err) {
                console.error(`!!!! CRASH on project ${idx} (no user):`, err.message);
            }
        });

        console.log('\nDone.');
        process.exit(0);
    } catch (err) {
        console.error('Debug script failed FATALLY:', err);
        process.exit(1);
    }
}

debug();
