// app.js - Fetches data, populates DOM, then initializes GSAP

document.addEventListener('DOMContentLoaded', () => {
    // 0. Light/Dark Mode Setup
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    const currentMode = localStorage.getItem('themeMode') || 'dark';
    if (currentMode === 'light') {
        document.body.classList.add('light-mode');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('themeMode', isLight ? 'light' : 'dark');
            
            if (isLight) {
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
            } else {
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
            }
        });
    }

    // --- Navigation & Mobile Menu ---
    const hamburger = document.getElementById('hamburger');
    const navLinksMenu = document.getElementById('nav-links');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section, footer');

    if (hamburger && navLinksMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navLinksMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (navLinksMenu.classList.contains('active') && !e.target.closest('#main-nav')) {
                hamburger.classList.remove('active');
                navLinksMenu.classList.remove('active');
            }
        });
    }

    // Handle all internal anchor clicks (#home, #portfolio, #services, etc.) smoothly
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;
        const targetHref = anchor.getAttribute('href');
        if (!targetHref || targetHref === '#' || targetHref.length < 2) return;
        
        try {
            const targetElement = document.querySelector(targetHref);
            if (targetElement) {
                e.preventDefault();
                if (window.lenis) {
                    window.lenis.scrollTo(targetElement, { offset: -70, duration: 1.2 });
                } else {
                    const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - 70;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
                if (hamburger && navLinksMenu) {
                    hamburger.classList.remove('active');
                    navLinksMenu.classList.remove('active');
                }
            }
        } catch (err) {
            // Ignore invalid selector
        }
    });

    // Active Section Observer
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 });

        sections.forEach(sec => {
            if (sec.id) observer.observe(sec);
        });
    }

    // 1. Fetch Data
    Promise.all([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/education').then(r => r.json()),
        fetch('/api/certifications').then(r => r.json()),
        fetch('/api/skills').then(r => r.json()),
        fetch('/api/experience').then(r => r.json()),
        fetch('/api/testimonials').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
    ]).then(([profile, projects, stats, edu, certs, skills, experience, testimonials, settings]) => {
        
        // --- Apply Theme ---
        if (settings && settings.theme_name) {
            const root = document.documentElement;
            const themes = {
                'Midnight Blue': { 
                    bg: 'linear-gradient(135deg, #090d16, #1e1b4b, #172554)', 
                    accent: '#60a5fa', 
                    heading: '#ffffff', 
                    body: '#f1f5f9', 
                    grey: '#cbd5e1', 
                    cardBg: 'rgba(15, 23, 42, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Crimson Rudra': { 
                    bg: 'linear-gradient(135deg, #0a0102, #450a0a, #7f1d1d)', 
                    accent: '#f43f5e', 
                    heading: '#ffffff', 
                    body: '#fdf2f8', 
                    grey: '#fce7f3', 
                    cardBg: 'rgba(24, 8, 12, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Emerald Dark': { 
                    bg: 'linear-gradient(135deg, #021a12, #064e3b, #047857)', 
                    accent: '#34d399', 
                    heading: '#ffffff', 
                    body: '#f0fdf4', 
                    grey: '#bbf7d0', 
                    cardBg: 'rgba(6, 30, 20, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Sunset Pink': { 
                    bg: 'linear-gradient(135deg, #1c0c16, #7c2d12, #be185d)', 
                    accent: '#fb7185', 
                    heading: '#ffffff', 
                    body: '#fff1f2', 
                    grey: '#fecdd3', 
                    cardBg: 'rgba(30, 12, 22, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Cyberpunk': { 
                    bg: 'linear-gradient(135deg, #030712, #0e7490, #701a75)', 
                    accent: '#22d3ee', 
                    heading: '#ffffff', 
                    body: '#f0fdfa', 
                    grey: '#cffafe', 
                    cardBg: 'rgba(10, 18, 30, 0.75)',
                    fontPrimary: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif"
                },
                'Royal Purple': { 
                    bg: 'linear-gradient(135deg, #0f0728, #3b0764, #4338ca)', 
                    accent: '#c084fc', 
                    heading: '#ffffff', 
                    body: '#faf5ff', 
                    grey: '#f3e8ff', 
                    cardBg: 'rgba(20, 10, 40, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Golden Amber': { 
                    bg: 'linear-gradient(135deg, #1a0b02, #78350f, #b45309)', 
                    accent: '#fbbf24', 
                    heading: '#ffffff', 
                    body: '#fffbeb', 
                    grey: '#fef3c7', 
                    cardBg: 'rgba(30, 18, 10, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Slate Steel': { 
                    bg: 'linear-gradient(135deg, #090d16, #1e293b, #334155)', 
                    accent: '#94a3b8', 
                    heading: '#ffffff', 
                    body: '#f8fafc', 
                    grey: '#e2e8f0', 
                    cardBg: 'rgba(15, 23, 42, 0.75)',
                    fontPrimary: "'Inter', sans-serif"
                },
                'Rose Gold': { 
                    bg: 'linear-gradient(135deg, #18080c, #831843, #be123c)', 
                    accent: '#fda4af', 
                    heading: '#ffffff', 
                    body: '#fff1f2', 
                    grey: '#ffe4e6', 
                    cardBg: 'rgba(30, 14, 20, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Ocean Teal': { 
                    bg: 'linear-gradient(135deg, #041b24, #115e59, #0f766e)', 
                    accent: '#2dd4bf', 
                    heading: '#ffffff', 
                    body: '#f0fdfa', 
                    grey: '#ccfbf1', 
                    cardBg: 'rgba(4, 28, 36, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Forest Lime': { 
                    bg: 'linear-gradient(135deg, #051a0b, #14532d, #15803d)', 
                    accent: '#86efac', 
                    heading: '#ffffff', 
                    body: '#f0fdf4', 
                    grey: '#dcfce7', 
                    cardBg: 'rgba(6, 26, 12, 0.75)',
                    fontPrimary: "'Plus Jakarta Sans', 'Inter', sans-serif"
                },
                'Deep Space': { 
                    bg: 'linear-gradient(135deg, #050510, #1e1b4b, #2e1065)', 
                    accent: '#a5b4fc', 
                    heading: '#ffffff', 
                    body: '#f5f5ff', 
                    grey: '#e0e7ff', 
                    cardBg: 'rgba(12, 12, 30, 0.75)',
                    fontPrimary: "'Outfit', 'Plus Jakarta Sans', sans-serif"
                }
            };
            const selected = themes[settings.theme_name] || themes['Midnight Blue'];
            if (selected) {
                root.style.setProperty('--gradient-bg', selected.bg);
                root.style.setProperty('--red-accent', selected.accent);
                root.style.setProperty('--heading-color', selected.heading);
                root.style.setProperty('--body-text-color', selected.body);
                root.style.setProperty('--grey-text', selected.grey);
                root.style.setProperty('--text-color', selected.heading);
                root.style.setProperty('--card-bg', selected.cardBg);
                if (selected.fontPrimary) {
                    root.style.setProperty('--font-primary', selected.fontPrimary);
                    document.body.style.fontFamily = selected.fontPrimary;
                }
            }
        }
        // --- Populate DOM ---
        if(profile) {
            const nameParts = profile.name.split(' ');
            let formattedName = profile.name;
            if (nameParts.length > 2) {
                formattedName = `${nameParts[0]} ${nameParts[1]}<br>${nameParts.slice(2).join(' ')}`;
            } else if (nameParts.length === 2) {
                formattedName = `${nameParts[0]}<br>${nameParts[1]}`;
            }
            document.getElementById('main-name').innerHTML = formattedName;
            
            const titleParts = profile.title.split('&');
            if (titleParts.length > 1) {
                document.getElementById('main-title-sub').innerHTML = `${titleParts[0].trim()} &<br>${titleParts[1].trim()}`;
            } else {
                document.getElementById('main-title-sub').innerHTML = profile.title;
            }
            
            if (document.getElementById('header-title')) {
                document.getElementById('header-title').innerHTML = profile.title.replace('&', '<br>');
            }
            document.getElementById('main-desc').innerText = profile.description;
            document.getElementById('main-availability').innerText = profile.availability;
            document.getElementById('signature-name').innerText = profile.quote_footer || (nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase());
            document.getElementById('quote-text').innerText = profile.quote_text || '';
            const isRealUrl = (url) => {
                if (!url) return false;
                const trimmed = url.trim().toLowerCase();
                return trimmed && trimmed !== 'n/a' && trimmed !== 'na' && trimmed !== 'none' && trimmed !== '-' && trimmed !== 'null';
            };

            const formatUrl = (url) => {
                if (!url) return '';
                const trimmed = url.trim();
                if (!trimmed) return '';
                if (/^https?:\/\//i.test(trimmed)) {
                    return trimmed;
                }
                return `https://${trimmed}`;
            };

            const footerAvail = document.getElementById('footer-availability');
            if (footerAvail) {
                footerAvail.innerText = `→ ${profile.availability || 'AVAILABLE FOR INTERNSHIP'}`;
                const userEmail = profile.email || 'rudraa0604@gmail.com';
                footerAvail.href = `mailto:${userEmail}?subject=Internship%20/%20Project%20Inquiry&body=Hi%20Rudra,%0D%0A%0D%0AI%20saw%20your%20portfolio%20and%20would%20like%20to%20discuss...`;
            }
            if (profile.email && document.getElementById('footer-email')) {
                document.getElementById('footer-email').innerHTML = `<a href="mailto:${profile.email}" style="color: inherit; text-decoration: none;">${profile.email}</a>`;
            }
            if (document.getElementById('footer-website')) {
                if (isRealUrl(profile.website)) {
                    const cleanDisplay = profile.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                    document.getElementById('footer-website').innerHTML = `<a href="${formatUrl(profile.website)}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${cleanDisplay || profile.website}</a>`;
                } else {
                    document.getElementById('footer-website').innerText = profile.website || '';
                }
            }
            if (profile.phone && document.getElementById('footer-phone')) {
                const cleanPhone = profile.phone.replace(/[^0-9+]/g, '');
                document.getElementById('footer-phone').innerHTML = `<a href="tel:${cleanPhone}" style="color: inherit; text-decoration: none;">${profile.phone}</a>`;
            }
            if (profile.location && document.getElementById('footer-location')) {
                document.getElementById('footer-location').innerText = profile.location;
            }
            if (document.getElementById('footer-linkedin')) {
                if (isRealUrl(profile.linkedin)) {
                    const cleanDisplay = profile.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                    document.getElementById('footer-linkedin').innerHTML = `<a href="${formatUrl(profile.linkedin)}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${cleanDisplay || profile.linkedin}</a>`;
                } else {
                    document.getElementById('footer-linkedin').innerText = profile.linkedin || '';
                }
            }
            if (profile.whatsapp && document.getElementById('whatsapp-item')) {
                document.getElementById('whatsapp-item').style.display = 'flex';
                const cleanWa = profile.whatsapp.replace(/[^0-9]/g, '');
                document.getElementById('footer-whatsapp').innerHTML = `<a href="https://wa.me/${cleanWa}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${profile.whatsapp}</a>`;
            }
            
            if(profile.profile_photo && document.getElementById('hero-profile-photo')) {
                const img = document.getElementById('hero-profile-photo');
                img.src = profile.profile_photo;
                img.style.display = 'block';
            }

            // Setup Hero Resume Download Button
            const resumeBtn = document.getElementById('hero-resume-btn');
            if (resumeBtn) {
                if (profile.resume_url) {
                    resumeBtn.href = profile.resume_url;
                    resumeBtn.setAttribute('target', '_blank');
                    const rawFilename = profile.resume_url.split('/').pop();
                    const cleanFilename = rawFilename.includes('-') ? rawFilename.split('-').slice(1).join('-') : rawFilename;
                    resumeBtn.setAttribute('download', cleanFilename || 'Resume.pdf');
                } else {
                    resumeBtn.href = '#';
                    resumeBtn.onclick = (e) => {
                        e.preventDefault();
                        alert('Resume has not been uploaded yet in the admin panel.');
                    };
                }
            }
            
            // Render Footer Box
            if (profile.footer_topic || profile.footer_desc) {
                document.getElementById('footer-box-container').style.display = 'block';
                document.getElementById('footer-box-title').innerText = profile.footer_topic || '';
                document.getElementById('footer-box-desc').innerHTML = profile.footer_desc || '';
            }
        }

        const projectGrid = document.getElementById('project-grid');
        if (projectGrid) {
            projectGrid.innerHTML = '';
            projects.forEach((p, idx) => {
                const num = (idx + 1).toString().padStart(2, '0');
                const isVideo = p.image_url && p.image_url.match(/\.(mp4|webm|ogg)$/i);
                let mediaHtml = p.image_url ? 
                    (isVideo ? `<video src="${p.image_url}" autoplay loop muted playsinline class="media-fill"></video>` : `<img src="${p.image_url}" class="media-fill" alt="${p.title}">`) 
                    : `<div class="media-text">${p.title.split(' ')[0]}</div>`;
                
                const formatUrl = (url) => {
                    if (!url) return '';
                    const trimmed = url.trim();
                    if (!trimmed) return '';
                    if (/^https?:\/\//i.test(trimmed)) return trimmed;
                    return `https://${trimmed}`;
                };

                const targetLink = p.project_url || p.live_link || '';
                const isRealUrl = targetLink && targetLink.trim() && targetLink.trim() !== 'null' && targetLink.trim() !== 'undefined';

                if (isRealUrl) {
                    const fullUrl = formatUrl(targetLink);
                    projectGrid.innerHTML += `
                        <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="project-card" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; cursor: pointer;">
                            <div class="project-img">${mediaHtml}</div>
                            <div class="project-info">
                                <div class="project-num">${num}</div>
                                <div><h4>${p.title}</h4><p>${p.category}</p></div>
                                <div class="arrow">↗</div>
                            </div>
                        </a>`;
                } else {
                    projectGrid.innerHTML += `
                        <div class="project-card">
                            <div class="project-img">${mediaHtml}</div>
                            <div class="project-info">
                                <div class="project-num">${num}</div>
                                <div><h4>${p.title}</h4><p>${p.category}</p></div>
                                <div class="arrow">→</div>
                            </div>
                        </div>`;
                }
            });
        }

        const statList = document.getElementById('hero-stats');
        stats.forEach(s => statList.innerHTML += `<div class="stat"><h3>${s.value}</h3><p>${s.description}</p></div>`);

        const eduCont = document.getElementById('edu-container');
        edu.forEach(e => eduCont.innerHTML += `<div class="edu-item"><div><h4>${e.degree}</h4><p>${e.institution}</p></div><span class="year">${e.year}</span></div>`);

        const certCont = document.getElementById('cert-container');
        if (certCont) {
            certCont.className = 'cert-grid';
            certCont.innerHTML = '';
            certs.forEach(c => {
                const imgHtml = c.image_url 
                    ? `<div class="cert-img-wrap" onclick="window.open('${c.image_url}', '_blank')" title="Click to view full certificate">
                         <img src="${c.image_url}" alt="${c.name}" loading="lazy">
                       </div>`
                    : `<div class="cert-img-wrap">
                         <div class="cert-no-img">
                           <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                             <circle cx="12" cy="8" r="7"></circle>
                             <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                           </svg>
                           <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Verified</span>
                         </div>
                       </div>`;

                certCont.innerHTML += `
                    <div class="cert-card">
                        ${imgHtml}
                        <div class="cert-details">
                            <h4>${c.name}</h4>
                            <p>${c.issuer}</p>
                        </div>
                    </div>
                `;
            });
        }

        // --- Populate Skills (Modern Dual-Box Competencies) ---
        const techSkillsGrid = document.getElementById('technical-skills-grid');
        const softSkillsGrid = document.getElementById('soft-skills-grid');
        const techCountBadge = document.getElementById('tech-skills-count');
        const softCountBadge = document.getElementById('soft-skills-count');

        const getSkillIconSvg = (skill) => {
            const name = (skill.name || '').toLowerCase();
            const rawIcon = skill.icon || '';

            if (name.includes('python')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.91 2c-5.06 0-4.74 2.19-4.74 2.19l.01 2.27h4.82v.69H5.16S2 6.79 2 11.93c0 5.14 2.76 4.96 2.76 4.96h1.65v-2.31s-.09-2.76 2.71-2.76h4.67s2.58.04 2.58-2.54V4.54S16.98 2 11.91 2zm-2.6 1.48a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9zm2.78 18.52c5.06 0 4.74-2.19 4.74-2.19l-.01-2.27H12v-.69h6.84S22 17.21 22 12.07c0-5.14-2.76-4.96-2.76-4.96h-1.65v2.31s.09 2.76-2.71 2.76H10.2s-2.58-.04-2.58 2.54v4.74s-.61 2.54 4.47 2.54zm2.6-1.48a.95.95 0 1 1 0-1.9.95.95 0 0 1 0 1.9z"/></svg>`;
            }
            if (name.includes('ai') || name.includes('vibe') || name.includes('prompt') || name.includes('gpt')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path></svg>`;
            }
            if (name.includes('git') || name.includes('github')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
            }
            if (name.includes('power bi') || name.includes('tableau') || name.includes('analytics') || name.includes('data')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`;
            }
            if (name.includes('html') || name.includes('css') || name.includes('javascript') || name.includes('js') || name.includes('web')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><path d="m14 9 3 3-3 3"></path></svg>`;
            }
            if (name.includes('security') || name.includes('hack') || name.includes('cyber') || name.includes('nmap') || name.includes('wireshark')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
            }
            if (name.includes('design') || name.includes('photoshop') || name.includes('illustrator') || name.includes('ui') || name.includes('figma')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"></path></svg>`;
            }
            if (name.includes('communication') || name.includes('articulation') || name.includes('presentation')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="12" y2="14"></line></svg>`;
            }
            if (name.includes('team') || name.includes('collaboration')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
            }
            if (name.includes('leader') || name.includes('management')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>`;
            }
            if (name.includes('time') || name.includes('project') || name.includes('planning')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
            }
            if (name.includes('quick') || name.includes('learning') || name.includes('adapt') || name.includes('fast')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
            }
            if (name.includes('problem') || name.includes('critical') || name.includes('thinking')) {
                return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path></svg>`;
            }

            if (rawIcon && rawIcon.length <= 4) {
                return `<span>${rawIcon}</span>`;
            }

            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        };

        const renderCompetencySkillCard = (skill) => {
            const iconSvg = getSkillIconSvg(skill);
            const isSoft = skill.category === 'soft';
            const defaultSub = isSoft ? 'CORE COMPETENCY' : 'TECHNICAL TOOL';
            const subLabel = (skill.description && skill.description.length <= 25) ? skill.description : defaultSub;

            return `
                <div class="competency-skill-item">
                    <div class="skill-item-icon">
                        ${iconSvg}
                    </div>
                    <div class="skill-item-text">
                        <span class="skill-item-name">${skill.name}</span>
                        <span class="skill-item-sub">${subLabel}</span>
                    </div>
                </div>
            `;
        };

        if (techSkillsGrid && softSkillsGrid) {
            techSkillsGrid.innerHTML = '';
            softSkillsGrid.innerHTML = '';

            const techSkills = (skills || []).filter(s => (s.category || 'technical') === 'technical');
            const softSkills = (skills || []).filter(s => s.category === 'soft');

            if (techCountBadge) techCountBadge.textContent = `${techSkills.length} SKILLS`;
            if (softCountBadge) softCountBadge.textContent = `${softSkills.length} SKILLS`;

            if (techSkills.length === 0) {
                techSkillsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--grey-text); padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 12px;">No technical skills added yet.</div>`;
            } else {
                techSkills.forEach(s => techSkillsGrid.innerHTML += renderCompetencySkillCard(s));
            }

            if (softSkills.length === 0) {
                softSkillsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--grey-text); padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 12px;">No soft skills added yet.</div>`;
            } else {
                softSkills.forEach(s => softSkillsGrid.innerHTML += renderCompetencySkillCard(s));
            }

            // Competency Filter Tabs (All Competencies, Technical, Soft)
            const tabAll = document.getElementById('tab-all-skills');
            const tabTech = document.getElementById('tab-tech-skills');
            const tabSoft = document.getElementById('tab-soft-skills');
            const compContainer = document.getElementById('competencies-container');

            const filterCompetencyTab = (filterType) => {
                [tabAll, tabTech, tabSoft].forEach(btn => btn && btn.classList.remove('active'));
                if (!compContainer) return;

                compContainer.classList.remove('single-tech', 'single-soft');

                if (filterType === 'all') {
                    if (tabAll) tabAll.classList.add('active');
                } else if (filterType === 'technical') {
                    if (tabTech) tabTech.classList.add('active');
                    compContainer.classList.add('single-tech');
                } else if (filterType === 'soft') {
                    if (tabSoft) tabSoft.classList.add('active');
                    compContainer.classList.add('single-soft');
                }
            };

            if (tabAll) tabAll.addEventListener('click', () => filterCompetencyTab('all'));
            if (tabTech) tabTech.addEventListener('click', () => filterCompetencyTab('technical'));
            if (tabSoft) tabSoft.addEventListener('click', () => filterCompetencyTab('soft'));
        }

        // --- Populate Experience Slider (Slides) ---
        const expTrack = document.getElementById('experience-track');
        const expPrevBtn = document.getElementById('exp-prev-btn');
        const expNextBtn = document.getElementById('exp-next-btn');
        const expIndicator = document.getElementById('exp-slide-indicator');
        const expDotsContainer = document.getElementById('exp-dots-container');

        if (expTrack) {
            expTrack.innerHTML = '';
            const expList = experience && experience.length > 0 ? experience : [];

            if (expList.length === 0) {
                expTrack.innerHTML = `<div style="text-align: center; color: var(--grey-text); padding: 2.5rem; width: 100%; background: var(--card-bg); border-radius: 14px; border: 1px dashed var(--border-color);">No experience added yet. Add your journey in the admin panel!</div>`;
            } else {
                expList.forEach(item => {
                    const badgeHtml = item.badge ? `<div class="exp-card-badge-pill">${item.badge}</div>` : '';
                    const duration = item.duration || '';
                    const loc = item.location ? ` • ${item.location}` : '';
                    const skillsTags = item.skills 
                        ? item.skills.split(',').map(tag => tag.trim() ? `<span class="exp-skill-tag">${tag.trim()}</span>` : '').join('')
                        : '';

                    expTrack.innerHTML += `
                        <div class="experience-slide">
                            <div class="experience-card">
                                <div>
                                    <div class="exp-card-header">
                                        <div>
                                            ${badgeHtml}
                                            <h3 class="exp-card-role">${item.role}</h3>
                                            <div class="exp-card-company">
                                                <span>🏢</span> ${item.company}
                                            </div>
                                        </div>
                                        ${duration ? `<div class="exp-card-duration-badge">📅 ${duration}${loc}</div>` : ''}
                                    </div>
                                    ${item.description ? `<p class="exp-card-desc">${item.description}</p>` : ''}
                                </div>
                                ${skillsTags ? `<div class="exp-card-skills">${skillsTags}</div>` : ''}
                            </div>
                        </div>
                    `;
                });

                // Slider state & update logic
                let currentSlide = 0;
                const getVisibleSlides = () => window.innerWidth >= 900 ? 2 : 1;
                const totalItems = expList.length;

                const updateSlider = () => {
                    const visible = getVisibleSlides();
                    const maxSlide = Math.max(0, totalItems - visible);
                    if (currentSlide > maxSlide) currentSlide = maxSlide;
                    if (currentSlide < 0) currentSlide = 0;

                    const slideEl = expTrack.querySelector('.experience-slide');
                    const slideWidth = slideEl ? slideEl.getBoundingClientRect().width : 0;
                    const gap = 24;
                    const offset = currentSlide * (slideWidth + gap);
                    expTrack.style.transform = `translateX(-${offset}px)`;

                    // Indicator counter
                    if (expIndicator) {
                        const currentNum = (currentSlide + 1).toString().padStart(2, '0');
                        const totalNum = Math.max(1, maxSlide + 1).toString().padStart(2, '0');
                        expIndicator.textContent = `${currentNum} / ${totalNum}`;
                    }

                    // Dots update
                    if (expDotsContainer) {
                        const dots = expDotsContainer.querySelectorAll('.exp-dot');
                        dots.forEach((dot, idx) => {
                            if (idx === currentSlide) dot.classList.add('active');
                            else dot.classList.remove('active');
                        });
                    }
                };

                const renderDots = () => {
                    if (!expDotsContainer) return;
                    expDotsContainer.innerHTML = '';
                    const visible = getVisibleSlides();
                    const totalDots = Math.max(1, totalItems - visible + 1);

                    for (let i = 0; i < totalDots; i++) {
                        const dot = document.createElement('button');
                        dot.className = `exp-dot ${i === currentSlide ? 'active' : ''}`;
                        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                        dot.addEventListener('click', () => {
                            currentSlide = i;
                            updateSlider();
                        });
                        expDotsContainer.appendChild(dot);
                    }
                };

                if (expPrevBtn) {
                    expPrevBtn.addEventListener('click', () => {
                        const visible = getVisibleSlides();
                        const maxSlide = Math.max(0, totalItems - visible);
                        currentSlide = (currentSlide - 1 + (maxSlide + 1)) % (maxSlide + 1);
                        updateSlider();
                    });
                }

                if (expNextBtn) {
                    expNextBtn.addEventListener('click', () => {
                        const visible = getVisibleSlides();
                        const maxSlide = Math.max(0, totalItems - visible);
                        currentSlide = (currentSlide + 1) % (maxSlide + 1);
                        updateSlider();
                    });
                }

                // Touch swipe / drag support
                let touchStartX = 0;
                let touchEndX = 0;
                const sliderContainer = document.getElementById('exp-slider-container');
                if (sliderContainer) {
                    sliderContainer.addEventListener('touchstart', (e) => {
                        touchStartX = e.changedTouches[0].screenX;
                    }, { passive: true });

                    sliderContainer.addEventListener('touchend', (e) => {
                        touchEndX = e.changedTouches[0].screenX;
                        const diff = touchStartX - touchEndX;
                        if (Math.abs(diff) > 45) {
                            const visible = getVisibleSlides();
                            const maxSlide = Math.max(0, totalItems - visible);
                            if (diff > 0 && currentSlide < maxSlide) {
                                currentSlide++;
                                updateSlider();
                            } else if (diff < 0 && currentSlide > 0) {
                                currentSlide--;
                                updateSlider();
                            }
                        }
                    }, { passive: true });
                }

                window.addEventListener('resize', () => {
                    renderDots();
                    updateSlider();
                });

                renderDots();
                updateSlider();
            }
        }

        const skillCont = document.getElementById('marquee-content');
        skills.forEach(s => skillCont.innerHTML += `<span>${s.name} • </span>`);
        // Duplicate for infinite scroll
        skillCont.innerHTML += skillCont.innerHTML;

        // Fetch Reviews / Testimonials (Approved only)
        fetch('/api/reviews?status=approved')
            .then(r => r.json())
            .then(reviews => {
                const testCont = document.getElementById('test-container');
                if (testCont) {
                    testCont.innerHTML = '';
                    const items = reviews && reviews.length > 0 ? reviews : [];
                    if (items.length === 0) {
                        testCont.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--grey-text); padding: 2.5rem; background: var(--card-bg); border-radius: 12px; border: 1px dashed var(--border-color);">No reviews yet. Be the first to give a review!</div>`;
                    } else {
                        items.forEach(t => {
                            const reviewText = t.review_text || t.quote || '';
                            const clientName = t.name || t.client_name || '';
                            const clientTitle = t.designation || t.client_title || '';
                            const rating = parseInt(t.rating) || 5;
                            const starsHtml = rating > 0 ? `<div class="stars-display">${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}</div>` : '';

                            testCont.innerHTML += `
                                <div class="testimonial-card">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                        <div class="quote-icon">“</div>
                                        ${starsHtml}
                                    </div>
                                    <p class="feedback">"${reviewText}"</p>
                                    <div class="client-info">
                                        <h4>${clientName}</h4>
                                        <p>${clientTitle}</p>
                                    </div>
                                </div>
                            `;
                        });
                    }
                }
            })
            .catch(err => console.error('Error fetching reviews:', err));

        // --- Review Modal Handling ---
        const reviewModal = document.getElementById('review-modal');
        const openReviewModalBtn = document.getElementById('open-review-modal-btn');
        const closeReviewModalBtn = document.getElementById('close-review-modal-btn');
        const reviewForm = document.getElementById('public-review-form');
        const reviewText = document.getElementById('review-text');
        const charCount = document.getElementById('review-char-count');
        const reviewStatus = document.getElementById('review-form-status');
        const starButtons = document.querySelectorAll('.star-btn');
        const reviewRatingInput = document.getElementById('review-rating');

        const updateStars = (val) => {
            starButtons.forEach(btn => {
                const r = parseInt(btn.dataset.rating);
                if (r <= val) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        };

        if (openReviewModalBtn && reviewModal) {
            openReviewModalBtn.addEventListener('click', () => {
                reviewModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                if (reviewStatus) reviewStatus.style.display = 'none';
            });

            const closeReviewModal = () => {
                reviewModal.style.display = 'none';
                document.body.style.overflow = '';
            };

            if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', closeReviewModal);

            reviewModal.addEventListener('click', (e) => {
                if (e.target === reviewModal) closeReviewModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && reviewModal.style.display === 'flex') {
                    closeReviewModal();
                }
            });

            // Character counter
            if (reviewText && charCount) {
                reviewText.addEventListener('input', () => {
                    const currentLen = reviewText.value.length;
                    charCount.textContent = `${currentLen} / 300`;
                    if (currentLen >= 280) charCount.style.color = 'var(--red-accent)';
                    else charCount.style.color = 'var(--grey-text)';
                });
            }

            // Star rating picker
            if (starButtons.length > 0 && reviewRatingInput) {
                starButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const ratingVal = parseInt(btn.dataset.rating);
                        reviewRatingInput.value = ratingVal;
                        updateStars(ratingVal);
                    });
                    btn.addEventListener('mouseenter', () => {
                        const ratingVal = parseInt(btn.dataset.rating);
                        starButtons.forEach(b => {
                            const r = parseInt(b.dataset.rating);
                            if (r <= ratingVal) b.classList.add('hover');
                            else b.classList.remove('hover');
                        });
                    });
                    btn.addEventListener('mouseleave', () => {
                        starButtons.forEach(b => b.classList.remove('hover'));
                    });
                });
            }

            // Form submit
            if (reviewForm) {
                reviewForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const submitBtn = document.getElementById('submit-review-btn');
                    const origText = submitBtn ? submitBtn.textContent : 'Submit Review';
                    
                    const hpVal = document.getElementById('review-website-hp')?.value || '';
                    const payload = {
                        name: document.getElementById('review-name').value,
                        designation: document.getElementById('review-designation').value,
                        review_text: document.getElementById('review-text').value,
                        rating: parseInt(reviewRatingInput.value) || 5,
                        website_hp: hpVal
                    };

                    try {
                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.textContent = 'Submitting...';
                        }

                        const res = await fetch('/api/reviews', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const data = await res.json();

                        if (res.ok) {
                            reviewStatus.style.display = 'block';
                            reviewStatus.style.background = 'rgba(16, 185, 129, 0.15)';
                            reviewStatus.style.color = '#10b981';
                            reviewStatus.style.border = '1px solid #10b981';
                            reviewStatus.textContent = data.message || "Thanks! Your review will appear after approval.";
                            reviewForm.reset();
                            if (charCount) charCount.textContent = '0 / 300';
                            reviewRatingInput.value = 5;
                            updateStars(5);

                            setTimeout(() => {
                                closeReviewModal();
                            }, 2500);
                        } else {
                            reviewStatus.style.display = 'block';
                            reviewStatus.style.background = 'rgba(239, 68, 68, 0.15)';
                            reviewStatus.style.color = '#ef4444';
                            reviewStatus.style.border = '1px solid #ef4444';
                            reviewStatus.textContent = data.error || "Failed to submit review. Please try again.";
                        }
                    } catch (err) {
                        reviewStatus.style.display = 'block';
                        reviewStatus.style.background = 'rgba(239, 68, 68, 0.15)';
                        reviewStatus.style.color = '#ef4444';
                        reviewStatus.style.border = '1px solid #ef4444';
                        reviewStatus.textContent = "Network error. Please try again.";
                    } finally {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = origText;
                        }
                    }
                });
            }
        }



        // --- Initialize GSAP Animations ---
        initAnimations();

        // --- Fetch Custom Content ---
        fetch('/api/custom_content')
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('custom-content-container');
                if(container && data && data.length > 0) {
                    let html = '';
                    data.forEach(content => {
                        html += `
                            <div class="custom-block" style="margin-bottom: 2rem; max-width: 800px; margin-left: auto; margin-right: auto; text-align: center;">
                                <h2 style="margin-bottom: 1rem; color: var(--heading-color);">${content.title}</h2>
                                <div style="color: var(--body-text-color); line-height: 1.6;">${content.content}</div>
                            </div>
                        `;
                    });
                    container.innerHTML = html;
                }
            })
            .catch(err => console.error(err));

    }).catch(err => console.error(err));
});

function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Preloader
    let progress = { val: 0 };
    const counter = document.querySelector('.preloader-counter');
    
    gsap.to(progress, {
        val: 100,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
            counter.innerText = Math.floor(progress.val) + "%";
        },
        onComplete: () => {
            gsap.to(counter, { opacity: 0, duration: 0.5 });
            gsap.to('.panel-left', { xPercent: -100, duration: 1.5, ease: "power4.inOut" });
            gsap.to('.panel-right', { xPercent: 100, duration: 1.5, ease: "power4.inOut" });
            gsap.set('.preloader', { display: 'none', delay: 1.5 });
            
            // Trigger Hero Animations after wipe
            playHeroAnimations();
        }
    });

    // 2. Text Splitting & Reveal
    function playHeroAnimations() {
        if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        
        const title = document.getElementById('main-name');
        const text = title.innerText;
        title.innerHTML = '';
        
        const words = text.split('\n');
        words.forEach((word, idx) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'split-word';
            const chars = word.split('');
            chars.forEach(char => {
                const charSpan = document.createElement('span');
                charSpan.className = 'split-char';
                charSpan.innerText = char === ' ' ? '\u00A0' : char;
                wordSpan.appendChild(charSpan);
            });
            title.appendChild(wordSpan);
            if(idx < words.length - 1) title.appendChild(document.createElement('br'));
        });

        gsap.to('.split-char', {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.05,
            ease: "power4.out"
        });
        
        gsap.from('.subtitle, .description, .worldwide, .hero-stats', {
            y: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            delay: 0.5,
            ease: "power2.out"
        });
    }

    // 3. Horizontal Scroll Projects
    const projectsWrapper = document.querySelector('.project-wrapper');
    const projectsSection = document.querySelector('.projects');
    
    if (projectsWrapper && window.innerWidth > 768) {
        let scrollTween = gsap.to(projectsWrapper, {
            x: () => -(projectsWrapper.scrollWidth - window.innerWidth + 40),
            ease: "none",
            scrollTrigger: {
                trigger: projectsSection,
                pin: true,
                scrub: 1,
                end: () => "+=" + projectsWrapper.scrollWidth
            }
        });
    }

    // 4. Parallax Background & Fade ins
    gsap.utils.toArray('.edu-item, .testimonial-card, .process-step').forEach(element => {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });
}
