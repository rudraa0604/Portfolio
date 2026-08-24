const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { connectMongo, ObjectId } = require('./mongoDatabase');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-portfolio-admin';

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
        queries.push({ _id: new ObjectId(id) });
    }
    const num = Number(id);
    if (!isNaN(num)) {
        queries.push({ id: num });
    }
    queries.push({ id: String(id) });
    return queries.length === 1 ? queries[0] : { $or: queries };
}

function formatDoc(doc) {
    if (!doc) return null;
    return {
        ...doc,
        id: doc.id !== undefined ? doc.id : (doc._id ? doc._id.toString() : undefined)
    };
}

function formatDocs(docs) {
    return (docs || []).map(formatDoc);
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: 'Access Denied: No Token Provided!' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Access Denied: Invalid Token!' });
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

// File Upload Route (Protected)
app.post('/api/upload', authenticateToken, upload.any(), (req, res) => {
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!file) return res.status(400).json({ error: 'Please upload a file' });
    const fileUrl = '/uploads/' + file.filename;
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
        const { title, category, image_url, live_link } = req.body;
        const result = await db.collection('projects').insertOne({ title, category, image_url, live_link });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        const { title, category, image_url, live_link } = req.body;
        await db.collection('projects').updateOne(parseIdQuery(req.params.id), { $set: { title, category, image_url, live_link } });
        res.json({ message: "Project updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('projects').deleteOne(parseIdQuery(req.params.id));
        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Skills endpoints
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
        const result = await db.collection('skills').insertOne({ name: req.body.name, price: req.body.price });
        res.json({ id: result.insertedId.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/skills/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('skills').updateOne(parseIdQuery(req.params.id), { $set: { name: req.body.name, price: req.body.price } });
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
        await db.collection('certifications').updateOne(parseIdQuery(req.params.id), { $set: { name: req.body.name, issuer: req.body.issuer, image_url: req.body.image_url || '' } });
        res.json({ message: "Certification updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/certifications/:id', authenticateToken, async (req, res) => {
    try {
        const db = await connectMongo();
        await db.collection('certifications').deleteOne(parseIdQuery(req.params.id));
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
    const { name, designation, review_text, rating } = req.body;
    if (!name || !designation || !review_text) {
        return res.status(400).json({ error: "Name, designation, and review text are required." });
    }
    const cleanName = String(name).trim().slice(0, 100);
    const cleanDesig = String(designation).trim().slice(0, 120);
    const cleanText = String(review_text).trim().slice(0, 500);
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
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be pending, approved, or rejected." });
    }
    try {
        const db = await connectMongo();
        await db.collection('reviews').updateOne(parseIdQuery(req.params.id), { $set: { status } });
        res.json({ message: `Review ${status} successfully` });
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

// Start Server after connecting to MongoDB Atlas
connectMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start server due to MongoDB error:", err.message);
});
