const mongoose = require('mongoose');
require('dotenv').config();
require('./models/User');
require('./models/Club');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const roles = await mongoose.model('User').aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
        console.log('Roles:', JSON.stringify(roles, null, 2));

        const club = await mongoose.model('Club').findOne();
        console.log('Club:', JSON.stringify(club, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
