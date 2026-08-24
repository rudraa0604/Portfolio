document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.add('active');
        });
    });

    // --- Custom File Input UX ---
    const setupFileInput = (inputId, labelId) => {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        if (input && label) {
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    label.textContent = e.target.files[0].name;
                    label.style.borderColor = 'var(--accent)';
                    label.style.color = 'var(--accent)';
                } else {
                    label.textContent = 'Choose file...';
                    label.style.borderColor = '';
                    label.style.color = '';
                }
            });
        }
    };
    setupFileInput('prof-photo-upload', 'prof-photo-label');
    setupFileInput('bg-media-upload', 'bg-media-label');
    setupFileInput('project-image-upload', 'project-image-label');


    // --- Toast Notification ---
    const showToast = (message, isError = false) => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${isError ? 'error' : ''}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // --- Authentication ---
    // --- Authentication & Session Check ---
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/check-auth');
            if (res.ok) {
                loginScreen.style.display = 'none';
                dashboard.style.display = 'flex';
                loadAllData();
            } else {
                loginScreen.style.display = 'flex';
                dashboard.style.display = 'none';
            }
        } catch (err) {
            loginScreen.style.display = 'flex';
            dashboard.style.display = 'none';
        }
    };
    checkAuth();

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                loginScreen.style.display = 'none';
                dashboard.style.display = 'flex';
                loadAllData();
            } else {
                const data = await res.json();
                showToast(data.error || 'Login failed', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    });

    // --- File Upload Helper ---
    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('image', file);
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.fileUrl || data.imageUrl;
    };

    // --- Loading Data ---
    const loadAllData = () => {
        loadProfile();
        loadServices();
        loadEducation();
        loadProjects();
        loadAchievements();
        loadTestimonials();
        loadCustomContent();
        loadTheme();
    };

    // --- Profile & Background Media ---
    let profileDataRaw = {};
    const loadProfile = async () => {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (!data) return;
        profileDataRaw = data;

        document.getElementById('prof-name').value = data.name || '';
        document.getElementById('prof-title').value = data.title || '';
        document.getElementById('prof-desc').value = data.description || '';
        document.getElementById('prof-email').value = data.email || '';
        document.getElementById('prof-phone').value = data.phone || data.whatsapp || '';
        document.getElementById('prof-location').value = data.location || '';
        document.getElementById('prof-website').value = data.website || '';
        document.getElementById('prof-linkedin').value = data.linkedin || '';
        document.getElementById('prof-availability').value = data.availability || '';
        document.getElementById('prof-quote-text').value = data.quote_text || '';
        document.getElementById('prof-quote-footer').value = data.quote_footer || '';
        document.getElementById('prof-footer-topic').value = data.footer_topic || '';
        document.getElementById('prof-footer-desc').value = data.footer_desc || '';
        
        document.getElementById('prof-photo-url').value = data.profile_photo || '';
        if (data.profile_photo) {
            document.getElementById('prof-photo-preview').src = data.profile_photo;
            document.getElementById('prof-photo-preview').style.display = 'block';
        }

        // Resume Preview Setup
        document.getElementById('prof-resume-url').value = data.resume_url || '';
        const resumePreview = document.getElementById('prof-resume-preview');
        const resumeName = document.getElementById('prof-resume-name');
        const resumeLink = document.getElementById('prof-resume-link');
        const resumeLabel = document.getElementById('prof-resume-label');
        if (data.resume_url) {
            const rawFilename = data.resume_url.split('/').pop();
            const displayName = rawFilename.includes('-') ? rawFilename.split('-').slice(1).join('-') : rawFilename;
            resumeName.textContent = displayName;
            resumeLink.href = data.resume_url;
            resumePreview.style.display = 'flex';
            if (resumeLabel) {
                resumeLabel.textContent = `✓ Active Resume: ${displayName} (Click to change)`;
                resumeLabel.style.borderColor = 'var(--success)';
                resumeLabel.style.color = 'var(--success)';
            }
        } else {
            resumePreview.style.display = 'none';
            if (resumeLabel) {
                resumeLabel.textContent = 'Choose a resume file (.pdf, .docx)...';
                resumeLabel.style.borderColor = '';
                resumeLabel.style.color = '';
            }
        }
    };

    // Instant Resume Upload & Auto-Save
    const resumeUploadInput = document.getElementById('prof-resume-upload');
    const resumeLabel = document.getElementById('prof-resume-label');
    if (resumeUploadInput) {
        resumeUploadInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                resumeLabel.textContent = `Uploading ${file.name}...`;
                showToast('Uploading resume...');
                try {
                    const uploadedUrl = await uploadFile(file);
                    document.getElementById('prof-resume-url').value = uploadedUrl;
                    
                    const updatedBody = {
                        ...profileDataRaw,
                        name: document.getElementById('prof-name').value || profileDataRaw.name,
                        title: document.getElementById('prof-title').value || profileDataRaw.title,
                        description: document.getElementById('prof-desc').value || profileDataRaw.description,
                        email: document.getElementById('prof-email').value || profileDataRaw.email,
                        phone: document.getElementById('prof-phone').value || profileDataRaw.phone,
                        whatsapp: document.getElementById('prof-phone').value || profileDataRaw.whatsapp,
                        location: document.getElementById('prof-location').value || profileDataRaw.location,
                        website: document.getElementById('prof-website').value || profileDataRaw.website,
                        linkedin: document.getElementById('prof-linkedin').value || profileDataRaw.linkedin,
                        availability: document.getElementById('prof-availability').value || profileDataRaw.availability,
                        quote_text: document.getElementById('prof-quote-text').value || profileDataRaw.quote_text,
                        quote_footer: document.getElementById('prof-quote-footer').value || profileDataRaw.quote_footer,
                        profile_photo: document.getElementById('prof-photo-url').value || profileDataRaw.profile_photo,
                        resume_url: uploadedUrl
                    };

                    const res = await fetch('/api/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedBody)
                    });

                    if (res.ok) {
                        profileDataRaw = updatedBody;
                        const resumePreview = document.getElementById('prof-resume-preview');
                        const resumeName = document.getElementById('prof-resume-name');
                        const resumeLink = document.getElementById('prof-resume-link');
                        resumeName.textContent = file.name;
                        resumeLink.href = uploadedUrl;
                        resumePreview.style.display = 'flex';
                        resumeLabel.textContent = `✓ Active Resume: ${file.name} (Click to change)`;
                        resumeLabel.style.borderColor = 'var(--success)';
                        resumeLabel.style.color = 'var(--success)';
                        showToast('Resume uploaded and saved successfully!');
                    } else {
                        showToast('Failed to save resume into profile', true);
                    }
                } catch (err) {
                    showToast('Upload error: ' + err.message, true);
                    resumeLabel.textContent = 'Choose a resume file (.pdf, .docx)...';
                }
            }
        });
    }

    // Resume remove button with instant deletion
    const resumeRemoveBtn = document.getElementById('prof-resume-remove');
    if (resumeRemoveBtn) {
        resumeRemoveBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this resume?')) return;
            document.getElementById('prof-resume-url').value = '';
            if (resumeUploadInput) resumeUploadInput.value = '';
            if (resumeLabel) {
                resumeLabel.textContent = 'Choose a resume file (.pdf, .docx)...';
                resumeLabel.style.borderColor = '';
                resumeLabel.style.color = '';
            }
            const resumePreview = document.getElementById('prof-resume-preview');
            if (resumePreview) resumePreview.style.display = 'none';

            const updatedBody = {
                ...profileDataRaw,
                resume_url: ''
            };
            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBody)
            });
            profileDataRaw = updatedBody;
            showToast('Resume removed successfully!');
        });
    }

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const photoInput = document.getElementById('prof-photo-upload');
        let profile_photo = document.getElementById('prof-photo-url').value;

        const resumeInput = document.getElementById('prof-resume-upload');
        let resume_url = document.getElementById('prof-resume-url').value;

        try {
            if (photoInput.files.length > 0) {
                profile_photo = await uploadFile(photoInput.files[0]);
                document.getElementById('prof-photo-url').value = profile_photo;
                document.getElementById('prof-photo-preview').src = profile_photo;
                document.getElementById('prof-photo-preview').style.display = 'block';
            }

            if (resumeInput && resumeInput.files.length > 0 && !resume_url) {
                resume_url = await uploadFile(resumeInput.files[0]);
                document.getElementById('prof-resume-url').value = resume_url;
            }

            const body = {
                ...profileDataRaw,
                name: document.getElementById('prof-name').value,
                title: document.getElementById('prof-title').value,
                description: document.getElementById('prof-desc').value,
                email: document.getElementById('prof-email').value,
                phone: document.getElementById('prof-phone').value,
                whatsapp: document.getElementById('prof-phone').value,
                location: document.getElementById('prof-location').value,
                website: document.getElementById('prof-website').value,
                linkedin: document.getElementById('prof-linkedin').value,
                availability: document.getElementById('prof-availability').value,
                quote_text: document.getElementById('prof-quote-text').value,
                quote_footer: document.getElementById('prof-quote-footer').value,
                profile_photo: profile_photo,
                resume_url: resume_url
            };

            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast('Profile and Resume saved!');
                photoInput.value = '';
                document.getElementById('prof-photo-label').textContent = 'Choose a photo or drop it here...';
                profileDataRaw = body;
            } else {
                showToast('Error saving profile', true);
            }
        } catch (err) {
            showToast(err.message, true);
        }
    });

    document.getElementById('quote-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const body = {
                ...profileDataRaw,
                quote_text: document.getElementById('prof-quote-text').value,
                quote_footer: document.getElementById('prof-quote-footer').value
            };
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                showToast('Quote saved!');
                profileDataRaw.quote_text = body.quote_text;
                profileDataRaw.quote_footer = body.quote_footer;
            } else {
                showToast('Error saving quote', true);
            }
        } catch (err) {
            showToast(err.message, true);
        }
    });

    document.getElementById('prof-footer-media').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const imageUrl = await uploadFile(file);
            const textarea = document.getElementById('prof-footer-desc');
            textarea.value += `\n<img src="${imageUrl}" alt="Media" style="max-width: 100%; border-radius: 8px;">`;
            showToast('Media inserted!');
            e.target.value = ''; // clear input
        } catch (err) {
            showToast('Failed to upload media', true);
        }
    });

    document.getElementById('footer-box-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const body = {
                ...profileDataRaw,
                footer_topic: document.getElementById('prof-footer-topic').value,
                footer_desc: document.getElementById('prof-footer-desc').value
            };
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                showToast('Footer Box saved!');
                profileDataRaw.footer_topic = body.footer_topic;
                profileDataRaw.footer_desc = body.footer_desc;
            } else {
                showToast('Error saving footer box', true);
            }
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // --- Services ---
    const loadServices = async () => {
        const res = await fetch('/api/skills');
        const data = await res.json();
        const list = document.getElementById('services-list');
        list.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info">
                    <h4></h4>
                    <p></p>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn edit-btn">Edit</button>
                    <button type="button" class="btn danger delete-btn">Delete</button>
                </div>
            `;
            div.querySelector('h4').textContent = item.name;
            div.querySelector('p').textContent = item.price ? 'Price: ' + item.price : 'No price set';
            div.querySelector('.edit-btn').addEventListener('click', () => editService(item.id, item.name, item.price || ''));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteService(item.id));
            list.appendChild(div);
        });
    };

    window.editService = (id, name, price) => {
        document.getElementById('service-id').value = id;
        document.getElementById('service-name').value = name;
        document.getElementById('service-price').value = price;
        document.getElementById('service-form-card').style.display = 'block';
        document.getElementById('service-form-title').textContent = 'Edit Service';
    };

    window.deleteService = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/skills/${id}`, { method: 'DELETE' });
        showToast('Service deleted');
        loadServices();
    };

    document.getElementById('add-service-btn').addEventListener('click', () => {
        document.getElementById('service-form').reset();
        document.getElementById('service-id').value = '';
        document.getElementById('service-form-card').style.display = 'block';
        document.getElementById('service-form-title').textContent = 'Add Service';
    });

    document.getElementById('cancel-service-btn').addEventListener('click', () => {
        document.getElementById('service-form-card').style.display = 'none';
    });

    document.getElementById('service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('service-id').value;
        const name = document.getElementById('service-name').value;
        const price = document.getElementById('service-price').value;

        const url = id ? `/api/skills/${id}` : '/api/skills';
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price })
        });
        
        showToast('Service saved');
        document.getElementById('service-form-card').style.display = 'none';
        loadServices();
    });

    // --- Education ---
    const loadEducation = async () => {
        const res = await fetch('/api/education');
        const data = await res.json();
        const list = document.getElementById('education-list');
        list.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info">
                    <h4>${item.degree}</h4>
                    <p>${item.institution} | ${item.year}</p>
                </div>
                <div class="item-actions">
                    <button class="btn" onclick="editEducation('${item.id}', '${item.degree.replace(/'/g, "\\'")}', '${item.institution.replace(/'/g, "\\'")}', '${item.year}')">Edit</button>
                    <button class="btn danger" onclick="deleteEducation('${item.id}')">Delete</button>
                </div>
            `;
            list.appendChild(div);
        });
    };

    window.editEducation = (id, degree, institution, year) => {
        document.getElementById('education-id').value = id;
        document.getElementById('education-degree').value = degree;
        document.getElementById('education-institution').value = institution;
        document.getElementById('education-year').value = year;
        document.getElementById('education-form-card').style.display = 'block';
        document.getElementById('education-form-title').textContent = 'Edit Education';
    };

    window.deleteEducation = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/education/${id}`, { method: 'DELETE' });
        showToast('Education deleted');
        loadEducation();
    };

    document.getElementById('add-education-btn').addEventListener('click', () => {
        document.getElementById('education-form').reset();
        document.getElementById('education-id').value = '';
        document.getElementById('education-form-card').style.display = 'block';
        document.getElementById('education-form-title').textContent = 'Add Education';
    });

    document.getElementById('cancel-education-btn').addEventListener('click', () => {
        document.getElementById('education-form-card').style.display = 'none';
    });

    document.getElementById('education-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('education-id').value;
        const degree = document.getElementById('education-degree').value;
        const institution = document.getElementById('education-institution').value;
        const year = document.getElementById('education-year').value;

        const url = id ? `/api/education/${id}` : '/api/education';
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ degree, institution, year })
        });
        
        showToast('Education saved');
        document.getElementById('education-form-card').style.display = 'none';
        loadEducation();
    });

    // --- Projects ---
    const loadProjects = async () => {
        const res = await fetch('/api/projects');
        const data = await res.json();
        const list = document.getElementById('projects-list');
        list.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info">
                    <h4></h4>
                    <p></p>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn edit-btn">Edit</button>
                    <button type="button" class="btn danger delete-btn">Delete</button>
                </div>
            `;
            div.querySelector('h4').textContent = item.title;
            div.querySelector('p').textContent = item.project_url ? `${item.category} • 🔗 ${item.project_url}` : item.category;
            div.querySelector('.edit-btn').addEventListener('click', () => editProject(item.id, item.title, item.category, item.image_url, item.project_url));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteProject(item.id));
            list.appendChild(div);
        });
    };

    window.editProject = (id, title, category, imageUrl, projectUrl) => {
        document.getElementById('project-id').value = id;
        document.getElementById('project-title').value = title;
        document.getElementById('project-category').value = category;
        document.getElementById('project-url').value = projectUrl || '';
        document.getElementById('project-image-url').value = imageUrl;
        if (imageUrl && imageUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            document.getElementById('project-image-preview').src = imageUrl;
            document.getElementById('project-image-preview').style.display = 'block';
        } else {
            document.getElementById('project-image-preview').style.display = 'none';
        }
        document.getElementById('project-form-card').style.display = 'block';
        document.getElementById('project-form-title').textContent = 'Edit Project';
    };

    window.deleteProject = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        showToast('Project deleted');
        loadProjects();
    };

    document.getElementById('add-project-btn').addEventListener('click', () => {
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = '';
        document.getElementById('project-url').value = '';
        document.getElementById('project-image-url').value = '';
        document.getElementById('project-image-preview').style.display = 'none';
        document.getElementById('project-image-label').textContent = 'Choose project thumbnail...';
        document.getElementById('project-form-card').style.display = 'block';
        document.getElementById('project-form-title').textContent = 'Add Project';
    });
    
    document.getElementById('cancel-project-btn').addEventListener('click', () => {
        document.getElementById('project-form-card').style.display = 'none';
    });

    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('project-id').value;
        const title = document.getElementById('project-title').value;
        const category = document.getElementById('project-category').value;
        const project_url = document.getElementById('project-url').value;
        const fileInput = document.getElementById('project-image-upload');
        let image_url = document.getElementById('project-image-url').value;

        try {
            if (fileInput.files.length > 0) {
                image_url = await uploadFile(fileInput.files[0]);
            }

            const url = id ? `/api/projects/${id}` : '/api/projects';
            const method = id ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category, image_url, project_url })
            });
            
            showToast('Project saved');
            document.getElementById('project-form-card').style.display = 'none';
            loadProjects();
        } catch (err) {
            showToast(err.message, true);
        }
    });

    // --- Achievements ---
    const loadAchievements = async () => {
        const res = await fetch('/api/certifications');
        const data = await res.json();
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info">
                    <h4></h4>
                    <p></p>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn edit-btn">Edit</button>
                    <button type="button" class="btn danger delete-btn">Delete</button>
                </div>
            `;
            div.querySelector('h4').textContent = item.name;
            div.querySelector('p').textContent = item.issuer;
            div.querySelector('.edit-btn').addEventListener('click', () => editAchievement(item.id, item.name, item.issuer));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteAchievement(item.id));
            list.appendChild(div);
        });
    };

    window.editAchievement = (id, name, issuer) => {
        document.getElementById('achievement-id').value = id;
        document.getElementById('achievement-title').value = name;
        document.getElementById('achievement-issuer').value = issuer;
        document.getElementById('achievement-form-card').style.display = 'block';
        document.getElementById('achievement-form-title').textContent = 'Edit Achievement';
    };

    window.deleteAchievement = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
        showToast('Achievement deleted');
        loadAchievements();
    };

    document.getElementById('add-achievement-btn').addEventListener('click', () => {
        document.getElementById('achievement-form').reset();
        document.getElementById('achievement-id').value = '';
        document.getElementById('achievement-form-card').style.display = 'block';
        document.getElementById('achievement-form-title').textContent = 'Add Achievement';
    });

    document.getElementById('cancel-achievement-btn').addEventListener('click', () => {
        document.getElementById('achievement-form-card').style.display = 'none';
    });

    document.getElementById('achievement-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('achievement-id').value;
        const name = document.getElementById('achievement-title').value;
        const issuer = document.getElementById('achievement-issuer').value;

        const url = id ? `/api/certifications/${id}` : '/api/certifications';
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, issuer })
        });
        
        showToast('Achievement saved');
        document.getElementById('achievement-form-card').style.display = 'none';
        loadAchievements();
    });

    // --- Testimonials ---
    const loadTestimonials = async () => {
        const res = await fetch('/api/testimonials');
        const data = await res.json();
        const list = document.getElementById('testimonials-list');
        list.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info">
                    <h4></h4>
                    <p class="role-text" style="color: var(--accent); font-size: 0.85rem; margin-bottom: 0.25rem;"></p>
                    <p class="quote-preview" style="color: var(--text-secondary); font-style: italic;"></p>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn edit-btn">Edit</button>
                    <button type="button" class="btn danger delete-btn">Delete</button>
                </div>
            `;
            div.querySelector('h4').textContent = item.client_name;
            div.querySelector('.role-text').textContent = item.client_title || '';
            div.querySelector('.quote-preview').textContent = `"${item.quote}"`;
            div.querySelector('.edit-btn').addEventListener('click', () => editTestimonial(item.id, item.client_name, item.client_title, item.quote));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteTestimonial(item.id));
            list.appendChild(div);
        });
    };

    window.editTestimonial = (id, client_name, client_title, quote) => {
        document.getElementById('testimonial-id').value = id;
        document.getElementById('testimonial-client-name').value = client_name || '';
        document.getElementById('testimonial-client-title').value = client_title || '';
        document.getElementById('testimonial-quote').value = quote || '';
        document.getElementById('testimonial-form-card').style.display = 'block';
        document.getElementById('testimonial-form-title').textContent = 'Edit Testimonial';
    };

    window.deleteTestimonial = async (id) => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;
        await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
        showToast('Testimonial deleted');
        loadTestimonials();
    };

    document.getElementById('add-testimonial-btn').addEventListener('click', () => {
        document.getElementById('testimonial-form').reset();
        document.getElementById('testimonial-id').value = '';
        document.getElementById('testimonial-form-card').style.display = 'block';
        document.getElementById('testimonial-form-title').textContent = 'Add Testimonial';
    });

    document.getElementById('cancel-testimonial-btn').addEventListener('click', () => {
        document.getElementById('testimonial-form-card').style.display = 'none';
    });

    document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('testimonial-id').value;
        const client_name = document.getElementById('testimonial-client-name').value;
        const client_title = document.getElementById('testimonial-client-title').value;
        const quote = document.getElementById('testimonial-quote').value;

        const url = id ? `/api/testimonials/${id}` : '/api/testimonials';
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_name, client_title, quote })
        });
        
        showToast('Testimonial saved');
        document.getElementById('testimonial-form-card').style.display = 'none';
        loadTestimonials();
    });

    // --- Custom Content ---
    const loadCustomContent = async () => {
        const res = await fetch('/api/custom_content');
        const data = await res.json();
        const list = document.getElementById('content-list');
        list.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info">
                    <h4></h4>
                    <p></p>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn edit-btn">Edit</button>
                    <button type="button" class="btn danger delete-btn">Delete</button>
                </div>
            `;
            div.querySelector('h4').textContent = item.title;
            div.querySelector('p').textContent = 'Placement: ' + item.section_placement;
            div.querySelector('.edit-btn').addEventListener('click', () => editContent(item.id, item.title, item.content, item.section_placement));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteContent(item.id));
            list.appendChild(div);
        });
    };

    window.editContent = (id, title, contentRaw, placement) => {
        document.getElementById('content-id').value = id;
        document.getElementById('content-title').value = title;
        document.getElementById('content-text').value = contentRaw;
        document.getElementById('content-placement').value = placement;
        document.getElementById('content-form-card').style.display = 'block';
        document.getElementById('content-form-title').textContent = 'Edit Content Block';
    };

    window.deleteContent = async (id) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/custom_content/${id}`, { method: 'DELETE' });
        showToast('Content block deleted');
        loadCustomContent();
    };

    document.getElementById('add-content-btn').addEventListener('click', () => {
        document.getElementById('content-form').reset();
        document.getElementById('content-id').value = '';
        document.getElementById('content-form-card').style.display = 'block';
        document.getElementById('content-form-title').textContent = 'Add Custom Content';
    });

    document.getElementById('cancel-content-btn').addEventListener('click', () => {
        document.getElementById('content-form-card').style.display = 'none';
    });

    document.getElementById('content-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('content-id').value;
        const title = document.getElementById('content-title').value;
        const content = document.getElementById('content-text').value;
        const section_placement = document.getElementById('content-placement').value;

        const url = id ? `/api/custom_content/${id}` : '/api/custom_content';
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, section_placement })
        });
        
        showToast('Content block saved');
        document.getElementById('content-form-card').style.display = 'none';
        loadCustomContent();
    });

    // --- Theme Switcher ---
    const loadTheme = async () => {
        const res = await fetch('/api/settings');
        const data = await res.json();
        const currentTheme = data ? data.theme_name : 'Sunset Orange-Pink';
        
        document.querySelectorAll('.theme-card').forEach(card => {
            if (card.dataset.theme === currentTheme) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    };

    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', async () => {
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const theme_name = card.dataset.theme;
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme_name })
            });
            showToast('Theme updated!');
        });
    });

});
