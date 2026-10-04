const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GridFSBucket } = require('mongodb');
const { connectMongo, ObjectId } = require('./mongoDatabase');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-portfolio-admin';

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Security & Force HTTPS Middleware
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    // Standard Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Legal, SEO & Static Routes
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/favicon.svg', (req, res) => res.sendFile(path.join(__dirname, 'favicon.svg')));
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, 'favicon.svg')));

app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// GridFS & Disk Hybrid Handler for /uploads/ (Never loses photos on Render redeploys!)
app.get('/uploads/:filename', async (req, res) => {
    const filename = req.params.filename;
    const localPath = path.join(__dirname, 'uploads', filename);

    if (fs.existsSync(localPath)) {
        return res.sendFile(localPath, (err) => {
            if (err && !res.headersSent) {
                if (err.status === 416 || err.code === 'ERR_STREAM_PREMATURE_CLOSE' || err.code === 'ECONNABORTED') {
                    return res.status(416).end();
                }
                res.status(err.status || 500).end();
            }
        });
    }

    try {
        const db = await connectMongo();
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const fileDoc = await db.collection('uploads.files').findOne({ filename: filename });

        if (!fileDoc) {
            return res.status(404).send('File not found');
        }

        if (fileDoc.contentType) {
            res.setHeader('Content-Type', fileDoc.contentType);
        }

        if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
            fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
        }
        const writeStream = fs.createWriteStream(localPath);
        const downloadStream = bucket.openDownloadStreamByName(filename);

        downloadStream.on('error', (err) => {
            console.error('GridFS stream error:', err.message);
            if (!res.headersSent) res.status(500).send('Error retrieving file');
        });

        downloadStream.pipe(writeStream);
        downloadStream.pipe(res);
    } catch (err) {
        console.error('Error fetching file from GridFS:', err.message);
        if (!res.headersSent) res.status(500).send('Error retrieving file');
    }
});

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('uploads/')) {
            fs.mkdirSync('uploads/', { recursive: true });
        }
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});
const upload = multer({ storage: storage });

// Helpers
function parseIdQuery(id) {
    if (!id) return {};
    const queries = [];
    if (ObjectId.isValid(id)) {
        try {
            queries.push({ _id: new ObjectId(id) });
        } catch (e) {}
    }
    queries.push({ _id: String(id) });
    const num = Number(id);
    if (!isNaN(num)) {
        queries.push({ id: num });
    }
    queries.push({ id: String(id) });
    return queries.length === 1 ? queries[0] : { $or: queries };
}

function formatDoc(doc) {
    if (!doc) return null;
    const res = {
        ...doc,
        id: doc.id !== undefined ? doc.id : (doc._id ? doc._id.toString() : undefined)
    };
    if (doc.project_url !== undefined || doc.live_link !== undefined) {
        const link = doc.project_url || doc.live_link || '';
        res.project_url = link;
        res.live_link = link;
    }
    return res;
}

function formatDocs(docs) {
    return (docs || []).map(formatDoc);
}

// Media Cleanup Helpers (GridFS + Disk)
function extractFilename(urlOrPath) {
    if (!urlOrPath || typeof urlOrPath !== 'string') return '';
    const clean = urlOrPath.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('data:')) {
        return '';
    }
    const parts = clean.split(/[/\\]/);
    const fname = parts[parts.length - 1];
    return fname.replace(/[\r\n\t]/g, '').trim();
}

async function deleteMediaFile(urlOrPath) {
    const filename = extractFilename(urlOrPath);
    if (!filename) return false;

    // 1. Delete from MongoDB Atlas GridFS (files + all binary chunks)
    try {
        const db = await connectMongo();
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const files = await db.collection('uploads.files').find({ filename: filename }).toArray();
        for (const file of files) {
            try {
                await bucket.delete(file._id);
            } catch (err) {
                await db.collection('uploads.files').deleteOne({ _id: file._id });
                await db.collection('uploads.chunks').deleteMany({ files_id: file._id });
            }
        }
    } catch (err) {
        console.error(`Error deleting ${filename} from GridFS:`, err.message);
    }

    // 2. Delete from local disk
    try {
        const localPath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log(`Deleted local file: ${filename}`);
        }
    } catch (err) {
        console.error(`Error deleting local file ${filename}:`, err.message);
    }

    return true;
}

async function getActiveMediaFilenames(db) {
    const active = new Set();

    // Projects
    const projects = await db.collection('projects').find({}).toArray();
    projects.forEach(p => {
        const f = extractFilename(p.image_url);
        if (f) active.add(f);
    });

    // Profile
    const profile = await db.collection('profile').findOne({});
    if (profile) {
        ['profile_photo', 'resume_url', 'background_url'].forEach(k => {
            const f = extractFilename(profile[k]);
            if (f) active.add(f);
        });
        if (profile.footer_desc) {
            const matches = profile.footer_desc.match(/\/uploads\/[^\s"\'<>]+/g);
            if (matches) {
                matches.forEach(m => {
                    const f = extractFilename(m);
                    if (f) active.add(f);
                });
            }
        }
    }

    // Certifications
    const certs = await db.collection('certifications').find({}).toArray();
    certs.forEach(c => {
        const f = extractFilename(c.image_url);
        if (f) active.add(f);
    });

    // Custom Content
    const customs = await db.collection('custom_content').find({}).toArray();
    customs.forEach(c => {
        if (c.content) {
            const matches = c.content.match(/\/uploads\/[^\s"\'<>]+/g);
            if (matches) {
                matches.forEach(m => {
                    const f = extractFilename(m);
                    if (f) active.add(f);
                });
            }
        }
    });

    return active;
}

async function cleanAllOrphanedFiles() {
    const db = await connectMongo();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    const active = await getActiveMediaFilenames(db);

    const allFiles = await db.collection('uploads.files').find({}).toArray();
    let deletedCount = 0;
    let freedBytes = 0;

    for (const file of allFiles) {
        if (!active.has(file.filename)) {
            try {
                await bucket.delete(file._id);
                await db.collection('uploads.chunks').deleteMany({ files_id: file._id });
            } catch (e) {
                await db.collection('uploads.files').deleteOne({ _id: file._id });
                await db.collection('uploads.chunks').deleteMany({ files_id: file._id });
            }
            deletedCount++;
            freedBytes += (file.length || 0);

            const localPath = path.join(__dirname, 'uploads', file.filename);
            if (fs.existsSync(localPath)) {
                try { fs.unlinkSync(localPath); } catch (e) {}
            }
        }
    }

    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
        try {
            const diskFiles = fs.readdirSync(uploadsDir);
            for (const f of diskFiles) {
                if (!active.has(f)) {
                    try { fs.unlinkSync(path.join(uploadsDir, f)); } catch(e) {}
                }
            }
        } catch (e) {}
    }

    return { deletedCount, freedBytes };
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = (req.cookies && req.cookies.admin_token) || bearerToken;
    
    if (!token) return res.status(401).json({ error: 'Access Denied: Please log in to admin panel!' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Access Denied: Invalid or expired session!' });
        req.user = decoded;
        next();
    });
};

// Admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = await connectMongo();
        const user = await db.collection('admin_users').findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            const token = jwt.sign({ id: user._id || user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
            res.cookie('admin_token', token, { httpOnly: true });
            res.json({ message: 'Logged in successfully' });
        } else {
            res.status(400).json({ error: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth Check Route
app.get('/api/check-auth', authenticateToken, (req, res) => {
    res.json({ authenticated: true, user: req.user });
});

// Logout Route
app.post('/api/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out successfully' });
});

// Storage Stats Route (Protected)
app.get('/api/storage/stats', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const files = await db.collection('uploads.files').find({}).toArray();
        const totalFiles = files.length;
        const totalBytes = files.reduce((acc, f) => acc + (f.length || 0), 0);
        const chunkCount = await db.collection('uploads.chunks').countDocuments();
        res.json({
            totalFiles,
            totalSizeBytes: totalBytes,
            totalSizeMB: (totalBytes / (1024 * 1024)).toFixed(2),
            chunkCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Storage Cleanup Route (Protected) - Cleans unreferenced orphaned files from GridFS & Disk
app.post('/api/storage/cleanup', authenticateToken, async (req, res) => {
    try {
        const result = await cleanAllOrphanedFiles();
        const db = await connectMongo();
        const files = await db.collection('uploads.files').find({}).toArray();
        const totalBytes = files.reduce((acc, f) => acc + (f.length || 0), 0);
        res.json({
            message: `Cleanup completed! Deleted ${result.deletedCount} unused file(s).`,
            deletedCount: result.deletedCount,
            freedBytesMB: (result.freedBytes / (1024 * 1024)).toFixed(2),
            remainingFiles: files.length,
            currentSizeMB: (totalBytes / (1024 * 1024)).toFixed(2)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// File Upload Route (Protected) - Saves to Disk + MongoDB Atlas GridFS
app.post('/api/upload', authenticateToken, upload.any(), async (req, res) => {
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!file) return res.status(400).json({ error: 'Please upload a file' });
    const fileUrl = '/uploads/' + file.filename;

    // Stream into MongoDB Atlas GridFS for permanent persistence across all Render redeploys!
    try {
        const db = await connectMongo();
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const uploadStream = bucket.openUploadStream(file.filename, {
            contentType: file.mimetype || 'application/octet-stream',
            metadata: { originalName: file.originalname, size: file.size }
        });
        fs.createReadStream(file.path).pipe(uploadStream);
    } catch (err) {
        console.error('GridFS Upload Error:', err.message);
    }

    res.json({ imageUrl: fileUrl, fileUrl: fileUrl });
});

// Settings (Theme)
app.get('/api/settings', async (req, res) => {
    try {
        const db = await connectMongo();
        const row = await db.collection('settings').findOne({});
        res.json(formatDoc(row) || { theme_name: 'Default Dark' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/settings', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('settings').updateOne({}, { $set: { theme_name: req.body.theme_name } }, { upsert: true });
        res.json({ message: "Theme updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Profile endpoints
app.get('/api/profile', async (req, res) => {
    try {
        const db = await connectMongo();
        const row = await db.collection('profile').findOne({});
        res.json(formatDoc(row) || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const c = (await db.collection('profile').findOne({})) || {};
        const b = req.body || {};

        // Automatic Media Cleanup for updated / removed Profile media
        if (b.profile_photo !== undefined && c.profile_photo && c.profile_photo !== b.profile_photo) {
            await deleteMediaFile(c.profile_photo);
        }
        if (b.resume_url !== undefined && c.resume_url && c.resume_url !== b.resume_url) {
            await deleteMediaFile(c.resume_url);
        }
        if (b.background_url !== undefined && c.background_url && c.background_url !== b.background_url) {
            await deleteMediaFile(c.background_url);
        }

        const updated = {
            name: b.name !== undefined ? b.name : (c.name || ''),
            title: b.title !== undefined ? b.title : (c.title || ''),
            description: b.description !== undefined ? b.description : (c.description || ''),
            email: b.email !== undefined ? b.email : (c.email || ''),
            phone: b.phone !== undefined ? b.phone : (c.phone || ''),
            website: b.website !== undefined ? b.website : (c.website || ''),
            location: b.location !== undefined ? b.location : (c.location || ''),
            availability: b.availability !== undefined ? b.availability : (c.availability || ''),
            account_id: b.account_id !== undefined ? b.account_id : (c.account_id || ''),
            quote_text: b.quote_text !== undefined ? b.quote_text : (c.quote_text || ''),
            quote_footer: b.quote_footer !== undefined ? b.quote_footer : (c.quote_footer || ''),
            background_url: b.background_url !== undefined ? b.background_url : (c.background_url || ''),
            whatsapp: b.whatsapp !== undefined ? b.whatsapp : (c.whatsapp || ''),
            linkedin: b.linkedin !== undefined ? b.linkedin : (c.linkedin || ''),
            instagram: b.instagram !== undefined ? b.instagram : (c.instagram || ''),
            github: b.github !== undefined ? b.github : (c.github || ''),
            profile_photo: b.profile_photo !== undefined ? b.profile_photo : (c.profile_photo || ''),
            footer_topic: b.footer_topic !== undefined ? b.footer_topic : (c.footer_topic || ''),
            footer_desc: b.footer_desc !== undefined ? b.footer_desc : (c.footer_desc || ''),
            resume_url: b.resume_url !== undefined ? b.resume_url : (c.resume_url || '')
        };

        await db.collection('profile').updateOne({}, { $set: updated }, { upsert: true });
        res.json({ message: "Profile updated successfully", profile: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Projects endpoints
app.get('/api/projects', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('projects').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const { title, category, image_url } = req.body;
        const project_url = req.body.project_url || req.body.live_link || '';
        const result = await db.collection('projects').insertOne({ 
            title, 
            category, 
            image_url, 
            live_link: project_url, 
            project_url 
        });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const query = parseIdQuery(req.params.id);
        const { title, category, image_url } = req.body;
        const project_url = req.body.project_url || req.body.live_link || '';

        // Clean up previous image if replaced
        const existing = await db.collection('projects').findOne(query);
        if (existing && existing.image_url && image_url && existing.image_url !== image_url) {
            await deleteMediaFile(existing.image_url);
        }

        await db.collection('projects').updateOne(query, { 
            $set: { 
                title, 
                category, 
                image_url, 
                live_link: project_url, 
                project_url 
            } 
        });
        res.json({ message: "Project updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const query = parseIdQuery(req.params.id);
        
        // Auto-delete associated media file from GridFS & Disk
        const existing = await db.collection('projects').findOne(query);
        if (existing && existing.image_url) {
            await deleteMediaFile(existing.image_url);
        }

        await db.collection('projects').deleteOne(query);
        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Skills endpoints (Technical & Soft Skills)
app.get('/api/skills', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('skills').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/skills', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const { name, category, level, icon, description, price } = req.body;
        const result = await db.collection('skills').insertOne({
            name: String(name || '').trim(),
            category: category === 'soft' ? 'soft' : 'technical',
            level: level || '',
            icon: icon || '',
            description: description || '',
            price: price || ''
        });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/skills/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const { name, category, level, icon, description, price } = req.body;
        const updateData = {
            name: String(name || '').trim(),
            category: category === 'soft' ? 'soft' : 'technical',
            level: level || '',
            icon: icon || '',
            description: description || '',
            price: price || ''
        };
        await db.collection('skills').updateOne(parseIdQuery(req.params.id), { $set: updateData });
        res.json({ message: "Skill updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/skills/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('skills').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Skill deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Experience endpoints (Slides / Journey)
app.get('/api/experience', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('experience').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/experience', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const { role, company, duration, location, badge, description, skills } = req.body;
        const result = await db.collection('experience').insertOne({
            role: String(role || '').trim(),
            company: String(company || '').trim(),
            duration: String(duration || '').trim(),
            location: String(location || '').trim(),
            badge: String(badge || '').trim(),
            description: String(description || '').trim(),
            skills: String(skills || '').trim()
        });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/experience/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const { role, company, duration, location, badge, description, skills } = req.body;
        await db.collection('experience').updateOne(parseIdQuery(req.params.id), {
            $set: {
                role: String(role || '').trim(),
                company: String(company || '').trim(),
                duration: String(duration || '').trim(),
                location: String(location || '').trim(),
                badge: String(badge || '').trim(),
                description: String(description || '').trim(),
                skills: String(skills || '').trim()
            }
        });
        res.json({ message: "Experience updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/experience/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('experience').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Experience deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Education endpoints
app.get('/api/education', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('education').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/education', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const result = await db.collection('education').insertOne({ degree: req.body.degree, institution: req.body.institution, year: req.body.year });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/education/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('education').updateOne(parseIdQuery(req.params.id), { $set: { degree: req.body.degree, institution: req.body.institution, year: req.body.year } });
        res.json({ message: "Education updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/education/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('education').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Education deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Certifications endpoints
app.get('/api/certifications', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('certifications').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/certifications', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const result = await db.collection('certifications').insertOne({ name: req.body.name, issuer: req.body.issuer, image_url: req.body.image_url || '' });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/certifications/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const query = parseIdQuery(req.params.id);
        const { name, issuer, image_url } = req.body;

        const existing = await db.collection('certifications').findOne(query);
        if (existing && existing.image_url && image_url && existing.image_url !== image_url) {
            await deleteMediaFile(existing.image_url);
        }

        await db.collection('certifications').updateOne(query, { $set: { name, issuer, image_url: image_url || '' } });
        res.json({ message: "Certification updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/certifications/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const query = parseIdQuery(req.params.id);
        
        const existing = await db.collection('certifications').findOne(query);
        if (existing && existing.image_url) {
            await deleteMediaFile(existing.image_url);
        }

        await db.collection('certifications').deleteOne(query);
        res.json({ message: "Certification deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stats endpoints
app.get('/api/stats', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('stats').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/stats', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const result = await db.collection('stats').insertOne({ value: req.body.value, description: req.body.description });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/stats/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('stats').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Stat deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Testimonials endpoints (Legacy)
app.get('/api/testimonials', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('testimonials').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/testimonials', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const result = await db.collection('testimonials').insertOne({ quote: req.body.quote, client_name: req.body.client_name, client_title: req.body.client_title });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/testimonials/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('testimonials').updateOne(parseIdQuery(req.params.id), { $set: { quote: req.body.quote, client_name: req.body.client_name, client_title: req.body.client_title } });
        res.json({ message: "Testimonial updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/testimonials/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('testimonials').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Testimonial deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reviews Endpoints (with Approval Workflow & Ratings)
app.get('/api/reviews', async (req, res) => {
    const { status } = req.query;
    try {
        const db = await connectMongo();
        if (status === 'approved') {
            const rows = await db.collection('reviews').find({ status: 'approved' }).sort({ _id: -1 }).toArray();
            return res.json(formatDocs(rows));
        } else {
            authenticateToken(req, res, async () => {
                let filter = {};
                if (status) filter = { status };
                const rows = await db.collection('reviews').find(filter).sort({ _id: -1 }).toArray();
                res.json(formatDocs(rows));
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    // Bot / spam protection: hidden honeypot field check
    if (req.body.website_hp && String(req.body.website_hp).trim().length > 0) {
        // Silently return success to confuse the bot without storing spam
        return res.json({ message: "Thanks! Your review will appear after approval." });
    }

    const { name, designation, review_text, rating } = req.body;
    if (!name || !designation || !review_text) {
        return res.status(400).json({ error: "Name, designation, and review text are required." });
    }
    // HTML sanitize / escape to prevent XSS injection
    const sanitize = (str) => String(str || '').replace(/[<>]/g, '').trim();
    const cleanName = sanitize(name).slice(0, 100);
    const cleanDesig = sanitize(designation).slice(0, 120);
    const cleanText = sanitize(review_text).slice(0, 500);
    const numRating = Math.max(1, Math.min(5, parseInt(rating) || 5));

    try {
        const db = await connectMongo();
        const result = await db.collection('reviews').insertOne({
            name: cleanName,
            designation: cleanDesig,
            review_text: cleanText,
            rating: numRating,
            status: 'pending',
            created_at: new Date()
        });
        res.json({ 
            message: "Thanks! Your review will appear after approval.", 
            id: result.insertedId.toString() 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/reviews/:id', authenticateToken, async (req, res) => {
    const { status, name, designation, review_text, rating } = req.body;
    const updateObj = {};
    if (status) {
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Must be pending, approved, or rejected." });
        }
        updateObj.status = status;
    }
    if (name !== undefined) updateObj.name = String(name).trim().slice(0, 100);
    if (designation !== undefined) updateObj.designation = String(designation).trim().slice(0, 120);
    if (review_text !== undefined) updateObj.review_text = String(review_text).trim().slice(0, 500);
    if (rating !== undefined) updateObj.rating = Math.max(1, Math.min(5, parseInt(rating) || 5));

    try {
        const db = await connectMongo();
        await db.collection('reviews').updateOne(parseIdQuery(req.params.id), { $set: updateObj });
        res.json({ message: "Review updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('reviews').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Compatibility Route Aliases
app.get('/api/services', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('skills').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/achievements', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('certifications').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/auth/status', (req, res) => {
    const token = req.cookies.admin_token;
    if (!token) return res.json({ authenticated: false });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.json({ authenticated: false });
        res.json({ authenticated: true, user: decoded });
    });
});

// Custom Content endpoints
app.get('/api/custom_content', async (req, res) => {
    try {
        const db = await connectMongo();
        const rows = await db.collection('custom_content').find({}).toArray();
        res.json(formatDocs(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/custom_content', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const result = await db.collection('custom_content').insertOne({
            title: req.body.title,
            content: req.body.content,
            section_placement: req.body.section_placement
        });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/custom_content/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('custom_content').updateOne(parseIdQuery(req.params.id), {
            $set: {
                title: req.body.title,
                content: req.body.content,
                section_placement: req.body.section_placement
            }
        });
        res.json({ message: "Custom content updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/custom_content/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('custom_content').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Custom content deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seed Defaults for MongoDB Atlas
async function seedDefaults(db) {
    try {
        // 1. Seed Skills if empty or categorize existing
        const skillCount = await db.collection('skills').countDocuments();
        if (skillCount === 0) {
            const defaultSkills = [
                // Technical Skills
                { name: "PYTHON", category: "technical", level: "", icon: "🐍", description: "TECHNICAL TOOL", price: "" },
                { name: "AI – ASSISTED DEVELOPMENT (VIBE CODING)", category: "technical", level: "", icon: "✨", description: "TECHNICAL TOOL", price: "" },
                { name: "GIT/GITHUB", category: "technical", level: "", icon: "🐙", description: "TECHNICAL TOOL", price: "" },
                { name: "POWER BI", category: "technical", level: "", icon: "📊", description: "TECHNICAL TOOL", price: "" },
                { name: "HTML/CSS/JAVASCRIPT", category: "technical", level: "", icon: "🌐", description: "TECHNICAL TOOL", price: "" },
                // Soft Skills
                { name: "COMMUNICATION", category: "soft", level: "", icon: "💬", description: "CORE COMPETENCY", price: "" },
                { name: "TEAMWORK", category: "soft", level: "", icon: "👥", description: "CORE COMPETENCY", price: "" },
                { name: "LEADERSHIP", category: "soft", level: "", icon: "👑", description: "CORE COMPETENCY", price: "" },
                { name: "TIME MANAGEMENT", category: "soft", level: "", icon: "⏰", description: "CORE COMPETENCY", price: "" },
                { name: "QUICK LEARNING", category: "soft", level: "", icon: "⚡", description: "CORE COMPETENCY", price: "" }
            ];
            await db.collection('skills').insertMany(defaultSkills);
            console.log("Seeded default Technical & Soft Skills in MongoDB ✅");
        } else {
            // Ensure any existing skills have a category
            await db.collection('skills').updateMany({ category: { $exists: false } }, { $set: { category: "technical" } });
            // If there are no soft skills at all, add a few default soft skills
            const softCount = await db.collection('skills').countDocuments({ category: "soft" });
            if (softCount === 0) {
                const defaultSoft = [
                    { name: "Problem Solving & Analytical Thinking", category: "soft", level: "95%", icon: "🧠", description: "Breaking down complex security & design challenges", price: "" },
                    { name: "Team Collaboration & Leadership", category: "soft", level: "92%", icon: "🤝", description: "Coordinating and motivating cross-functional tech teams", price: "" },
                    { name: "Communication & Articulation", category: "soft", level: "88%", icon: "💬", description: "Articulating technical concepts to diverse audiences", price: "" },
                    { name: "Adaptability & Fast Learning", category: "soft", level: "95%", icon: "🚀", description: "Quickly mastering emerging tools, AI & frameworks", price: "" }
                ];
                await db.collection('skills').insertMany(defaultSoft);
                console.log("Added default Soft Skills to existing skills in MongoDB ✅");
            }
        }

        // 2. Seed Experience if empty
        const expCount = await db.collection('experience').countDocuments();
        if (expCount === 0) {
            const defaultExp = [
                {
                    role: "Cybersecurity Analyst Intern",
                    company: "WSCUBE Tech / Tech Training",
                    duration: "2023 - 2024",
                    location: "Remote",
                    badge: "Internship",
                    description: "Conducted hands-on vulnerability assessments, packet sniffing, and network analysis. Worked on ethical hacking workflows, penetration testing fundamentals, and security protocols.",
                    skills: "Wireshark, Metasploit, Nmap, Ethical Hacking, Linux"
                },
                {
                    role: "Freelance Graphic Designer & Visual Artist",
                    company: "Self-Employed / Independent",
                    duration: "2022 - Present",
                    location: "Remote",
                    badge: "Freelance",
                    description: "Created distinctive brand identities, event posters, marketing collateral, and digital illustrations. Delivered over 50+ client designs with high client satisfaction.",
                    skills: "Adobe Photoshop, Illustrator, Canva, Typography, Visual Storytelling"
                },
                {
                    role: "Technical Lead & Developer",
                    company: "Academic & Hackathon Projects",
                    duration: "2023 - Present",
                    location: "Kanpur, UP",
                    badge: "Projects",
                    description: "Spearheaded frontend and system design for community and academic platforms including Lost & Found management system, interactive portfolios, and workshop toolkits.",
                    skills: "JavaScript, Node.js, Express, MongoDB, UI/UX"
                }
            ];
            await db.collection('experience').insertMany(defaultExp);
            console.log("Seeded default Experience journey in MongoDB ✅");
        }
    } catch (e) {
        console.error("Error in seedDefaults:", e.message);
    }
}

// Catch-all 404 Handler for Unmatched Routes
app.use((req, res) => {
    if (req.accepts('html')) {
        return res.status(404).sendFile(path.join(__dirname, '404.html'));
    }
    res.status(404).json({ error: 'Page or resource not found' });
});

// Start Server after connecting to MongoDB Atlas
connectMongo().then(async (db) => {
    await seedDefaults(db);
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start server due to MongoDB error:", err.message);
});
