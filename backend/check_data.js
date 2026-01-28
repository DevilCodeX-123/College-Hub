const mongoose = require('mongoose');
const Project = require('./models/Project');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const projects = await Project.find({}).lean();
        console.log(`Checking ${projects.length} projects...`);

        for (const p of projects) {
            console.log(`Project: ${p.title} (${p._id})`);
            if (!Array.isArray(p.team)) {
                console.error(`  - Team is not an array: ${typeof p.team}`);
                continue;
            }
            for (const memberId of p.team) {
                if (!memberId) {
                    console.error(`  - Null member ID found!`);
                    continue;
                }
                const idString = memberId.toString();
                if (!idString.match(/^[0-9a-fA-F]{24}$/)) {
                    console.error(`  - INVALID Member ID Format: "${idString}"`);
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
