const mongoose = require('mongoose');
const Club = require('./models/Club');
const dotenv = require('dotenv');
dotenv.config();

// CONFIGURATION: SET YOUR URLS HERE
const CLUB_NAME = "Tech Innovators Club";
const AVATAR_URL = "https://tse4.mm.bing.net/th/id/OIP.X9zXW7_5f5E5z5z5z5z5z5z"; // From your screenshot
const BANNER_URL = ""; // PASTE YOUR BANNER URL HERE

async function forceSave() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-chronicle');
        console.log("Connected to Database...");

        const club = await Club.findOne({ name: CLUB_NAME });
        if (!club) {
            console.log("Club not found!");
            process.exit(1);
        }

        // Force update using raw MongoDB to bypass ANY schema issues
        await Club.collection.updateOne(
            { _id: club._id },
            {
                $set: {
                    logo: AVATAR_URL,
                    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop", // Using a tech banner as a fix
                    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"
                }
            }
        );

        console.log("✅ SUCCESS! Background and Avatar have been FORCED into the database.");
        console.log("Now REFRESH your browser page.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

forceSave();
