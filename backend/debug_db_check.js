const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('No MONGO_URI found in .env');
    process.exit(1);
}

// Helper to replace db name in URI
function getUriForDb(baseUri, dbName) {
    if (baseUri.includes('/college-hub')) {
        return baseUri.replace('/college-hub', `/${dbName}`);
    } else if (baseUri.includes('/test')) {
        return baseUri.replace('/test', `/${dbName}`);
    }
    // Fallback if no db name in URI, just append (might be wrong if query params exist, but standard SRV usually has path)
    // Actually the user's URI has /college-hub so the replace should work.
    return baseUri;
}

const run = async () => {
    const hubUri = uri; // Already college-hub
    const chronicleUri = getUriForDb(uri, 'college-chronicle');

    console.log('Hub URI:', hubUri.split('@')[1]); // Log partial to avoid exposing pass in logs if possible, though user sees it.
    console.log('Chronicle URI:', chronicleUri.split('@')[1]);

    const clientHub = new MongoClient(hubUri);
    const clientChronicle = new MongoClient(chronicleUri);

    try {
        await clientHub.connect();
        await clientChronicle.connect();
        console.log('Connected to both.');

        const dbHub = clientHub.db('college-hub');
        const dbChronicle = clientChronicle.db('college-chronicle'); // Explicitly ask for this db

        const printStats = async (db, name) => {
            console.log(`\n--- Stats for ${name} ---`);
            const collections = await db.listCollections().toArray();
            if (collections.length === 0) {
                console.log('  (Empty Database)');
                return;
            }
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  ${col.name}: ${count}`);
            }
        };

        await printStats(dbHub, 'college-hub');
        await printStats(dbChronicle, 'college-chronicle');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await clientHub.close();
        await clientChronicle.close();
    }
};

run();
