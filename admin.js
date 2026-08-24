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
        loadReviews();
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
        
        // Photo Preview Setup
        document.getElementById('prof-photo-url').value = data.profile_photo || '';
        const photoContainer = document.getElementById('prof-photo-container');
        const photoPreview = document.getElementById('prof-photo-preview');
        const photoLabel = document.getElementById('prof-photo-label');
        if (data.profile_photo) {
            if (photoPreview) photoPreview.src = data.profile_photo;
            if (photoContainer) photoContainer.style.display = 'flex';
            if (photoLabel) {
                photoLabel.textContent = '✓ Photo active (Click to change)';
                photoLabel.style.borderColor = 'var(--success)';
                photoLabel.style.color = 'var(--success)';
            }
        } else {
            if (photoContainer) photoContainer.style.display = 'none';
            if (photoLabel) {
                photoLabel.textContent = 'Choose a photo or drop it here...';
                photoLabel.style.borderColor = '';
                photoLabel.style.color = '';
            }
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

    // Instant Photo Upload & Auto-Save
    const photoUploadInput = document.getElementById('prof-photo-upload');
    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const photoLabel = document.getElementById('prof-photo-label');
                if (photoLabel) photoLabel.textContent = `Uploading ${file.name}...`;
                showToast('Uploading photo...');
                try {
                    const uploadedUrl = await uploadFile(file);
                    document.getElementById('prof-photo-url').value = uploadedUrl;
                    const photoPreview = document.getElementById('prof-photo-preview');
                    const photoContainer = document.getElementById('prof-photo-container');
                    if (photoPreview) photoPreview.src = uploadedUrl;
                    if (photoContainer) photoContainer.style.display = 'flex';
                    if (photoLabel) {
                        photoLabel.textContent = `✓ Photo: ${file.name} (Click to change)`;
                        photoLabel.style.borderColor = 'var(--success)';
                        photoLabel.style.color = 'var(--success)';
                    }
                    
                    await fetch('/api/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ profile_photo: uploadedUrl })
                    });
                    await loadProfile();
                    showToast('Photo uploaded and saved successfully!');
                } catch (err) {
                    showToast('Photo upload error: ' + err.message, true);
                    if (photoLabel) photoLabel.textContent = 'Choose a photo or drop it here...';
                }
            }
        });
    }

    // Photo Remove Button
    const photoRemoveBtn = document.getElementById('prof-photo-remove');
    if (photoRemoveBtn) {
        photoRemoveBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to remove this photo?')) return;
            document.getElementById('prof-photo-url').value = '';
            if (photoUploadInput) photoUploadInput.value = '';
            const photoContainer = document.getElementById('prof-photo-container');
            if (photoContainer) photoContainer.style.display = 'none';
            const photoLabel = document.getElementById('prof-photo-label');
            if (photoLabel) {
                photoLabel.textContent = 'Choose a photo or drop it here...';
                photoLabel.style.borderColor = '';
                photoLabel.style.color = '';
            }
            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_photo: '' })
            });
            await loadProfile();
            showToast('Photo removed successfully!');
        });
    }

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
                    
                    await fetch('/api/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resume_url: uploadedUrl })
                    });

                    await loadProfile();
                    showToast('Resume uploaded and saved successfully!');
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
            const resumePreview = document.getElementById('prof-resume-preview');
            if (resumePreview) resumePreview.style.display = 'none';

            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_url: '' })
            });
            await loadProfile();
            showToast('Resume removed successfully!');
        });
    }

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let profile_photo = document.getElementById('prof-photo-url').value;
        let resume_url = document.getElementById('prof-resume-url').value;

        try {
            const body = {
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
                profile_photo: profile_photo,
                resume_url: resume_url
            };

            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast('Profile and Links saved successfully!');
                await loadProfile();
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
                quote_text: document.getElementById('prof-quote-text').value,
                quote_footer: document.getElementById('prof-quote-footer').value
            };
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                showToast('Quote saved successfully!');
                await loadProfile();
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
                footer_topic: document.getElementById('prof-footer-topic').value,
                footer_desc: document.getElementById('prof-footer-desc').value
            };
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                showToast('Footer Box saved successfully!');
                await loadProfile();
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

    // --- Achievements / Certifications ---
    const loadAchievements = async () => {
        const res = await fetch('/api/certifications');
        const data = await res.json();
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-row';
            
            const thumbHtml = item.image_url 
                ? `<img src="${item.image_url}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); flex-shrink: 0; background: #000;">`
                : `<div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px dashed var(--border); font-size: 1.4rem; flex-shrink: 0;">📜</div>`;

            div.innerHTML = `
                <div style="display: flex; gap: 1.25rem; align-items: center; flex: 1;">
                    ${thumbHtml}
                    <div class="item-info">
                        <h4 style="margin-bottom: 0.25rem; font-size: 1rem;"></h4>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;"></p>
                    </div>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn edit-btn">Edit</button>
                    <button type="button" class="btn danger delete-btn">Delete</button>
                </div>
            `;
            div.querySelector('h4').textContent = item.name;
            div.querySelector('p').textContent = item.issuer;
            div.querySelector('.edit-btn').addEventListener('click', () => editAchievement(item));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteAchievement(item.id));
            list.appendChild(div);
        });
    };

    // Instant Certificate Image Selection & Upload
    const certImageUploadInput = document.getElementById('achievement-image-upload');
    const certImageLabel = document.getElementById('achievement-image-label');
    const certImagePreview = document.getElementById('achievement-image-preview');
    const certImagePreviewCont = document.getElementById('achievement-image-preview-container');
    const certImageUrlInput = document.getElementById('achievement-image-url');

    if (certImageUploadInput) {
        certImageUploadInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                
                // File validation: Size <= 5MB
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File is too large. Max size is 5MB.', true);
                    e.target.value = '';
                    return;
                }

                // File validation: Image type
                const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
                if (!validTypes.includes(file.type)) {
                    showToast('Invalid format. Please upload JPG, PNG, or WEBP.', true);
                    e.target.value = '';
                    return;
                }

                if (certImageLabel) certImageLabel.textContent = `Uploading ${file.name}...`;
                showToast('Uploading certificate image...');

                try {
                    const uploadedUrl = await uploadFile(file);
                    if (certImageUrlInput) certImageUrlInput.value = uploadedUrl;
                    if (certImagePreview) certImagePreview.src = uploadedUrl;
                    if (certImagePreviewCont) certImagePreviewCont.style.display = 'flex';
                    if (certImageLabel) {
                        certImageLabel.textContent = `✓ Active Image: ${file.name} (Click to change)`;
                        certImageLabel.style.borderColor = 'var(--success)';
                        certImageLabel.style.color = 'var(--success)';
                    }
                    showToast('Certificate image uploaded!');
                } catch (err) {
                    showToast('Upload failed: ' + err.message, true);
                    if (certImageLabel) certImageLabel.textContent = 'Choose certificate image (.jpg, .png, .webp)...';
                }
            }
        });
    }

    const certImageRemoveBtn = document.getElementById('achievement-image-remove');
    if (certImageRemoveBtn) {
        certImageRemoveBtn.addEventListener('click', () => {
            if (certImageUrlInput) certImageUrlInput.value = '';
            if (certImageUploadInput) certImageUploadInput.value = '';
            if (certImagePreviewCont) certImagePreviewCont.style.display = 'none';
            if (certImageLabel) {
                certImageLabel.textContent = 'Choose certificate image (.jpg, .png, .webp)...';
                certImageLabel.style.borderColor = '';
                certImageLabel.style.color = '';
            }
            showToast('Certificate image removed');
        });
    }

    window.editAchievement = (item) => {
        document.getElementById('achievement-id').value = item.id;
        document.getElementById('achievement-title').value = item.name || '';
        document.getElementById('achievement-issuer').value = item.issuer || '';
        
        const imgUrl = item.image_url || '';
        if (certImageUrlInput) certImageUrlInput.value = imgUrl;
        if (certImageUploadInput) certImageUploadInput.value = '';

        if (imgUrl) {
            if (certImagePreview) certImagePreview.src = imgUrl;
            if (certImagePreviewCont) certImagePreviewCont.style.display = 'flex';
            if (certImageLabel) {
                certImageLabel.textContent = '✓ Certificate image active (Click to change)';
                certImageLabel.style.borderColor = 'var(--success)';
                certImageLabel.style.color = 'var(--success)';
            }
        } else {
            if (certImagePreviewCont) certImagePreviewCont.style.display = 'none';
            if (certImageLabel) {
                certImageLabel.textContent = 'Choose certificate image (.jpg, .png, .webp)...';
                certImageLabel.style.borderColor = '';
                certImageLabel.style.color = '';
            }
        }

        document.getElementById('achievement-form-card').style.display = 'block';
        document.getElementById('achievement-form-title').textContent = 'Edit Certification';
        document.getElementById('achievement-form-card').scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteAchievement = async (id) => {
        if (!confirm('Are you sure you want to delete this certification?')) return;
        await fetch(`/api/certifications/${id}`, { method: 'DELETE' });
        showToast('Certification deleted');
        loadAchievements();
    };

    document.getElementById('add-achievement-btn').addEventListener('click', () => {
        document.getElementById('achievement-form').reset();
        document.getElementById('achievement-id').value = '';
        if (certImageUrlInput) certImageUrlInput.value = '';
        if (certImagePreviewCont) certImagePreviewCont.style.display = 'none';
        if (certImageLabel) {
            certImageLabel.textContent = 'Choose certificate image (.jpg, .png, .webp)...';
            certImageLabel.style.borderColor = '';
            certImageLabel.style.color = '';
        }
        document.getElementById('achievement-form-card').style.display = 'block';
        document.getElementById('achievement-form-title').textContent = 'Add Certification';
        document.getElementById('achievement-form-card').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('cancel-achievement-btn').addEventListener('click', () => {
        document.getElementById('achievement-form-card').style.display = 'none';
    });

    document.getElementById('achievement-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('achievement-id').value;
        const name = document.getElementById('achievement-title').value;
        const issuer = document.getElementById('achievement-issuer').value;
        const image_url = certImageUrlInput ? certImageUrlInput.value : '';

        const url = id ? `/api/certifications/${id}` : '/api/certifications';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, issuer, image_url })
            });
            
            if (res.ok) {
                showToast('Certification saved successfully!');
                document.getElementById('achievement-form-card').style.display = 'none';
                loadAchievements();
            } else {
                showToast('Error saving certification', true);
            }
        } catch (err) {
            showToast('Error: ' + err.message, true);
        }
    });

    // --- Client Reviews & Approvals ---
    let currentReviewFilter = 'all';
    let allReviewsCache = [];

    const loadReviews = async (filter = currentReviewFilter) => {
        currentReviewFilter = filter;
        try {
            const res = await fetch('/api/reviews');
            if (!res.ok) return;
            const data = await res.json();
            allReviewsCache = Array.isArray(data) ? data : [];

            // Update pending count in badge and tab
            const pendingCount = allReviewsCache.filter(r => r.status === 'pending').length;
            const badge = document.getElementById('pending-reviews-badge');
            const tabCount = document.getElementById('pending-count-tab');
            if (badge) {
                badge.textContent = pendingCount;
                badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
            }
            if (tabCount) tabCount.textContent = pendingCount;

            // Filter reviews for display
            let displayList = allReviewsCache;
            if (filter !== 'all') {
                displayList = allReviewsCache.filter(r => r.status === filter);
            }

            const list = document.getElementById('reviews-list');
            if (!list) return;
            list.innerHTML = '';

            if (displayList.length === 0) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 3rem; background: var(--card-bg); border-radius: 10px; border: 1px dashed var(--border);">No ${filter !== 'all' ? filter : ''} reviews found.</div>`;
                return;
            }

            displayList.forEach(item => {
                const div = document.createElement('div');
                div.className = `review-item-row ${item.status === 'pending' ? 'pending-highlight' : ''}`;
                
                const ratingNum = parseInt(item.rating) || 5;
                const stars = '★'.repeat(ratingNum) + '☆'.repeat(Math.max(0, 5 - ratingNum));
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                div.innerHTML = `
                    <div class="item-info" style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                            <h4 style="margin: 0; font-size: 1.05rem;"></h4>
                            <span class="badge-status badge-${item.status}">${item.status}</span>
                            <span style="color: #f59e0b; font-size: 0.95rem; letter-spacing: 1px;">${stars}</span>
                            ${dateStr ? `<span style="color: var(--text-secondary); font-size: 0.8rem;">• ${dateStr}</span>` : ''}
                        </div>
                        <p class="role-text" style="color: var(--accent); font-size: 0.85rem; margin-bottom: 0.5rem;"></p>
                        <p class="quote-preview" style="color: var(--text-primary); font-size: 0.95rem; line-height: 1.5; background: rgba(0,0,0,0.15); padding: 0.75rem 1rem; border-radius: 6px; border-left: 3px solid var(--border);"></p>
                    </div>
                    <div class="item-actions">
                        ${item.status === 'pending' ? `
                            <button type="button" class="btn success approve-btn">✓ Approve</button>
                            <button type="button" class="btn danger reject-btn">✕ Reject</button>
                        ` : item.status === 'approved' ? `
                            <button type="button" class="btn reject-btn" style="background: #4b5563; color: #fff;">Reject / Hide</button>
                            <button type="button" class="btn edit-btn">Edit</button>
                        ` : `
                            <button type="button" class="btn success approve-btn">✓ Approve</button>
                            <button type="button" class="btn edit-btn">Edit</button>
                        `}
                        <button type="button" class="btn danger delete-btn">Delete</button>
                    </div>
                `;

                div.querySelector('h4').textContent = item.name;
                div.querySelector('.role-text').textContent = item.designation || '';
                div.querySelector('.quote-preview').textContent = `"${item.review_text}"`;

                const approveBtn = div.querySelector('.approve-btn');
                if (approveBtn) approveBtn.addEventListener('click', () => updateReviewStatus(item.id, 'approved'));

                const rejectBtn = div.querySelector('.reject-btn');
                if (rejectBtn) rejectBtn.addEventListener('click', () => updateReviewStatus(item.id, 'rejected'));

                const editBtn = div.querySelector('.edit-btn');
                if (editBtn) editBtn.addEventListener('click', () => editReview(item));

                const deleteBtn = div.querySelector('.delete-btn');
                if (deleteBtn) deleteBtn.addEventListener('click', () => deleteReview(item.id));

                list.appendChild(div);
            });
        } catch (err) {
            console.error('Error loading reviews:', err);
        }
    };

    // Filter tabs listener
    document.querySelectorAll('.filter-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadReviews(btn.dataset.filter);
        });
    });

    window.updateReviewStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/reviews/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                showToast(`Review marked as ${status}!`);
                loadReviews();
            } else {
                showToast('Failed to update status', true);
            }
        } catch (err) {
            showToast('Error: ' + err.message, true);
        }
    };

    window.editReview = (item) => {
        document.getElementById('admin-review-id').value = item.id;
        document.getElementById('admin-review-name').value = item.name || '';
        document.getElementById('admin-review-designation').value = item.designation || '';
        document.getElementById('admin-review-rating').value = item.rating || 5;
        document.getElementById('admin-review-text').value = item.review_text || '';
        document.getElementById('admin-review-status').value = item.status || 'approved';
        
        document.getElementById('review-form-card').style.display = 'block';
        document.getElementById('review-form-title').textContent = 'Edit Client Review';
        document.getElementById('review-form-card').scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteReview = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this review?')) return;
        try {
            const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Review deleted successfully');
                loadReviews();
            } else {
                showToast('Failed to delete review', true);
            }
        } catch (err) {
            showToast('Error: ' + err.message, true);
        }
    };

    const addReviewBtn = document.getElementById('add-review-btn');
    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', () => {
            document.getElementById('admin-review-form').reset();
            document.getElementById('admin-review-id').value = '';
            document.getElementById('admin-review-status').value = 'approved';
            document.getElementById('review-form-card').style.display = 'block';
            document.getElementById('review-form-title').textContent = 'Add Client Review';
            document.getElementById('review-form-card').scrollIntoView({ behavior: 'smooth' });
        });
    }

    const cancelAdminReviewBtn = document.getElementById('cancel-admin-review-btn');
    if (cancelAdminReviewBtn) {
        cancelAdminReviewBtn.addEventListener('click', () => {
            document.getElementById('review-form-card').style.display = 'none';
        });
    }

    const adminReviewForm = document.getElementById('admin-review-form');
    if (adminReviewForm) {
        adminReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('admin-review-id').value;
            const name = document.getElementById('admin-review-name').value;
            const designation = document.getElementById('admin-review-designation').value;
            const rating = parseInt(document.getElementById('admin-review-rating').value) || 5;
            const review_text = document.getElementById('admin-review-text').value;
            const status = document.getElementById('admin-review-status').value;

            try {
                if (id) {
                    // Update existing
                    await fetch(`/api/reviews/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    });
                } else {
                    // Create new
                    await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, designation, rating, review_text })
                    });
                }
                
                showToast('Review saved successfully');
                document.getElementById('review-form-card').style.display = 'none';
                loadReviews();
            } catch (err) {
                showToast('Error saving review: ' + err.message, true);
            }
        });
    }

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
