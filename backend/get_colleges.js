const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://devilkk8800:devilkk8800@cluster0.wrxge6j.mongodb.net/college-chronicle')
    .then(async () => {
        const colleges = await User.aggregate([
            { $group: { _id: '$college', roles: { $addToSet: '$role' } } }
        ]);
        console.log(JSON.stringify(colleges, null, 2));
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
