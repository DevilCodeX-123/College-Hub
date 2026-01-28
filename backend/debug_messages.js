const mongoose = require('mongoose');
const Message = require('./models/Message');
const dotenv = require('dotenv');

dotenv.config();

const checkMessages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find recent recruitment messages
        const msgs = await Message.find({ type: 'recruitment' }).sort({ createdAt: -1 }).limit(5);

        console.log(`Found ${msgs.length} recruitment messages.`);
        msgs.forEach(m => {
            console.log(`ID: ${m._id}, Project: ${m.projectId}, JoinRequest: ${m.joinRequestId}, Status: ${m.requestStatus}, Content: ${m.content.substring(0, 50)}...`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkMessages();
