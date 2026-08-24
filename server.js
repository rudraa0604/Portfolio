const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./database');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'super-secret-key-for-portfolio-admin'; // In production, this should be in .env

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
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

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

// Login Route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admin_users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) return res.status(500).json({ error: err.message });
            if (isMatch) {
                const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
                res.cookie('admin_token', token, { httpOnly: true });
                res.json({ message: 'Logged in successfully' });
            } else {
                res.status(400).json({ error: 'Invalid username or password' });
            }
        });
    });
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

// Generic helper for GET routes
const makeGetRoute = (path, table) => {
    app.get(path, (req, res) => {
        db.all(`SELECT * FROM ${table}`, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });
};
// Generic helper for DELETE routes (Protected)
const makeDeleteRoute = (path, table) => {
    app.delete(`${path}/:id`, authenticateToken, (req, res) => {
        db.run(`DELETE FROM ${table} WHERE id = ?`, req.params.id, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ deleted: this.changes });
        });
    });
};

// Settings (Theme)
app.get('/api/settings', (req, res) => {
    db.get("SELECT * FROM settings ORDER BY id DESC LIMIT 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});
app.post('/api/settings', authenticateToken, (req, res) => {
    db.run("UPDATE settings SET theme_name = ? WHERE id = (SELECT id FROM settings ORDER BY id DESC LIMIT 1)", [req.body.theme_name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Theme updated successfully" });
    });
});

// Profile endpoints
app.get('/api/profile', (req, res) => {
    db.get("SELECT * FROM profile ORDER BY id DESC LIMIT 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});
app.post('/api/profile', authenticateToken, (req, res) => {
    const { name, title, description, email, phone, website, location, availability, account_id, quote_text, quote_footer, background_url, whatsapp, linkedin, instagram, github, profile_photo, footer_topic, footer_desc, resume_url } = req.body;
    db.run(
        `UPDATE profile SET name = ?, title = ?, description = ?, email = ?, phone = ?, website = ?, location = ?, availability = ?, account_id = ?, quote_text = ?, quote_footer = ?, background_url = ?, whatsapp = ?, linkedin = ?, instagram = ?, github = ?, profile_photo = ?, footer_topic = ?, footer_desc = ?, resume_url = ? WHERE id = (SELECT id FROM profile ORDER BY id DESC LIMIT 1)`,
        [name, title, description, email, phone, website, location, availability, account_id, quote_text, quote_footer, background_url, whatsapp, linkedin, instagram, github, profile_photo, footer_topic, footer_desc, resume_url],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Profile updated successfully" });
        }
    );
});

// Projects endpoints
makeGetRoute('/api/projects', 'projects');
makeDeleteRoute('/api/projects', 'projects');
app.post('/api/projects', authenticateToken, (req, res) => {
    const { title, category, image_url, project_url } = req.body;
    db.run("INSERT INTO projects (title, category, image_url, project_url) VALUES (?, ?, ?, ?)", [title, category, image_url, project_url || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/projects/:id', authenticateToken, (req, res) => {
    const { title, category, image_url, project_url } = req.body;
    db.run("UPDATE projects SET title = ?, category = ?, image_url = ?, project_url = ? WHERE id = ?", [title, category, image_url, project_url || '', req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Project updated successfully" });
    });
});

// Skills/Services endpoints
makeGetRoute('/api/skills', 'skills');
makeDeleteRoute('/api/skills', 'skills');
app.post('/api/skills', authenticateToken, (req, res) => {
    db.run("INSERT INTO skills (name, price) VALUES (?, ?)", [req.body.name, req.body.price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/skills/:id', authenticateToken, (req, res) => {
    db.run("UPDATE skills SET name = ?, price = ? WHERE id = ?", [req.body.name, req.body.price, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Skill/Service updated successfully" });
    });
});

// Education endpoints
makeGetRoute('/api/education', 'education');
makeDeleteRoute('/api/education', 'education');
app.post('/api/education', authenticateToken, (req, res) => {
    db.run("INSERT INTO education (degree, institution, year) VALUES (?, ?, ?)", [req.body.degree, req.body.institution, req.body.year], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/education/:id', authenticateToken, (req, res) => {
    db.run("UPDATE education SET degree = ?, institution = ?, year = ? WHERE id = ?", [req.body.degree, req.body.institution, req.body.year, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Education updated successfully" });
    });
});


// Certifications (Awards and Achievements) endpoints
makeGetRoute('/api/certifications', 'certifications');
makeDeleteRoute('/api/certifications', 'certifications');
app.post('/api/certifications', authenticateToken, (req, res) => {
    db.run("INSERT INTO certifications (name, issuer) VALUES (?, ?)", [req.body.name, req.body.issuer], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/certifications/:id', authenticateToken, (req, res) => {
    db.run("UPDATE certifications SET name = ?, issuer = ? WHERE id = ?", [req.body.name, req.body.issuer, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Award updated successfully" });
    });
});

// Stats endpoints
makeGetRoute('/api/stats', 'stats');
makeDeleteRoute('/api/stats', 'stats');
app.post('/api/stats', authenticateToken, (req, res) => {
    db.run("INSERT INTO stats (value, description) VALUES (?, ?)", [req.body.value, req.body.description], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Testimonials endpoints
makeGetRoute('/api/testimonials', 'testimonials');
makeDeleteRoute('/api/testimonials', 'testimonials');
app.post('/api/testimonials', authenticateToken, (req, res) => {
    db.run("INSERT INTO testimonials (quote, client_name, client_title) VALUES (?, ?, ?)", [req.body.quote, req.body.client_name, req.body.client_title], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Custom Content endpoints
makeGetRoute('/api/custom_content', 'custom_content');
makeDeleteRoute('/api/custom_content', 'custom_content');
app.post('/api/custom_content', authenticateToken, (req, res) => {
    db.run("INSERT INTO custom_content (title, content, section_placement) VALUES (?, ?, ?)", [req.body.title, req.body.content, req.body.section_placement], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/custom_content/:id', authenticateToken, (req, res) => {
    db.run("UPDATE custom_content SET title = ?, content = ?, section_placement = ? WHERE id = ?", [req.body.title, req.body.content, req.body.section_placement, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Custom content updated successfully" });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
