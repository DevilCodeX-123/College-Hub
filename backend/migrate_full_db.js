const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables (for source MONGO_URI)
dotenv.config();

const migrate = async () => {
    // 1. Source URI
    // Try to read from .env.old first (if we switched environments)
    let sourceURI = process.env.MONGO_URI_SOURCE || process.env.MONGO_URI;

    // Check if .env.old exists and loaded manually if needed, or if we want to force it.
    // Assuming user might run this AFTER we switched .env, we should look for the old one.
    const fs = require('fs');
    if (fs.existsSync(path.join(__dirname, '../.env.old'))) {
        const oldEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env.old')));
        if (oldEnv.MONGO_URI) {
            console.log('ℹ️  Detected .env.old. Using it as Source URI.');
            sourceURI = oldEnv.MONGO_URI;
        }
    } else if (fs.existsSync(path.join(__dirname, '.env.old'))) {
        // Try checking current dir too
        const oldEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env.old')));
        if (oldEnv.MONGO_URI) {
            console.log('ℹ️  Detected .env.old. Using it as Source URI.');
            sourceURI = oldEnv.MONGO_URI;
        }
    }

    if (!sourceURI) {
        console.error('❌ Error: Source MONGO_URI is missing (checked .env and .env.old)');
        process.exit(1);
    }

    // 2. Destination URI
    // Usage: node backend/migrate_full_db.js [DEST_URI]
    // If not provided, use the current .env MONGO_URI (since we switched it)
    let destURI = process.argv[2] || process.env.MONGO_URI_DEST || process.env.MONGO_URI;

    // Safety check: Don't copy to same DB
    if (sourceURI === destURI) {
        console.error('❌ Error: Source and Destination URIs are identical!');
        console.error('   Please ensure .env.old contains the OLD DB and .env contains the NEW DB.');
        process.exit(1);
    }

    if (!destURI) {
        console.error('❌ Error: Destination Connection String is missing.');
        console.log('Usage: node backend/migrate_full_db.js "<YOUR_NEW_DB_CONNECTION_STRING>"');
        process.exit(1);
    }

    if (destURI.includes('<db_password>')) {
        console.error('❌ Error: Destination URI contains placeholder <db_password>. Please replace it with the actual password.');
        process.exit(1);
    }

    const clientSrc = new MongoClient(sourceURI);
    const clientDest = new MongoClient(destURI);

    try {
        console.log('\nPlease wait, connecting...');

        // Connect both clients
        await clientSrc.connect();
        await clientDest.connect();
        console.log('✅ Connected to both Source and Destination databases.');

        const srcDb = clientSrc.db(); // Uses DB name from Source URI
        const destDb = clientDest.db(); // Uses DB name from Destination URI

        console.log(`\n📦 Copying data from [${srcDb.databaseName}] to [${destDb.databaseName}]...\n`);

        // Get list of all collections in Source
        const collections = await srcDb.listCollections().toArray();

        for (const colInfo of collections) {
            const colName = colInfo.name;

            // Skip system collections
            if (colName.startsWith('system.')) continue;

            console.log(`🔹 Processing Collection: ${colName}`);

            const srcColl = srcDb.collection(colName);
            const destColl = destDb.collection(colName);

            // 1. Copy Documents
            const docs = await srcColl.find().toArray();
            if (docs.length > 0) {
                // Optional: Clear destination first to prevent duplicates if running multiple times?
                // For "Copy Paste", usually we assume empty destination.
                // Let's safe-guard by deleting many (optional, but safer for exact copy)
                // await destColl.deleteMany({}); 

                // Use ordered: false to continue inserting even if some dupes fail (if we didn't clear)
                try {
                    const result = await destColl.insertMany(docs, { ordered: false });
                    console.log(`   ✅ Inserted ${result.insertedCount} documents.`);
                } catch (e) {
                    // If existing, some might fail.
                    console.log(`   ⚠️  Inserted with some issues (likely duplicates): ${e.insertedCount || 0} inserted.`);
                }
            } else {
                console.log(`   ℹ️  Collection is empty.`);
            }

            // 2. Copy Indexes
            const indexes = await srcColl.indexes();
            if (indexes.length > 0) {
                // Filter out default _id index which is always created
                const indexesToCreate = indexes.filter(idx => idx.name !== '_id_');
                if (indexesToCreate.length > 0) {
                    try {
                        await destColl.createIndexes(indexesToCreate);
                        console.log(`   ✅ Created ${indexesToCreate.length} indexes.`);
                    } catch (err) {
                        console.log(`   ⚠️  Index creation warning: ${err.message}`);
                    }
                }
            }
        }

        console.log('\n🎉 FULL MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('The source database was NOT modified.');

    } catch (err) {
        console.error('\n❌ Migration Failed:', err);
    } finally {
        await clientSrc.close();
        await clientDest.close();
    }
};

migrate();
