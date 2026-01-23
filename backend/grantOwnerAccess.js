const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const User = require('./models/User');

async function grantOwnerAccess() {
    try {
        const result = await User.updateOne(
            { email: 'testadmin@college.edu' },
            { $set: { role: 'owner' } }
        );

        console.log('Update result:', result);

        if (result.modifiedCount > 0) {
            console.log('✅ Successfully granted owner role to testadmin@college.edu');
        } else {
            console.log('⚠️  No user found or role already set');
        }

        // Verify the update
        const user = await User.findOne({ email: 'testadmin@college.edu' });
        console.log('Current user role:', user?.role);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

grantOwnerAccess();
