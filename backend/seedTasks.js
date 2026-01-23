const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Task = require('./models/Task');
const connectDB = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });
connectDB();

const seedTasks = async () => {
    try {
        await Task.deleteMany({ category: 'daily' });

        const tasks = [
            {
                title: 'Daily Coding Practice',
                description: 'Solve at least one problem on LeetCode or similar platform.',
                category: 'daily',
                isPermanent: true,
                status: 'active'
            },
            {
                title: 'Tech Update',
                description: 'Share a recent tech news in the Tech Innovators club chat.',
                category: 'club',
                clubId: '1',
                clubName: 'Tech Innovators Club',
                isPermanent: true,
                status: 'active'
            },
            {
                title: 'Club Participation',
                description: 'Post an update or interact in your club chat.',
                category: 'daily',
                isPermanent: true,
                status: 'active'
            },
            {
                title: 'Skill Development',
                description: 'Spend 30 minutes learning a new technology or skill.',
                category: 'daily',
                isPermanent: true,
                status: 'active'
            }
        ];

        await Task.insertMany(tasks);
        console.log('Daily tasks seeded successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedTasks();
