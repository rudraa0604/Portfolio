const dns = require('dns');
if (process.platform === 'win32') {
    try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
}
const { MongoClient, ObjectId } = require('mongodb');

const DEFAULT_URI = 'mongodb+srv://rudraa0604_db_user:TpfmKnA6Q5lrnWAu@cluster0.nwr0q50.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0';

function getCleanUri() {
    let rawUri = process.env.MONGODB_URI || DEFAULT_URI;
    let cleaned = String(rawUri).replace(/[\r\n\t\s]+/g, '').trim();
    if (cleaned.includes('cluster0.wr0q50.mongodb.net')) {
        cleaned = cleaned.replace('cluster0.wr0q50.mongodb.net', 'cluster0.nwr0q50.mongodb.net');
    }
    return cleaned;
}

let db = null;
let client = null;

async function connectMongo() {
    if (db) return db;
    const uri = getCleanUri();
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db('portfolio');
        console.log('Connected to MongoDB Atlas (Cloud Database) ✅');
        return db;
    } catch (err) {
        console.error('MongoDB Atlas Connection Error:', err.message);
        throw err;
    }
}

function getDb() {
    return db;
}

module.exports = { connectMongo, getDb, ObjectId };
