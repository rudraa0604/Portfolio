const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rudraa0604_db_user:TpfmKnA6Q5lrnWAu@cluster0.nwr0q50.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0';

let db = null;
let client = null;

async function connectMongo() {
    if (db) return db;
    try {
        client = new MongoClient(MONGODB_URI);
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
