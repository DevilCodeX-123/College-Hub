const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const promoteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOneAndUpdate(
            { email: 'admin@college.edu' },
            { role: 'owner' },
            { new: true }
        );

        if (user) {
            console.log(`Successfully promoted ${user.email} to ${user.role}`);
        } else {
            console.log('User not found');
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

promoteUser();
