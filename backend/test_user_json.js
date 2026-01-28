const axios = require('axios');

async function testApi() {
    try {
        const userId = '67949666c0d8768a88db6fff'; // Based on previous interactions, need to find the actual ID
        // Actually I'll find the ID from the database first
        const mongoose = require('mongoose');
        require('dotenv').config();
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('./models/User');
        const user = await User.findOne({ name: /devil/i });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('API representation of user badges:');
        console.log(JSON.stringify(user.toJSON().badges, null, 2));

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

testApi();
