const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;
// Chronicle is the source
const sourceURI = uri.replace('/college-hub', '/college-chronicle');
// Hub is the dest
const destURI = uri;

const run = async () => {
    const clientSrc = new MongoClient(sourceURI);
    const clientDest = new MongoClient(destURI);

    try {
        await clientSrc.connect();
        await clientDest.connect();
        console.log('Connected.');

        const srcColl = clientSrc.db('college-chronicle').collection('users');
        const destColl = clientDest.db('college-hub').collection('users');

        const doc = await srcColl.findOne({});
        if (!doc) {
            console.log('No user found in source!');
            return;
        }

        console.log('Found user in source:', doc.email);

        try {
            const result = await destColl.insertOne(doc);
            console.log('Insert success:', result.insertedId);
        } catch (e) {
            console.error('Insert failed!');
            console.error('Error name:', e.name);
            console.error('Error code:', e.code);
            console.error('Error message:', e.message);
            if (e.writeErrors) {
                console.error('Write errors:', JSON.stringify(e.writeErrors, null, 2));
            }
        }

    } catch (e) {
        console.error('Global error:', e);
    } finally {
        await clientSrc.close();
        await clientDest.close();
    }
};

run();
