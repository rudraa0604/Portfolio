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

    // 1. Fetch Data
    Promise.all([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/education').then(r => r.json()),
        fetch('/api/certifications').then(r => r.json()),
        fetch('/api/skills').then(r => r.json()),
        fetch('/api/testimonials').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
    ]).then(([profile, projects, stats, edu, certs, skills, testimonials, settings]) => {
        
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
            document.getElementById('signature-name').innerText = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
            document.getElementById('quote-text').innerText = profile.quote_text || '';
            if (document.getElementById('quote-footer')) {
                document.getElementById('quote-footer').innerHTML = profile.quote_footer || '';
            }
            document.getElementById('footer-availability').innerText = `→ ${profile.availability}`;
            document.getElementById('footer-email').innerHTML = `<a href="mailto:${profile.email}" style="color: inherit; text-decoration: none;">${profile.email}</a>`;
            document.getElementById('footer-website').innerText = profile.website;
            document.getElementById('footer-phone').innerText = profile.phone;
            document.getElementById('footer-location').innerText = profile.location;
            if (profile.linkedin) {
                document.getElementById('footer-linkedin').innerHTML = `<a href="${profile.linkedin}" target="_blank" style="color: inherit; text-decoration: none;">${profile.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a>`;
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
        projects.forEach((p, idx) => {
            const num = (idx + 1).toString().padStart(2, '0');
            const isVideo = p.image_url && p.image_url.match(/\.(mp4|webm|ogg)$/i);
            let mediaHtml = p.image_url ? 
                (isVideo ? `<video src="${p.image_url}" autoplay loop muted playsinline class="media-fill"></video>` : `<img src="${p.image_url}" class="media-fill" alt="${p.title}">`) 
                : `<div class="media-text">${p.title.split(' ')[0]}</div>`;
            projectGrid.innerHTML += `
                <div class="project-card">
                    <div class="project-img">${mediaHtml}</div>
                    <div class="project-info">
                        <div class="project-num">${num}</div><div><h4>${p.title}</h4><p>${p.category}</p></div><div class="arrow">→</div>
                    </div>
                </div>`;
        });

        const statList = document.getElementById('hero-stats');
        stats.forEach(s => statList.innerHTML += `<div class="stat"><h3>${s.value}</h3><p>${s.description}</p></div>`);

        const eduCont = document.getElementById('edu-container');
        edu.forEach(e => eduCont.innerHTML += `<div class="edu-item"><div><h4>${e.degree}</h4><p>${e.institution}</p></div><span class="year">${e.year}</span></div>`);

        const certCont = document.getElementById('cert-container');
        certs.forEach(c => certCont.innerHTML += `<div class="edu-item" style="margin-bottom:0.8rem"><div><h4 style="font-size:0.95rem">${c.name}</h4><p style="font-size:0.8rem">${c.issuer}</p></div></div>`);

        const skillCont = document.getElementById('marquee-content');
        skills.forEach(s => skillCont.innerHTML += `<span>${s.name} • </span>`);
        // Duplicate for infinite scroll
        skillCont.innerHTML += skillCont.innerHTML;

        const testCont = document.getElementById('test-container');
        testimonials.forEach(t => testCont.innerHTML += `<div class="testimonial-card"><div class="quote-icon">“</div><p class="feedback">"${t.quote}"</p><div class="client-info"><h4>${t.client_name}</h4><p>${t.client_title}</p></div></div>`);

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
                        // We can use section_placement if needed, but for now just render it
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
