const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createOwnerAccount = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if owner already exists
        const existingOwner = await User.findOne({ role: 'owner' });
        if (existingOwner) {
            console.log('Owner account already exists:');
            console.log('Email:', existingOwner.email);
            console.log('Name:', existingOwner.name);
            process.exit(0);
        }

        // Create owner account
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('owner123', salt);

        const owner = new User({
            name: 'Platform Owner',
            email: 'owner@campushub.com',
            password: hashedPassword,
            role: 'owner',
            college: 'Platform Administration',
            points: 99999,
            totalEarnedXP: 99999,
            level: 100
        });

        await owner.save();

        console.log('✅ Owner account created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: owner@campushub.com');
        console.log('🔑 Password: owner123');
        console.log('👑 Role: owner');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating owner account:', error);
        process.exit(1);
    }
};

createOwnerAccount();
