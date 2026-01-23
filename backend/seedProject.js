const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./models/Project');
const User = require('./models/User');
const Club = require('./models/Club');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        const user = await User.findOne({ role: 'student' }) || await User.findOne();
        const club = await Club.findOne();

        if (!user || !club) {
            console.error('Core data missing (User or Club)');
            process.exit(1);
        }

        const testProject = new Project({
            title: 'Testing Project Alpha',
            description: 'A dedicated project to test the new chat and privacy features.',
            type: 'Web Application',
            memberLimit: 5,
            problemStatement: 'Students need a way to verify project-specific chat systems.',
            idea: 'Implement a dedicated real-time chat room for every project team.',
            requestedBy: user._id,
            clubId: club._id,
            clubName: club.name,
            status: 'in_progress',
            joinCode: 'TEST25',
            team: [user._id],
            progress: 35
        });

        await Project.deleteOne({ joinCode: 'TEST25' }); // Clean up if exists
        await testProject.save();

        console.log('Test Project Created!');
        console.log('Title:', testProject.title);
        console.log('Join Code:', testProject.joinCode);
        console.log('Creator:', user.name);

        process.exit(0);
    } catch (err) {
        console.error('Error seeding project:', err);
        process.exit(1);
    }
}

seed();
