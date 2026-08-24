document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const hamburger = document.getElementById('hamburger');
    const navLinksMenu = document.getElementById('nav-links');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section, footer');

    // Toggle Mobile Menu
    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navLinksMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinksMenu && navLinksMenu.classList.contains('active') && !e.target.closest('#main-nav')) {
            hamburger.classList.remove('active');
            navLinksMenu.classList.remove('active');
        }
    });

    // Smooth Scrolling & Close menu on click
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // If using Lenis, we could use lenis.scrollTo, but native scrollIntoView works fine
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }

            if (hamburger) {
                hamburger.classList.remove('active');
                navLinksMenu.classList.remove('active');
            }
        });
    });

    // Intersection Observer for Active State
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

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
    }, observerOptions);

    sections.forEach(section => {
        if (section.id) observer.observe(section);
    });
    
    // Logo scroll to top
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    const currentMode = localStorage.getItem('themeMode') || 'dark';
    if (currentMode === 'light') {
        document.body.classList.add('light-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('themeMode', isLight ? 'light' : 'dark');
            
            if (isLight) {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        });
    }

    // GSAP Scroll Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Animate section headers
        gsap.utils.toArray('.section-header, .middle-section h2').forEach(header => {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });
        });

        // Animate cards (projects, services, testimonials)
        gsap.utils.toArray('.project-img, .testimonial-card, .edu-item, .process-step').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out"
            });
        });
    }

    // 0. Load Theme
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data && data.theme_name) {
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
                
                const selected = themes[data.theme_name] || themes['Midnight Blue'];
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
        })
        .catch(err => console.error("Error fetching theme:", err));

    // 1. Profile & Background Media
    fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
            if (!data) return;
            const nameParts = data.name ? data.name.split(' ') : [''];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            
            if(document.getElementById('main-name')) {
                document.getElementById('main-name').innerHTML = `${firstName}<br>${lastName}`;
                document.getElementById('main-name').classList.add('gradient-text');
                document.title = data.name + ' - Portfolio';
            }
            
            if (data.title && document.getElementById('main-title-sub')) {
                const titleParts = data.title.split('&');
                if (titleParts.length > 1) {
                    document.getElementById('main-title-sub').innerHTML = `${titleParts[0].trim()} &<br>${titleParts[1].trim()}`;
                } else {
                    document.getElementById('main-title-sub').innerHTML = data.title;
                }
            }
            
            if(document.getElementById('header-title')) document.getElementById('header-title').innerHTML = (data.title || '').replace('&', '<br>');
            if(document.getElementById('main-desc')) document.getElementById('main-desc').innerText = data.description || '';
            if(document.getElementById('main-availability')) document.getElementById('main-availability').innerText = data.availability || '';
            
            if (document.getElementById('signature-name') && firstName) {
                document.getElementById('signature-name').innerText = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            }
            if(document.getElementById('quote-text')) document.getElementById('quote-text').innerText = data.quote_text || '';
            if(document.getElementById('quote-footer')) document.getElementById('quote-footer').innerHTML = data.quote_footer || '';
            
            const isRealUrl = (url) => {
                if (!url) return false;
                const trimmed = url.trim().toLowerCase();
                return trimmed && trimmed !== 'n/a' && trimmed !== 'na' && trimmed !== 'none' && trimmed !== '-' && trimmed !== 'null';
            };

            const formatUrl = (url) => {
                if (!url) return '';
                const trimmed = url.trim();
                if (!trimmed) return '';
                if (/^https?:\/\//i.test(trimmed)) return trimmed;
                return `https://${trimmed}`;
            };

            if(document.getElementById('footer-availability')) document.getElementById('footer-availability').innerText = `→ ${data.availability || ''}`;
            if(document.getElementById('footer-email')) document.getElementById('footer-email').innerHTML = `<a href="mailto:${data.email}" style="color: inherit; text-decoration: none;">${data.email || ''}</a>`;
            if(document.getElementById('footer-website')) {
                if (isRealUrl(data.website)) {
                    const cleanDisplay = data.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                    document.getElementById('footer-website').innerHTML = `<a href="${formatUrl(data.website)}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${cleanDisplay || data.website}</a>`;
                } else {
                    document.getElementById('footer-website').innerText = data.website || '';
                }
            }
            if(document.getElementById('footer-phone') && data.phone) {
                const cleanPhone = data.phone.replace(/[^0-9+]/g, '');
                document.getElementById('footer-phone').innerHTML = `<a href="tel:${cleanPhone}" style="color: inherit; text-decoration: none;">${data.phone}</a>`;
            }
            if(document.getElementById('footer-location')) document.getElementById('footer-location').innerText = data.location || '';
            if(document.getElementById('footer-linkedin')) {
                if (isRealUrl(data.linkedin)) {
                    const cleanDisplay = data.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                    document.getElementById('footer-linkedin').innerHTML = `<a href="${formatUrl(data.linkedin)}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${cleanDisplay || data.linkedin}</a>`;
                } else {
                    document.getElementById('footer-linkedin').innerText = data.linkedin || '';
                }
            }
            
            if(data.whatsapp && document.getElementById('whatsapp-item')) {
                document.getElementById('whatsapp-item').style.display = 'flex';
                const cleanWa = data.whatsapp.replace(/[^0-9]/g, '');
                document.getElementById('footer-whatsapp').innerHTML = `<a href="https://wa.me/${cleanWa}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${data.whatsapp}</a>`;
            }

            if(data.profile_photo && document.getElementById('hero-profile-photo')) {
                const img = document.getElementById('hero-profile-photo');
                img.src = data.profile_photo;
                img.style.display = 'block';
            }

            // Setup Hero Resume Download Button
            const resumeBtn = document.getElementById('hero-resume-btn');
            if (resumeBtn) {
                if (data.resume_url) {
                    resumeBtn.href = data.resume_url;
                    resumeBtn.setAttribute('target', '_blank');
                    const rawFilename = data.resume_url.split('/').pop();
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

            // Apply Background Media (GIF/Image/Video)
            if (data.background_url) {
                const isVideo = data.background_url.match(/\.(mp4|webm|ogg)$/i);
                if (isVideo) {
                    // Replace img with video element dynamically
                    const bgGif = document.getElementById('bg-gif');
                    if (bgGif) {
                        const video = document.createElement('video');
                        video.src = data.background_url;
                        video.id = 'bg-gif';
                        video.autoplay = true;
                        video.loop = true;
                        video.muted = true;
                        video.playsInline = true;
                        video.style.cssText = bgGif.style.cssText;
                        video.className = bgGif.className;
                        video.style.display = 'block';
                        bgGif.parentNode.replaceChild(video, bgGif);
                    }
                } else {
                    const bgGif = document.getElementById('bg-gif');
                    if (bgGif) {
                        bgGif.onload = () => { bgGif.style.display = 'block'; };
                        bgGif.onerror = () => { bgGif.style.display = 'none'; };
                        bgGif.src = data.background_url;
                    }
                }
            }
        })
        .catch(err => console.error("Error fetching profile:", err));

    // Helper for rendering lists
    const fetchAndRender = (endpoint, containerId, renderFunc) => {
        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById(containerId);
                if (!container) return;
                container.innerHTML = '';
                data.forEach((item, idx) => {
                    container.innerHTML += renderFunc(item, idx);
                });
            })
            .catch(err => console.error(`Error fetching ${endpoint}:`, err));
    };

    // 2. Services
    fetchAndRender('/api/skills', 'services-grid', (s) => `
        <div class="project-card" style="padding: 2rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px;">
            <h3 style="color: var(--red-accent); margin-bottom: 1rem;">${s.name}</h3>
            <p style="color: var(--grey-text);">${s.price || 'Contact for pricing'}</p>
        </div>
    `);

    // 3. Projects
    fetchAndRender('/api/projects', 'project-grid', (p, index) => {
        const num = (index + 1).toString().padStart(2, '0');
        const isVideo = p.image_url && p.image_url.match(/\.(mp4|webm|ogg)$/i);
        let mediaHtml = '';
        if (p.image_url) {
            if (isVideo) {
                mediaHtml = `<video src="${p.image_url}" autoplay loop muted playsinline class="media-fill"></video>`;
            } else {
                mediaHtml = `<img src="${p.image_url}" class="media-fill" alt="${p.title}">`;
            }
        } else {
            mediaHtml = `<div class="media-text">${p.title.split(' ')[0]}</div>`;
        }

        const formatUrl = (url) => {
            if (!url) return '';
            const trimmed = url.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            return `https://${trimmed}`;
        };

        if (p.project_url && p.project_url.trim()) {
            const fullUrl = formatUrl(p.project_url);
            return `
                <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="project-card" style="text-decoration: none; color: inherit; display: flex; flex-direction: column;">
                    <div class="project-img">${mediaHtml}</div>
                    <div class="project-info">
                        <div class="project-num">${num}</div>
                        <div>
                            <h4>${p.title}</h4>
                            <p>${p.category}</p>
                        </div>
                        <div class="arrow">↗</div>
                    </div>
                </a>`;
        }
        return `
            <div class="project-card">
                <div class="project-img">${mediaHtml}</div>
                <div class="project-info">
                    <div class="project-num">${num}</div>
                    <div>
                        <h4>${p.title}</h4>
                        <p>${p.category}</p>
                    </div>
                    <div class="arrow">→</div>
                </div>
            </div>`;
    });

    // 4. Custom Content Rendering
    fetchAndRender('/api/custom_content', 'custom-content-container', c => `
        <div class="custom-block" style="margin-bottom: 3rem;">
            ${c.title ? `<h3 style="color: var(--red-accent); margin-bottom: 1rem;">${c.title}</h3>` : ''}
            <div style="color: var(--text-color); line-height: 1.6;">${c.content}</div>
        </div>
    `);

    // 5. Stats
    fetchAndRender('/api/stats', 'hero-stats', s => `
        <div class="stat">
            <h3>${s.value}</h3>
            <p>${s.description}</p>
        </div>`);

    // 6. Education
    fetchAndRender('/api/education', 'edu-container', e => `
        <div class="edu-item">
            <div>
                <h4>${e.degree}</h4>
                <p>${e.institution}</p>
            </div>
            <span class="year">${e.year}</span>
        </div>`);

    // 7. Certifications
    fetchAndRender('/api/certifications', 'cert-container', c => `
        <div class="edu-item" style="margin-bottom: 0.8rem">
            <div>
                <h4 style="font-size: 0.95rem">${c.name}</h4>
                <p style="font-size: 0.8rem">${c.issuer}</p>
            </div>
        </div>`);

    // 8. Testimonials
    fetchAndRender('/api/testimonials', 'test-container', t => `
        <div class="testimonial-card">
            <div class="quote-icon">“</div>
            <p class="feedback">"${t.quote}"</p>
            <div class="client-info">
                <h4>${t.client_name}</h4>
                <p>${t.client_title}</p>
            </div>
        </div>`);
});
