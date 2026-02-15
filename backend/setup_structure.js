const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Assuming the script is in 'backend/setup_structure.js' and '.env' is in 'backend/' or root depending on where it's run
// If run from root, just 'dotenv.config()' works. If run from backend, 'dotenv.config()'.
// We will look relative to the file first or let the user decide.
// Let's assume standard dotenv usage.
dotenv.config();

// We need to require ALL models to register them with Mongoose.
// This assumes running from `backend/` directory so paths are `./models/...`
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const setupStructure = async () => {
    try {
        await connectDB();

        // Get all model files
        const modelsDir = path.join(__dirname, 'models');
        const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

        console.log(`Found ${modelFiles.length} models to process...`);

        for (const file of modelFiles) {
            const modelName = file.split('.')[0];
            try {
                // Dynamically require the model
                const Model = require(path.join(modelsDir, file));

                // Ensure indexes are created
                // force: true makes sure indexes are rebuilt even if they exist differently? maybe not needed here.
                // createIndexes() is the standard way to ensure indexes exist.
                await Model.createIndexes();
                console.log(`✅ ${modelName}: Indexes created.`);

                // Ensure collection exists (for empty collections)
                // If collection doesn't exist, create it explicitly with options from schema if any
                // Mongoose usually handles this on first write, but we want structure ONLY.
                const collections = await mongoose.connection.db.listCollections({ name: Model.collection.name }).toArray();
                if (collections.length === 0) {
                    await mongoose.connection.createCollection(Model.collection.name);
                    console.log(`✅ ${modelName}: Collection created (was missing).`);
                } else {
                    console.log(`ℹ️  ${modelName}: Collection already exists.`);
                }

            } catch (err) {
                console.error(`❌ Error processing ${modelName}:`, err.message);
            }
        }

        console.log('Database structure setup complete.');
        process.exit();
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

setupStructure();
