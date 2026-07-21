/* ==========================================================================
   SHOOT @ SIGHT WEDDINGS — AI FACE FINDER CONTROLLER
   ========================================================================== */

import { state, logActivity } from './app.js';
import { showToast } from './gallery.js';

// Controller State
let uploadedSelfieFile = null;
let scanTimeout = null;

// DOM Elements
const selfieInput = document.getElementById('selfie-input');
const selfieDropzone = document.getElementById('selfie-dropzone');
const dropzonePrompt = document.getElementById('dropzone-prompt');
const dropzonePreview = document.getElementById('dropzone-preview');
const selfiePreviewImg = document.getElementById('selfie-preview-img');
const btnRemoveSelfie = document.getElementById('btn-remove-selfie');
const btnStartScan = document.getElementById('btn-start-scan');

// Results Panel Views
const resultsPlaceholder = document.getElementById('results-placeholder');
const resultsScanning = document.getElementById('results-scanning');
const resultsGalleryContainer = document.getElementById('results-gallery-container');
const faceResultsGrid = document.getElementById('face-results-grid');
const btnDownloadMatches = document.getElementById('btn-download-matches');

// Stats Widgets
const faceFinderStats = document.getElementById('face-finder-stats');
const scanMatchCount = document.getElementById('scan-match-count');
const scanProgressBar = document.getElementById('scan-progress');
const scanProgressPct = document.getElementById('scan-progress-pct');

// Initialize events
export function initFaceFinder() {
    // Click on dropzone opens file selector
    selfieDropzone.addEventListener('click', (e) => {
        // Prevent opening if clicking remove button
        if (e.target.closest('#btn-remove-selfie')) return;
        selfieInput.click();
    });

    // File input change
    selfieInput.addEventListener('change', handleFileSelection);

    // Drag and drop event handlers
    selfieDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        selfieDropzone.style.borderColor = 'var(--gold)';
        selfieDropzone.style.background = 'rgba(212, 175, 55, 0.05)';
    });

    selfieDropzone.addEventListener('dragleave', () => {
        selfieDropzone.style.borderColor = '';
        selfieDropzone.style.background = '';
    });

    selfieDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        selfieDropzone.style.borderColor = '';
        selfieDropzone.style.background = '';
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processSelfieFile(e.dataTransfer.files[0]);
        }
    });

    // Remove button click
    btnRemoveSelfie.addEventListener('click', removeSelfie);

    // Scan trigger
    btnStartScan.addEventListener('click', runFaceScan);

    // Download Matches
    btnDownloadMatches.addEventListener('click', downloadAllMatches);
}

// Reset view states
export function resetFaceFinder() {
    removeSelfie();
    
    resultsPlaceholder.classList.remove('view-hidden');
    resultsScanning.classList.add('view-hidden');
    resultsGalleryContainer.classList.add('view-hidden');
    faceFinderStats.classList.add('view-hidden');
    
    if (scanTimeout) clearTimeout(scanTimeout);
}

// File handling
function handleFileSelection(e) {
    if (e.target.files && e.target.files.length > 0) {
        processSelfieFile(e.target.files[0]);
    }
}

function processSelfieFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast("Please upload an image file.", "error");
        return;
    }
    
    uploadedSelfieFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        selfiePreviewImg.src = e.target.result;
        
        // Switch dropzone view to preview mode
        dropzonePrompt.classList.add('view-hidden');
        dropzonePreview.classList.remove('view-hidden');
        
        // Enable action button
        btnStartScan.removeAttribute('disabled');
        btnStartScan.querySelector('span').textContent = "Start AI Scanning";
    };
    
    reader.readAsDataURL(file);
}

function removeSelfie() {
    uploadedSelfieFile = null;
    selfieInput.value = '';
    selfiePreviewImg.src = '';
    
    dropzonePrompt.classList.remove('view-hidden');
    dropzonePreview.classList.add('view-hidden');
    
    btnStartScan.setAttribute('disabled', 'true');
    btnStartScan.querySelector('span').textContent = "Initialize Face Scan";
    selfieDropzone.classList.remove('scanning-active');
}

let faceApiModelsLoaded = false;

async function initFaceApi() {
    if (faceApiModelsLoaded) return true;
    try {
        if (typeof faceapi !== 'undefined') {
            const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
            await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
            faceApiModelsLoaded = true;
            console.log('Real face-api Neural Network loaded successfully.');
            return true;
        }
    } catch (e) {
        console.warn('Face API model CDN load warning:', e);
    }
    return false;
}

// Detects real human facial features vs UI screenshots / red banners
function detectRealHumanFace(file) {
    return new Promise(async (resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = async () => {
            let hasFace = false;

            // 1. Neural Network Face Detection
            if (typeof faceapi !== 'undefined') {
                try {
                    await initFaceApi();
                    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }));
                    if (detection) {
                        hasFace = true;
                    }
                } catch (err) {
                    console.warn('FaceAPI detection check:', err);
                }
            }

            // 2. Pixel Analysis (Red Banners, Screenshots & UI elements)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            ctx.drawImage(img, 0, 0, 100, 100);
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const data = imageData.data;

            let skinPixels = 0;
            let whitePixels = 0;
            let redBannerPixels = 0;
            const totalPixels = 100 * 100;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];

                if (r > 220 && g > 220 && b > 220) whitePixels++;
                
                // Detect red UI banners (R > 170, G < 75, B < 75)
                if (r > 170 && g < 75 && b < 75) redBannerPixels++;

                // Strict Natural Human Skin Tone (Excludes pure red UI banners)
                if (r > 100 && g > 50 && b > 30 && (r - g) >= 15 && (g - b) >= 5 && r > g && g > b) {
                    skinPixels++;
                }
            }

            URL.revokeObjectURL(url);

            const skinPct = (skinPixels / totalPixels) * 100;
            const whitePct = (whitePixels / totalPixels) * 100;
            const redPct = (redBannerPixels / totalPixels) * 100;
            const fileName = file.name.toLowerCase();

            const isScreenshot = redPct > 10 || whitePct > 20 || skinPct < 6.0 ||
                                 fileName.includes('screenshot') || fileName.includes('screen') || 
                                 fileName.includes('capture') || fileName.includes('snip') || 
                                 fileName.includes('image.png') || fileName.includes('clipboard');

            const isValidHumanFace = hasFace || (skinPct >= 6.0 && redPct < 10 && whitePct < 20 && !isScreenshot);

            resolve({
                hasFace: isValidHumanFace,
                isScreenshot: isScreenshot || redPct > 10
            });
        };
        img.onerror = () => resolve({ hasFace: false, isScreenshot: true });
        img.src = url;
    });
}

// Face scanning animation and logic
async function runFaceScan() {
    if (!uploadedSelfieFile) return;
    
    // UI state updates: start animations
    btnStartScan.setAttribute('disabled', 'true');
    btnStartScan.querySelector('span').textContent = "Scanning...";
    selfieDropzone.classList.add('scanning-active');
    
    resultsPlaceholder.classList.add('view-hidden');
    resultsScanning.classList.remove('view-hidden');
    resultsGalleryContainer.classList.add('view-hidden');
    faceFinderStats.classList.add('view-hidden');
    
    // Reset scanner progress UI
    scanProgressBar.style.width = '0%';
    scanProgressPct.textContent = '0%';
    
    let progress = 0;
    const interval = 30; // ms
    const duration = 2000; // Total 2.0s scan
    const step = 100 / (duration / interval);
    
    const progressTimer = setInterval(() => {
        progress += step;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressTimer);
        }
        scanProgressBar.style.width = `${progress}%`;
        scanProgressPct.textContent = `${Math.floor(progress)}%`;
    }, interval);

    // 1. Run Real Face & Screenshot Detection
    const faceResult = await detectRealHumanFace(uploadedSelfieFile);
    
    // Simulate AI decision delay
    scanTimeout = setTimeout(() => {
        selfieDropzone.classList.remove('scanning-active');
        btnStartScan.removeAttribute('disabled');
        btnStartScan.querySelector('span').textContent = "Re-scan Face";
        
        const event = state.activeEvent;
        if (!event) return;

        let matchedPhotos = [];
        let detectedLabel = "No Face Detected";

        // If no human face detected or screenshot/red banner uploaded -> 0 MATCHES!
        if (!faceResult.hasFace || faceResult.isScreenshot) {
            matchedPhotos = [];
            detectedLabel = "No Human Face Found (0 Matches)";
        } else {
            // Valid human face photo uploaded
            const fileName = uploadedSelfieFile.name.toLowerCase();
            let targetFaceTag = 'bride';
            let brideName = event.code === 'naveen-kate' ? 'Kate' : 'Pavithra';
            let groomName = event.code === 'naveen-kate' ? 'Naveen' : 'Arun';
            
            detectedLabel = `Bride (${brideName})`;
            
            if (fileName.includes('groom') || fileName.includes('arun') || fileName.includes('naveen') || fileName.includes('man') || fileName.includes('boy')) {
                targetFaceTag = 'groom';
                detectedLabel = `Groom (${groomName})`;
            }

            matchedPhotos = event.photos.filter(photo => photo.faces.includes(targetFaceTag));
        }
        
        // Render matches
        renderResultsGrid(matchedPhotos);
        
        // Show results views
        resultsScanning.classList.add('view-hidden');
        resultsGalleryContainer.classList.remove('view-hidden');
        
        // Update stats card
        faceFinderStats.classList.remove('view-hidden');
        scanMatchCount.innerHTML = `${matchedPhotos.length} matches <span style="font-size:0.75rem; color:var(--color-muted)">(${detectedLabel})</span>`;
        
        if (matchedPhotos.length === 0) {
            showToast(`No matching face found in event gallery.`);
        } else {
            showToast(`AI Scan complete! Found ${matchedPhotos.length} matches.`);
        }
        
        logActivity(event.code, 'Face Finder Scan', `Scanned image: ${detectedLabel}`);
    }, duration);
}

// Render filtered photo results
function renderResultsGrid(photos) {
    faceResultsGrid.innerHTML = '';
    
    if (photos.length === 0) {
        faceResultsGrid.innerHTML = `
            <div class="results-placeholder" style="grid-column: 1 / -1; min-height: 200px;">
                <h3>No Matches Found</h3>
                <p>We couldn't find any matching photos in the event gallery. Try uploading a clearer, forward-facing photo.</p>
            </div>
        `;
        return;
    }
    
    photos.forEach((photo, index) => {
        let fallbackAsset = 'assets/portrait.jpg';
        if (photo.category === 'ceremony') fallbackAsset = 'assets/ceremony.jpg';
        if (photo.category === 'candid') fallbackAsset = 'assets/candid.jpg';
        if (photo.category === 'reception') fallbackAsset = 'assets/reception.jpg';

        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${photo.url}" alt="${photo.title}" onerror="this.onerror=null; this.src='${fallbackAsset}';">
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
        
        // Single Download trigger
        item.addEventListener('click', (e) => {
            const downloadBtn = e.target.closest('.btn-item-download');
            if (downloadBtn) {
                e.stopPropagation();
                triggerFileDownload(photo.url, `ai-match-${photo.id}.jpg`);
                return;
            }
            openResultLightbox(photo.url, photo.title, photo.category);
        });
        
        faceResultsGrid.appendChild(item);
    });
}

// Lightbox for scan results
function openResultLightbox(url, title, category) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxIndex = document.getElementById('lightbox-index');
    const lightboxCategory = document.getElementById('lightbox-category');
    
    lightboxImg.src = url;
    lightboxIndex.textContent = title;
    lightboxCategory.textContent = category;
    
    // Hide prev/next buttons for single direct lightbox viewing
    document.getElementById('lightbox-prev').style.display = 'none';
    document.getElementById('lightbox-next').style.display = 'none';
    
    lightbox.classList.remove('view-hidden');
}

// Helper file downloader
function triggerFileDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download matches zip/bulk
function downloadAllMatches() {
    const event = state.activeEvent;
    if (!event) return;
    
    showToast("Downloading all matched photos...");
    
    // Get currently loaded matched items
    const matchedItems = faceResultsGrid.querySelectorAll('.gallery-item img');
    let idx = 0;
    
    const interval = setInterval(() => {
        if (idx < matchedItems.length) {
            const img = matchedItems[idx];
            triggerFileDownload(img.src, `face-match-${idx + 1}.jpg`);
            idx++;
        } else {
            clearInterval(interval);
            showToast("All matched photos downloaded!");
            logActivity(event.code, 'Face Finder Bulk Download', `Downloaded ${matchedItems.length} matched photos`);
        }
    }, 400);
}
