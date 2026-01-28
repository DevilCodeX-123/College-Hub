const mongoose = require('mongoose');
const Project = require('./models/Project');
const Message = require('./models/Message');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const verifyRequests = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find projects with join requests
        const projects = await Project.find({ 'joinRequests.0': { $exists: true } }).limit(5);

        for (const p of projects) {
            console.log(`Checking Project: ${p.title} (${p._id})`);
            // Check last request
            const lastReq = p.joinRequests[p.joinRequests.length - 1];
            if (!lastReq) continue;

            console.log(`  Last Request: User ${lastReq.user}, Status: ${lastReq.status}, ID: ${lastReq._id}`);

            // Find matching message
            const msg = await Message.findOne({ joinRequestId: lastReq._id });
            if (msg) {
                console.log(`  ✅ MATCHING MESSAGE FOUND: ${msg._id}, Type: ${msg.type}`);
            } else {
                console.log(`  ❌ NO MATCHING MESSAGE FOUND for Request ${lastReq._id}`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyRequests();
