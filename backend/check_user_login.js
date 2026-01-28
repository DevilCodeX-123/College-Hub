const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const emailsToCheck = ['omgupta6325@gamil.com', 'omgupta6325@gmail.com']; // Check both typo and correct version

        for (const email of emailsToCheck) {
            const user = await User.findOne({ email });
            if (user) {
                console.log(`FOUND User: ${email}`);
                console.log(`ID: ${user._id}`);
                console.log(`Name: ${user.name}`);
                console.log(`Role: ${user.role}`);
            } else {
                console.log(`NOT FOUND: ${email}`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
