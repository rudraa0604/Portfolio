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
    db.get("SELECT * FROM profile ORDER BY id DESC LIMIT 1", (err, current) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const c = current || {};
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

        if (c.id) {
            db.run(
                `UPDATE profile SET name = ?, title = ?, description = ?, email = ?, phone = ?, website = ?, location = ?, availability = ?, account_id = ?, quote_text = ?, quote_footer = ?, background_url = ?, whatsapp = ?, linkedin = ?, instagram = ?, github = ?, profile_photo = ?, footer_topic = ?, footer_desc = ?, resume_url = ? WHERE id = ?`,
                [
                    updated.name, updated.title, updated.description, updated.email, updated.phone,
                    updated.website, updated.location, updated.availability, updated.account_id,
                    updated.quote_text, updated.quote_footer, updated.background_url, updated.whatsapp,
                    updated.linkedin, updated.instagram, updated.github, updated.profile_photo,
                    updated.footer_topic, updated.footer_desc, updated.resume_url,
                    c.id
                ],
                function(updateErr) {
                    if (updateErr) return res.status(500).json({ error: updateErr.message });
                    res.json({ message: "Profile updated successfully", profile: updated });
                }
            );
        } else {
            db.run(
                `INSERT INTO profile (name, title, description, email, phone, website, location, availability, account_id, quote_text, quote_footer, background_url, whatsapp, linkedin, instagram, github, profile_photo, footer_topic, footer_desc, resume_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    updated.name, updated.title, updated.description, updated.email, updated.phone,
                    updated.website, updated.location, updated.availability, updated.account_id,
                    updated.quote_text, updated.quote_footer, updated.background_url, updated.whatsapp,
                    updated.linkedin, updated.instagram, updated.github, updated.profile_photo,
                    updated.footer_topic, updated.footer_desc, updated.resume_url
                ],
                function(insertErr) {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });
                    res.json({ message: "Profile created successfully", id: this.lastID, profile: updated });
                }
            );
        }
    });
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
    db.run("INSERT INTO certifications (name, issuer, image_url) VALUES (?, ?, ?)", [req.body.name, req.body.issuer, req.body.image_url || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/certifications/:id', authenticateToken, (req, res) => {
    db.run("UPDATE certifications SET name = ?, issuer = ?, image_url = ? WHERE id = ?", [req.body.name, req.body.issuer, req.body.image_url || '', req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Certification updated successfully" });
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

// Testimonials endpoints (Legacy support)
makeGetRoute('/api/testimonials', 'testimonials');
makeDeleteRoute('/api/testimonials', 'testimonials');
app.post('/api/testimonials', authenticateToken, (req, res) => {
    db.run("INSERT INTO testimonials (quote, client_name, client_title) VALUES (?, ?, ?)", [req.body.quote, req.body.client_name, req.body.client_title], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});
app.put('/api/testimonials/:id', authenticateToken, (req, res) => {
    db.run("UPDATE testimonials SET quote = ?, client_name = ?, client_title = ? WHERE id = ?", [req.body.quote, req.body.client_name, req.body.client_title, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Testimonial updated successfully" });
    });
});

// Reviews Endpoints (with Approval Workflow & Ratings)
app.get('/api/reviews', (req, res) => {
    const { status } = req.query;
    if (status === 'approved') {
        // Public endpoint for homepage to fetch approved reviews
        db.all("SELECT * FROM reviews WHERE status = 'approved' ORDER BY id DESC", (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        // Protected admin endpoint for all/filtered reviews
        authenticateToken(req, res, () => {
            let query = "SELECT * FROM reviews ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, id DESC";
            let params = [];
            if (status) {
                query = "SELECT * FROM reviews WHERE status = ? ORDER BY id DESC";
                params = [status];
            }
            db.all(query, params, (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        });
    }
});

app.post('/api/reviews', (req, res) => {
    const { name, designation, review_text, rating } = req.body;
    if (!name || !designation || !review_text) {
        return res.status(400).json({ error: "Name, designation, and review text are required." });
    }
    const cleanName = String(name).trim().slice(0, 100);
    const cleanDesig = String(designation).trim().slice(0, 120);
    const cleanText = String(review_text).trim().slice(0, 500);
    const numRating = Math.max(1, Math.min(5, parseInt(rating) || 5));

    db.run(
        "INSERT INTO reviews (name, designation, review_text, rating, status) VALUES (?, ?, ?, ?, 'pending')",
        [cleanName, cleanDesig, cleanText, numRating],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: "Thanks! Your review will appear after approval.", 
                id: this.lastID 
            });
        }
    );
});

app.patch('/api/reviews/:id', authenticateToken, (req, res) => {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be pending, approved, or rejected." });
    }
    db.run("UPDATE reviews SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Review ${status} successfully` });
    });
});

app.delete('/api/reviews/:id', authenticateToken, (req, res) => {
    db.run("DELETE FROM reviews WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Review deleted successfully" });
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
