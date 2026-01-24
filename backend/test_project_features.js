const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Project = require('./models/Project');

const testFeatures = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find a project to test with
        const project = await Project.findOne({});
        if (!project) {
            console.log('No project found to test. Please create one first.');
            process.exit(0);
        }
        console.log(`Testing with project: ${project.title} (${project._id})`);

        const leaderId = project.requestedBy;
        const memberId = project.team[0] || leaderId;

        // 2. Test Progress Update
        console.log('Testing Progress Update...');
        project.progress = 45;
        await project.save();
        console.log(' - Progress updated to 45%');

        // 3. Test Add Goal
        console.log('Testing Add Goal...');
        project.timeGoals.push({
            title: 'Test Goal',
            deadline: new Date(Date.now() + 86400000)
        });
        await project.save();
        console.log(' - Goal added.');

        // 4. Test Update Goal
        console.log('Testing Goal Status Update...');
        project.timeGoals[project.timeGoals.length - 1].status = 'completed';
        await project.save();
        console.log(' - Goal marked as completed.');

        // 5. Test Add Resource
        console.log('Testing Add Resource...');
        project.resources.push({
            title: 'Design File',
            url: 'https://figma.com/test',
            addedBy: leaderId,
            addedByName: 'Test Admin'
        });
        await project.save();
        console.log(' - Resource added.');

        console.log('Verification Complete: All Database operations for new features are matching schema expectations.');
        process.exit(0);
    } catch (err) {
        console.error('Verification Failed:', err);
        process.exit(1);
    }
};

testFeatures();
