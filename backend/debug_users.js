const mongoose = require('mongoose');
require('dotenv').config();
require('./models/User');
require('./models/Club');
require('./models/Challenge');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const challenges = await mongoose.model('Challenge').find({});
        console.log('Challenges:', challenges.map(c => ({
            title: c.title,
            club: c.clubName,
            college: c.college, // Check if this is undefined 
            status: c.status
        })));

        const clubs = await mongoose.model('Club').find({}, 'name college');
        console.log('Club Details:', clubs.map(c => ({ name: c.name, college: c.college })));

        const club = await mongoose.model('Club').findOne();
        console.log('Club:', JSON.stringify(club, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
