const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Club = require('./models/Club');

const debugUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} total users.`);

        users.forEach(u => {
            console.log(`User: ${u.name} (${u.email}) - joinedClubs: ${JSON.stringify(u.joinedClubs)}`);
        });

        const clubs = await Club.find({});
        clubs.forEach(c => {
            console.log(`Club: ${c.name} (${c._id}) - memberCount: ${c.memberCount}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugUsers();
