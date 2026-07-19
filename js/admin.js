/* ==========================================================================
   SHOOT @ SIGHT WEDDINGS — PHOTOGRAPHER ADMIN CONTROLLER
   ========================================================================== */

import { getEvents, saveEvents, getLogs, logActivity, state, setActiveEventByCode } from './app.js';
import { showToast } from './gallery.js';

// Admin panel states
let activeAdminTab = 'events';
let uploadedPhotosQueue = []; // Queue of photos prepared for a new event

// DOM Elements
const adminTabsContainer = document.querySelector('.admin-tabs');
const adminPanels = {
    events: document.getElementById('admin-tab-events'),
    'create-event': document.getElementById('admin-tab-create-event'),
    'activity-logs': document.getElementById('admin-tab-activity-logs')
};

// Form Elements
const createEventForm = document.getElementById('create-event-form');
const eventTitleInput = document.getElementById('event-title');
const eventCoupleInput = document.getElementById('event-couple');
const eventDateInput = document.getElementById('event-date');
const eventCodeInput = document.getElementById('event-code');
const eventPasswordInput = document.getElementById('event-password');
const btnGeneratePw = document.getElementById('btn-generate-pw');

// File Upload Elements
const adminPhotoInput = document.getElementById('admin-photo-input');
const adminUploadZone = document.getElementById('admin-upload-zone');
const adminUploadPreview = document.getElementById('admin-upload-preview');

// Lists containers
const adminEventsList = document.getElementById('admin-events-list');
const adminLogsTbody = document.getElementById('admin-logs-tbody');

// Stats metrics displays
const statTotalEvents = document.getElementById('stat-total-events');
const statTotalPhotos = document.getElementById('stat-total-photos');
const statTotalDownloads = document.getElementById('stat-total-downloads');

// Initialize admin interface events
export function initAdmin() {
    // Admin tab switcher
    adminTabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.admin-tab-btn');
        if (btn) {
            adminTabsContainer.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabName = btn.dataset.adminTab;
            activeAdminTab = tabName;
            
            // Switch panel display
            Object.keys(adminPanels).forEach(key => {
                if (key === tabName) {
                    adminPanels[key].classList.remove('view-hidden');
                } else {
                    adminPanels[key].classList.add('view-hidden');
                }
            });
            
            if (tabName === 'events') renderEventsList();
            if (tabName === 'activity-logs') renderActivityLogs();
        }
    });

    // Password generator button
    btnGeneratePw.addEventListener('click', () => {
        eventPasswordInput.value = generateSecurePassword();
    });

    // Handle form auto-slug creation based on couple name
    eventCoupleInput.addEventListener('input', () => {
        const value = eventCoupleInput.value;
        eventCodeInput.value = value.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // remove special chars
            .replace(/\s+/g, '-')         // replace spaces with dash
            .replace(/-+/g, '-');          // collapse duplicate dashes
    });

    // Upload triggers
    adminUploadZone.addEventListener('click', (e) => {
        if (e.target.closest('.preview-category-selector')) return;
        adminPhotoInput.click();
    });

    adminPhotoInput.addEventListener('change', handleAdminFileSelection);
    
    // Drag & Drop
    adminUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        adminUploadZone.style.borderColor = 'var(--gold)';
        adminUploadZone.style.background = 'rgba(212, 175, 55, 0.05)';
    });

    adminUploadZone.addEventListener('dragleave', () => {
        adminUploadZone.style.borderColor = '';
        adminUploadZone.style.background = '';
    });

    adminUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        adminUploadZone.style.borderColor = '';
        adminUploadZone.style.background = '';
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processUploadFiles(e.dataTransfer.files);
        }
    });

    // Create Event Form Submission
    createEventForm.addEventListener('submit', handleCreateEvent);
}

// Update the overview metrics widget
export function updateAdminStats() {
    const events = getEvents();
    let totalPhotos = 0;
    
    events.forEach(e => {
        totalPhotos += e.photos.length;
    });
    
    statTotalEvents.textContent = events.length;
    statTotalPhotos.textContent = totalPhotos;
    
    const downloads = localStorage.getItem('sas_total_downloads') || '0';
    statTotalDownloads.textContent = downloads;
}

// Generate secure access code
function generateSecurePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `memories-${pass}`;
}

// Handle selected files for upload
function handleAdminFileSelection(e) {
    if (e.target.files && e.target.files.length > 0) {
        processUploadFiles(e.target.files);
    }
}

// Load files in memory queue
function processUploadFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoItem = {
                id: `up-${Date.now()}-${i}`,
                name: file.name,
                dataURL: e.target.result,
                category: 'candid', // default category
                faces: getRandomFaces() // Assign mock faces tag for search engine
            };
            
            uploadedPhotosQueue.push(photoItem);
            renderUploadPreviewItem(photoItem);
        };
        reader.readAsDataURL(file);
    }
}

// Random mock face assignment tagger
function getRandomFaces() {
    const options = [
        ['bride'],
        ['groom'],
        ['bride', 'groom'],
        []
    ];
    return options[Math.floor(Math.random() * options.length)];
}

// Render uploaded preview card with category selector dropdown
function renderUploadPreviewItem(photo) {
    // Clear dropzone default prompt if items present
    const prompt = adminUploadZone.querySelector('.upload-zone-prompt');
    if (prompt) prompt.style.display = 'none';

    const div = document.createElement('div');
    div.className = 'preview-thumbnail-wrapper';
    div.dataset.id = photo.id;
    
    div.innerHTML = `
        <img src="${photo.dataURL}" alt="${photo.name}">
        <select class="preview-category-selector">
            <option value="candid">Candid</option>
            <option value="portraits">Portrait</option>
            <option value="ceremony">Ceremony</option>
            <option value="reception">Reception</option>
        </select>
        <button type="button" class="btn-remove" style="top:2px; right:2px; width:18px; height:18px; font-size:10px;">&times;</button>
    `;
    
    // Add category change handler
    div.querySelector('.preview-category-selector').addEventListener('change', (e) => {
        const p = uploadedPhotosQueue.find(item => item.id === photo.id);
        if (p) p.category = e.target.value;
    });

    // Add remove handler
    div.querySelector('.btn-remove').addEventListener('click', () => {
        uploadedPhotosQueue = uploadedPhotosQueue.filter(item => item.id !== photo.id);
        div.remove();
        
        if (uploadedPhotosQueue.length === 0) {
            if (prompt) prompt.style.display = 'block';
        }
    });

    adminUploadPreview.appendChild(div);
}

// Form Submission: Create Event
function handleCreateEvent(e) {
    e.preventDefault();
    
    const code = eventCodeInput.value.trim().toLowerCase();
    const password = eventPasswordInput.value.trim();
    const title = eventTitleInput.value.trim();
    const couple = eventCoupleInput.value.trim();
    const date = eventDateInput.value;
    
    const events = getEvents();
    
    // Check duplication
    if (events.find(ev => ev.code === code)) {
        showToast("An event with this code already exists. Please pick another code.", "error");
        return;
    }

    // Map uploaded queue to local photo records, resolving base64 storage limits
    const savedPhotosList = uploadedPhotosQueue.map((photo, index) => {
        // Map category to high-res local asset to prevent localStorage exceeding 5MB
        let assetUrl = 'assets/candid.jpg';
        if (photo.category === 'portraits') assetUrl = 'assets/portrait.jpg';
        if (photo.category === 'ceremony') assetUrl = 'assets/ceremony.jpg';
        if (photo.category === 'reception') assetUrl = 'assets/reception.jpg';
        
        return {
            id: `p-${Date.now()}-${index}`,
            url: assetUrl,
            category: photo.category,
            title: `${photo.category.charAt(0).toUpperCase() + photo.category.slice(1)} Moments`,
            faces: photo.faces
        };
    });

    // Default placeholder photos if photographer didn't upload any photos
    if (savedPhotosList.length === 0) {
        // Seed default 4 photos
        savedPhotosList.push(
            { id: `p-${Date.now()}-1`, url: 'assets/portrait.jpg', category: 'portraits', title: 'Couples portraits', faces: ['bride', 'groom'] },
            { id: `p-${Date.now()}-2`, url: 'assets/ceremony.jpg', category: 'ceremony', title: 'Exchange of garlands', faces: ['bride', 'groom'] },
            { id: `p-${Date.now()}-3`, url: 'assets/candid.jpg', category: 'candid', title: 'Sweet candid smiles', faces: ['bride'] },
            { id: `p-${Date.now()}-4`, url: 'assets/reception.jpg', category: 'reception', title: 'Reception celebrations', faces: ['groom'] }
        );
    }
    
    const newEvent = {
        code: code,
        password: password,
        title: title,
        couple: couple,
        date: date,
        photos: savedPhotosList
    };
    
    events.push(newEvent);
    saveEvents(events);
    
    // Log creation
    logActivity('admin', 'Create Event', `Created and published new event: ${title} with code: ${code}`);
    showToast("Event created and published successfully!");
    
    // Clear form state
    createEventForm.reset();
    uploadedPhotosQueue = [];
    adminUploadPreview.innerHTML = '';
    const prompt = adminUploadZone.querySelector('.upload-zone-prompt');
    if (prompt) prompt.style.display = 'block';
    
    // Refresh admin stats & view
    updateAdminStats();
    
    // Redirect to Events tab
    const tabBtn = adminTabsContainer.querySelector('[data-admin-tab="events"]');
    if (tabBtn) tabBtn.click();
}

// Render active client events rows
export function renderEventsList() {
    adminEventsList.innerHTML = '';
    const events = getEvents();
    
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'admin-event-card';
        
        card.innerHTML = `
            <div class="event-card-details">
                <h3>${event.title}</h3>
                <p>Date: ${event.date} &bull; Total Photos: ${event.photos.length}</p>
                <div class="event-credentials-bubble">
                    <span><strong>Username / Code:</strong> ${event.code}</span>
                    <span><strong>Password:</strong> ${event.password}</span>
                </div>
            </div>
            <div class="event-card-actions">
                <button class="btn btn-outline btn-sm btn-view-gallery">View Gallery</button>
                <button class="btn btn-gold btn-sm btn-delete-event">Delete</button>
            </div>
        `;
        
        // Add events
        card.querySelector('.btn-view-gallery').addEventListener('click', () => {
            setActiveEventByCode(event.code);
            window.location.hash = 'gallery';
        });

        card.querySelector('.btn-delete-event').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete the event: ${event.title}?`)) {
                deleteEventByCode(event.code);
            }
        });
        
        adminEventsList.appendChild(card);
    });
}

function deleteEventByCode(code) {
    let events = getEvents();
    events = events.filter(e => e.code !== code);
    saveEvents(events);
    
    logActivity('admin', 'Delete Event', `Deleted event with code: ${code}`);
    showToast("Event deleted successfully.");
    
    updateAdminStats();
    renderEventsList();
}

// Render activity audit logs
export function renderActivityLogs() {
    adminLogsTbody.innerHTML = '';
    const logs = getLogs();
    
    if (logs.length === 0) {
        adminLogsTbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center font-muted">No activity logs recorded yet.</td>
            </tr>
        `;
        return;
    }
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        row.innerHTML = `
            <td>${dateStr} ${timeStr}</td>
            <td><code style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">${log.eventCode}</code></td>
            <td style="color:var(--gold); font-weight:500;">${log.action}</td>
            <td class="font-muted">${log.details}</td>
        `;
        
        adminLogsTbody.appendChild(row);
    });
}
