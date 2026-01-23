const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./models/Project');
const Club = require('./models/Club');
const User = require('./models/User');

const seedTestProject = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const club = await Club.findOne();
        if (!club) throw new Error('No club found');

        const users = await User.find();
        if (users.length === 0) throw new Error('No users found');

        const coordinator = users.find(u => u.role === 'club_coordinator' || u.role === 'owner') || users[0];
        const teamIds = users.slice(0, 5).map(u => u.id || u._id.toString());

        const testProject = new Project({
            title: "Global Student Connect",
            description: "A platform to connect students across different campuses for collaborative learning and project sharing.",
            type: "Web Development",
            memberLimit: 10,
            problemStatement: "Students often lack a centralized way to find teammates from other departments or colleges.",
            idea: "Built with React and Node.js, this app will feature real-time chat and skill-based matching.",
            requestedBy: coordinator.id || coordinator._id.toString(),
            clubId: club.id || club._id.toString(),
            clubName: club.name,
            progress: 65,
            team: teamIds,
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: "in_progress"
        });

        await testProject.save();
        console.log('Test project seeded successfully:', testProject.title);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding test project:', err);
        process.exit(1);
    }
};

seedTestProject();
