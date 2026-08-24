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

            document.getElementById('footer-availability').innerText = `→ ${profile.availability || ''}`;
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

                if (p.project_url && p.project_url.trim()) {
                    const fullUrl = formatUrl(p.project_url);
                    projectGrid.innerHTML += `
                        <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="project-card" style="text-decoration: none; color: inherit; display: flex; flex-direction: column;">
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
                    
                    const payload = {
                        name: document.getElementById('review-name').value,
                        designation: document.getElementById('review-designation').value,
                        review_text: document.getElementById('review-text').value,
                        rating: parseInt(reviewRatingInput.value) || 5
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
