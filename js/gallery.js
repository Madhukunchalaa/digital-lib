/* ==========================================================================
   SHOOT @ SIGHT WEDDINGS — CLIENT GALLERY CONTROLLER
   ========================================================================== */

import { state, logActivity } from './app.js';

// Gallery state
let isSelectMode = false;
let selectedPhotoIds = new Set();
let currentLightboxIndex = 0;
let activePhotosList = [];

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const categoryTabs = document.getElementById('gallery-categories');
const coupleNameDisplay = document.getElementById('gallery-couple-name');
const eventTitleDisplay = document.getElementById('gallery-event-title');
const eventDateDisplay = document.getElementById('gallery-event-date');

// Action Buttons
const btnSelectMode = document.getElementById('btn-select-mode');
const btnDownloadZip = document.getElementById('btn-download-zip');
const btnShareGallery = document.getElementById('btn-share-gallery');

// Sticky bottom selection bar
const selectionBar = document.getElementById('selection-bar');
const selectionCount = document.getElementById('selection-count');
const btnCancelSelect = document.getElementById('btn-cancel-select');
const btnActionDownloadSelected = document.getElementById('btn-action-download-selected');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxIndex = document.getElementById('lightbox-index');
const lightboxCategory = document.getElementById('lightbox-category');
const lightboxBtnDownload = document.getElementById('lightbox-btn-download');
const lightboxBtnShare = document.getElementById('lightbox-btn-share');

// Helper to show modern toast notification
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    
    // Check mark or status icon
    const icon = type === 'success' 
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:var(--gold)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
        
    toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Initialize Gallery DOM listeners
export function initGallery() {
    // Category tabs
    categoryTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            categoryTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderGalleryGrid(e.target.dataset.category);
        }
    });

    // Select mode toggle
    btnSelectMode.addEventListener('click', toggleSelectMode);
    btnCancelSelect.addEventListener('click', exitSelectMode);
    
    // Selection Bar actions
    btnActionDownloadSelected.addEventListener('click', downloadSelectedPhotos);
    
    // Bulk Zip download
    btnDownloadZip.addEventListener('click', downloadAllPhotosZip);
    
    // Sharing
    btnShareGallery.addEventListener('click', sharePrivateLink);
    
    // Lightbox triggers
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);
    
    // Lightbox actions
    lightboxBtnDownload.addEventListener('click', () => {
        const photo = activePhotosList[currentLightboxIndex];
        if (photo) triggerFileDownload(photo.url, `${photo.id}-${photo.category}.jpg`);
    });
    lightboxBtnShare.addEventListener('click', shareIndividualPhoto);
    
    // Keyboard navigational events for lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('view-hidden')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
        }
    });
}

// Load current event data and update DOM
export function loadGallery() {
    const event = state.activeEvent;
    if (!event) return;
    
    // Update labels
    coupleNameDisplay.textContent = event.couple;
    eventTitleDisplay.textContent = event.title;
    eventDateDisplay.textContent = formatDate(event.date);
    
    // Reset filters and render all
    categoryTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    categoryTabs.querySelector('[data-category="all"]').classList.add('active');
    
    exitSelectMode();
    renderGalleryGrid('all');
}

// Format date utility
function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

// Render photo items into grid
function renderGalleryGrid(categoryFilter = 'all') {
    galleryGrid.innerHTML = '';
    const event = state.activeEvent;
    if (!event) return;
    
    // Filter photos
    activePhotosList = categoryFilter === 'all' 
        ? event.photos 
        : event.photos.filter(p => p.category === categoryFilter);
        
    if (activePhotosList.length === 0) {
        galleryGrid.innerHTML = `
            <div class="results-placeholder" style="grid-column: 1 / -1; min-height: 200px;">
                <h3>No Photos Found</h3>
                <p>There are no photos uploaded in this moment category yet.</p>
            </div>
        `;
        return;
    }
    
    activePhotosList.forEach((photo, index) => {
        let fallbackAsset = 'assets/portrait.jpg';
        if (photo.category === 'ceremony') fallbackAsset = 'assets/ceremony.jpg';
        if (photo.category === 'candid') fallbackAsset = 'assets/candid.jpg';
        if (photo.category === 'reception') fallbackAsset = 'assets/reception.jpg';

        const item = document.createElement('div');
        item.className = `gallery-item ${selectedPhotoIds.has(photo.id) ? 'selected' : ''}`;
        item.dataset.id = photo.id;
        item.dataset.index = index;
        
        item.innerHTML = `
            <img src="${photo.url}" alt="${photo.title}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackAsset}';">
            <div class="gallery-item-checkbox"></div>
            <div class="gallery-item-overlay">
                <span class="item-moment">${photo.category}</span>
                <div class="item-actions">
                    <span class="item-title">${photo.title}</span>
                    <button class="btn-item-download" title="Download Photo">
                        <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add click events
        item.addEventListener('click', (e) => {
            const downloadBtn = e.target.closest('.btn-item-download');
            if (downloadBtn) {
                e.stopPropagation();
                triggerFileDownload(photo.url, `${photo.id}-${photo.category}.jpg`);
                logActivity(event.code, 'Photo Download', `Downloaded photo: ${photo.title}`);
                return;
            }
            
            if (isSelectMode) {
                togglePhotoSelection(photo.id, item);
            } else {
                openLightbox(index);
            }
        });
        
        galleryGrid.appendChild(item);
    });
}

// Selection Mode Functions
function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    if (isSelectMode) {
        btnSelectMode.classList.add('btn-primary');
        btnSelectMode.querySelector('span').textContent = 'Exit Select Mode';
        galleryGrid.classList.add('select-mode-active');
        selectionBar.classList.remove('view-hidden');
        selectedPhotoIds.clear();
        updateSelectionCounter();
    } else {
        exitSelectMode();
    }
}

// Exit Selection Mode
export function exitSelectMode() {
    isSelectMode = false;
    btnSelectMode.classList.remove('btn-primary');
    btnSelectMode.querySelector('span').textContent = 'Select Multiple';
    galleryGrid.classList.remove('select-mode-active');
    selectionBar.classList.add('view-hidden');
    selectedPhotoIds.clear();
    
    // Clear item visual selections
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.classList.remove('selected');
    });
}

function togglePhotoSelection(photoId, itemElement) {
    if (selectedPhotoIds.has(photoId)) {
        selectedPhotoIds.delete(photoId);
        itemElement.classList.remove('selected');
    } else {
        selectedPhotoIds.add(photoId);
        itemElement.classList.add('selected');
    }
    updateSelectionCounter();
}

function updateSelectionCounter() {
    const count = selectedPhotoIds.size;
    selectionCount.textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
    
    if (count > 0) {
        btnActionDownloadSelected.removeAttribute('disabled');
    } else {
        btnActionDownloadSelected.setAttribute('disabled', 'true');
    }
}

// Download action simulations
function triggerFileDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Update stats
    let totalDownloads = parseInt(localStorage.getItem('sas_total_downloads') || '0');
    localStorage.setItem('sas_total_downloads', totalDownloads + 1);
}

function downloadSelectedPhotos() {
    const count = selectedPhotoIds.size;
    if (count === 0) return;
    
    showToast(`Preparing download for ${count} selected photos...`);
    
    // Download photos sequentially
    let i = 0;
    const selectedIds = Array.from(selectedPhotoIds);
    const event = state.activeEvent;
    
    const interval = setInterval(() => {
        if (i < selectedIds.length) {
            const photo = event.photos.find(p => p.id === selectedIds[i]);
            if (photo) {
                triggerFileDownload(photo.url, `${photo.id}-${photo.category}.jpg`);
            }
            i++;
        } else {
            clearInterval(interval);
            showToast(`Downloaded ${count} photos successfully!`);
            logActivity(event.code, 'Bulk Download', `Downloaded ${count} photos`);
            exitSelectMode();
        }
    }, 400); // Small interval to prevent browser thread blocking
}

function downloadAllPhotosZip() {
    const event = state.activeEvent;
    if (!event) return;
    
    showToast(`Generating secure zip archive of all ${event.photos.length} photos...`);
    
    // Simulate compilation loading state
    const bar = document.getElementById('top-loader');
    bar.style.display = 'block';
    bar.style.width = '0%';
    
    let progress = 0;
    const int = setInterval(() => {
        progress += 10;
        bar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(int);
            setTimeout(() => {
                bar.style.width = '0%';
                
                // Trigger mockup ZIP download
                const dummyData = "mock-zip-binary-data";
                const blob = new Blob([dummyData], { type: 'application/zip' });
                const zipUrl = URL.createObjectURL(blob);
                
                triggerFileDownload(zipUrl, `${event.code}-wedding-memories.zip`);
                showToast("ZIP download triggered successfully!");
                logActivity(event.code, 'Zip Download', `Downloaded full zip archive`);
            }, 100);
        }
    }, 200);
}

// Sharing controls
function sharePrivateLink() {
    const event = state.activeEvent;
    if (!event) return;
    
    // Copy mockup URL containing secret credentials token to clipboard
    const shareUrl = `${window.location.origin}${window.location.pathname}?event=${event.code}&token=${event.password}#login`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("Private access link copied to clipboard!");
        logActivity(event.code, 'Share Gallery', 'Generated and copied gallery share link');
    }).catch(err => {
        console.error('Clipboard copy failed: ', err);
        showToast("Could not copy link automatically.", "error");
    });
}

function shareIndividualPhoto() {
    const photo = activePhotosList[currentLightboxIndex];
    if (!photo) return;
    
    const photoUrl = `${window.location.origin}${window.location.pathname}${photo.url}`;
    navigator.clipboard.writeText(photoUrl).then(() => {
        showToast("Photo direct link copied to clipboard!");
        logActivity(state.activeEvent.code, 'Share Photo', `Copied link of photo: ${photo.title}`);
    });
}

// Lightbox Overlay
function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxUI();
    lightbox.classList.remove('view-hidden');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
}

function closeLightbox() {
    lightbox.classList.add('view-hidden');
    document.body.style.overflow = '';
}

function updateLightboxUI() {
    const photo = activePhotosList[currentLightboxIndex];
    if (!photo) return;
    
    lightboxImg.src = photo.url;
    lightboxIndex.textContent = `Photo ${currentLightboxIndex + 1} of ${activePhotosList.length}`;
    lightboxCategory.textContent = photo.category;
    
    // Show navigation buttons for gallery lightbox
    document.getElementById('lightbox-prev').style.display = 'flex';
    document.getElementById('lightbox-next').style.display = 'flex';
}

function showPrevImage() {
    if (activePhotosList.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + activePhotosList.length) % activePhotosList.length;
    updateLightboxUI();
}

function showNextImage() {
    if (activePhotosList.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % activePhotosList.length;
    updateLightboxUI();
}
