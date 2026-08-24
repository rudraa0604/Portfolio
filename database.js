const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const db = new sqlite3.Database('./portfolio.db');

db.serialize(() => {
    // 1. Profile Table
    db.run(`CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        title TEXT,
        description TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        location TEXT,
        availability TEXT,
        account_id TEXT,
        quote_text TEXT,
        quote_footer TEXT,
        background_url TEXT,
        whatsapp TEXT,
        linkedin TEXT,
        instagram TEXT,
        github TEXT,
        profile_photo TEXT
    )`);

    // Add new columns to profile if they don't exist
    const addColumn = (col, type) => {
        db.run(`ALTER TABLE profile ADD COLUMN ${col} ${type}`, (err) => {
            // Ignore error if column already exists
        });
    };
    addColumn('quote_text', 'TEXT');
    addColumn('quote_footer', 'TEXT');
    addColumn('whatsapp', 'TEXT');
    addColumn('linkedin', 'TEXT');
    addColumn('instagram', 'TEXT');
    addColumn('github', 'TEXT');
    addColumn('profile_photo', 'TEXT');
    addColumn('footer_topic', 'TEXT');
    addColumn('footer_desc', 'TEXT');
    addColumn('resume_url', 'TEXT');

    // Seed Profile (Update existing or insert)
    db.get("SELECT COUNT(*) AS count FROM profile", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO profile (name, title, description, email, phone, website, location, availability, account_id, quote_text, quote_footer, background_url, profile_photo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [
                    "RUDRA PRATAP CHAURASIYA", 
                    "CYBERSECURITY & GRAPHIC DESIGNER", 
                    "Dedicated BCA student with a passion for cybersecurity, programming, and creative design.",
                    "rudraa0604@gmail.com",
                    "+91 7570894518",
                    "www.rudrapratap.com",
                    "Kanpur, Uttar Pradesh",
                    'Willing to relocate',
                    'rudra-pratap',
                    'Good design is not just how it looks, but how it works.',
                    'LET\'S CREATE<br>SOMETHING GREAT<br>TOGETHER. <span style="color:var(--red-accent)">✦</span>',
                    'ezgif.com-gif-maker.gif',
                    ''
                ]
            );
        }
    });

    // 2. Projects Table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        category TEXT,
        image_url TEXT,
        project_url TEXT
    )`);
    db.run(`ALTER TABLE projects ADD COLUMN project_url TEXT`, (err) => {});

    // 3. Skills/Services Table
    db.run(`CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price TEXT
    )`);
    // Add price column if not exists
    db.run(`ALTER TABLE skills ADD COLUMN price TEXT`, (err) => {});
    db.get("SELECT COUNT(*) AS count FROM skills", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO skills (name, price) VALUES (?, ?)");
            ["CANVA", "ADOBE PHOTOSHOP", "ADOBE ILLUSTRATOR", "GRAPHIC DESIGN", "CYBERSECURITY", "C / C++", "PYTHON", "CONTENT CREATION"].forEach(s => stmt.run(s, ''));
            stmt.finalize();
        }
    });

    // 4. Education Table
    db.run(`CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        degree TEXT,
        institution TEXT,
        year TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM education", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO education (degree, institution, year) VALUES (?, ?, ?)");
            stmt.run("Bachelor of Computer Applications", "CSJM University, Kanpur", "2024 Ongoing");
            stmt.run("Intermediate", "UP Board", "2022 - 2023");
            stmt.finalize();
        }
    });

    // 5. Certifications (Awards and Achievements)
    db.run(`CREATE TABLE IF NOT EXISTS certifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        issuer TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM certifications", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO certifications (name, issuer) VALUES (?, ?)");
            stmt.run("Ethical Hacking Masterclass", "WSCUBE Tech");
            stmt.run("SOAR: AI to be Aware", "HCL Technologies");
            stmt.run("Digital Identity Workshop", "CSJM University");
            stmt.finalize();
        }
    });

    // 6. Stats Table
    db.run(`CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value TEXT,
        description TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM stats", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO stats (value, description) VALUES (?, ?)");
            stmt.run("3+", "CERTIFICATIONS<br>COMPLETED");
            stmt.run("C++", "PYTHON &<br>C PROGRAMMING");
            stmt.run("UI/UX", "VISUAL<br>STORYTELLING");
            stmt.finalize();
        }
    });

    // 7. Testimonials Table
    db.run(`CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT,
        client_name TEXT,
        client_title TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM testimonials", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO testimonials (quote, client_name, client_title) VALUES (?, ?, ?)");
            stmt.run("Rudra is incredibly talented. His grasp of graphic design combined with his growing technical skills make him a unique asset to any project.", "Sarah J.", "Project Manager");
            stmt.run("Great attention to detail and visual hierarchy. Delivered the social media layouts exactly as we envisioned.", "Michael T.", "Marketing Director");
            stmt.finalize();
        }
    });

    // 8. Admin Users Table
    db.run(`CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM admin_users", (err, row) => {
        if (row && row.count === 0) {
            const saltRounds = 10;
            const plainTextPassword = "Rudra@18182112"; // User provided password
            bcrypt.hash(plainTextPassword, saltRounds, function(err, hash) {
                if (!err) {
                    db.run("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)", ["admin", hash]);
                }
            });
        }
    });

    // 9. Settings Table (For Theme Switcher)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        theme_name TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM settings", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO settings (theme_name) VALUES (?)", ["Sunset Orange-Pink"]); // Default theme
        }
    });
    // 10. Custom Content Table
    db.run(`CREATE TABLE IF NOT EXISTS custom_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        section_placement TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM custom_content", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO custom_content (title, content, section_placement) VALUES (?, ?, ?)", 
            ["Welcome Note", "<p>Thank you for visiting my portfolio. This is a custom block that can be edited at any time.</p>", "footer-top"]);
        }
    });

});

module.exports = db;
