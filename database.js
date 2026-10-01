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

    // 3. Skills Table (with category: technical/soft, level, icon, description)
    db.run(`CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        category TEXT DEFAULT 'technical',
        level TEXT,
        icon TEXT,
        description TEXT,
        price TEXT
    )`);
    db.run(`ALTER TABLE skills ADD COLUMN category TEXT DEFAULT 'technical'`, (err) => {});
    db.run(`ALTER TABLE skills ADD COLUMN level TEXT`, (err) => {});
    db.run(`ALTER TABLE skills ADD COLUMN icon TEXT`, (err) => {});
    db.run(`ALTER TABLE skills ADD COLUMN description TEXT`, (err) => {});
    db.run(`ALTER TABLE skills ADD COLUMN price TEXT`, (err) => {});
    db.get("SELECT COUNT(*) AS count FROM skills", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO skills (name, category, level, icon, description, price) VALUES (?, ?, ?, ?, ?, ?)");
            // Technical Skills
            stmt.run("Python & C/C++", "technical", "85%", "🐍", "Scripting, Automation & Algorithms", "");
            stmt.run("Ethical Hacking & Security", "technical", "80%", "🛡️", "Vulnerability Assessment & Network Auditing", "");
            stmt.run("Graphic Design & UI/UX", "technical", "90%", "🎨", "Photoshop, Illustrator, Canva, Figma", "");
            stmt.run("Web Development", "technical", "82%", "🌐", "HTML5, CSS3, JavaScript, Node.js, Express", "");
            // Soft Skills
            stmt.run("Problem Solving & Critical Thinking", "soft", "95%", "🧠", "Breaking down complex security & visual challenges", "");
            stmt.run("Team Collaboration & Leadership", "soft", "90%", "🤝", "Leading projects and coordinating cross-functional teams", "");
            stmt.run("Communication & Presentation", "soft", "88%", "💬", "Articulating technical and creative ideas clearly", "");
            stmt.run("Adaptability & Fast Learning", "soft", "95%", "🚀", "Quickly learning emerging tech, tools, and AI workflows", "");
            stmt.finalize();
        }
    });

    // 3b. Experience Table
    db.run(`CREATE TABLE IF NOT EXISTS experience (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT,
        company TEXT,
        duration TEXT,
        location TEXT,
        badge TEXT,
        description TEXT,
        skills TEXT
    )`);
    db.get("SELECT COUNT(*) AS count FROM experience", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO experience (role, company, duration, location, badge, description, skills) VALUES (?, ?, ?, ?, ?, ?, ?)");
            stmt.run("Cybersecurity Analyst Intern", "WSCUBE Tech / Training", "2023 - 2024", "Remote", "Internship", "Conducted network vulnerability assessments, monitored security events with Wireshark & Nmap, and explored incident mitigation frameworks.", "Wireshark, Metasploit, Nmap, Ethical Hacking, Linux");
            stmt.run("Freelance Graphic Designer & UI Specialist", "Self-Employed", "2022 - Present", "Remote", "Freelance", "Created high-converting digital branding assets, poster designs, UI wireframes, and social media media kits for various clients.", "Adobe Photoshop, Illustrator, Canva, UI/UX, Typography");
            stmt.run("Technical Lead & Developer", "Academic Projects & Hackathons", "2023 - Present", "Kanpur, India", "Projects", "Spearheaded design and frontend architecture for web platforms including Lost & Found system and personal dynamic portfolios.", "JavaScript, Node.js, HTML5/CSS3, Git, Problem Solving");
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
        issuer TEXT,
        image_url TEXT
    )`);
    db.run(`ALTER TABLE certifications ADD COLUMN image_url TEXT`, (err) => {
        // Ignore error if column already exists
    });
    db.get("SELECT COUNT(*) AS count FROM certifications", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO certifications (name, issuer, image_url) VALUES (?, ?, ?)");
            stmt.run("Ethical Hacking Masterclass", "WSCUBE Tech", "");
            stmt.run("SOAR: AI to be Aware", "HCL Technologies", "");
            stmt.run("Digital Identity Workshop", "CSJM University", "");
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

    // 7. Testimonials Table (Legacy)
    db.run(`CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT,
        client_name TEXT,
        client_title TEXT
    )`);

    // 7b. Reviews Table (with Approval Workflow & Ratings)
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        review_text TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.get("SELECT COUNT(*) AS count FROM reviews", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO reviews (name, designation, review_text, rating, status) VALUES (?, ?, ?, ?, 'approved')");
            stmt.run("Sarah J.", "Project Manager", "Rudra is incredibly talented. His grasp of graphic design combined with his growing technical skills make him a unique asset to any project.", 5);
            stmt.run("Michael T.", "Marketing Director", "Great attention to detail and visual hierarchy. Delivered the social media layouts exactly as we envisioned.", 5);
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
