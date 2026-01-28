const mongoose = require('mongoose');
const Project = require('./models/Project');
const crypto = require('crypto');
require('dotenv').config();

async function backfillJoinCodes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const projects = await Project.find({
            status: { $in: ['in_progress', 'completed', 'on_hold'] },
            joinCode: { $exists: false }
        });

        console.log(`Found ${projects.length} projects needing codes.`);

        for (const project of projects) {
            let joinCode;
            let codeExists = true;

            // Generate unique code
            while (codeExists) {
                joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
                const existing = await Project.findOne({ joinCode });
                if (!existing) codeExists = false;
            }

            project.joinCode = joinCode;
            await project.save();
            console.log(`Assigned code ${joinCode} to project: ${project.title}`);
        }

        console.log('Backfill complete.');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

backfillJoinCodes();
