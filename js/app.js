/* ==========================================================================
   SHOOT @ SIGHT WEDDINGS — MAIN STATE & ROUTER ENGINE
   ========================================================================== */

import { initGallery, loadGallery } from './gallery.js';
import { initFaceFinder, resetFaceFinder } from './facefinder.js';
import { initAdmin, updateAdminStats, renderEventsList, renderActivityLogs } from './admin.js';

// Default Demo Event Data
const DEFAULT_EVENTS = [
    {
        code: 'arun-pavithra',
        password: 'memories-magic',
        title: 'The Wedding of Pavithra & Arun',
        couple: 'Pavithra & Arun',
        date: '2026-06-20',
        photos: [
            { id: 'p1', url: 'assets/portrait.jpg', category: 'portraits', title: 'Golden Hour Couple Portrait', faces: ['groom', 'bride'] },
            { id: 'p2', url: 'assets/ceremony.jpg', category: 'ceremony', title: 'Garland Exchange Ritual', faces: ['groom', 'bride'] },
            { id: 'p3', url: 'assets/candid.jpg', category: 'candid', title: 'Bride Laughing with Friends', faces: ['bride'] },
            { id: 'p4', url: 'assets/reception.jpg', category: 'reception', title: 'First Dance Celebration', faces: ['groom', 'bride'] },
            { id: 'p5', url: 'assets/portrait.jpg', category: 'portraits', title: 'Bride Close-up Portrait', faces: ['bride'] },
            { id: 'p6', url: 'assets/ceremony.jpg', category: 'ceremony', title: 'Groom Vows Exchange', faces: ['groom'] },
            { id: 'p7', url: 'assets/candid.jpg', category: 'candid', title: 'Wedding Guests Laughing', faces: [] },
            { id: 'p8', url: 'assets/reception.jpg', category: 'reception', title: 'Reception Grand Entrance', faces: ['groom', 'bride'] },
            { id: 'p9', url: 'assets/portrait.jpg', category: 'portraits', title: 'Groom Sherwani Close-up', faces: ['groom'] },
            { id: 'p10', url: 'assets/ceremony.jpg', category: 'ceremony', title: 'Sacred Fire Mandap Ritual', faces: ['groom', 'bride'] },
            { id: 'p11', url: 'assets/candid.jpg', category: 'candid', title: 'Sincere Joyful Moments', faces: ['bride'] },
            { id: 'p12', url: 'assets/reception.jpg', category: 'reception', title: 'Cutting the Wedding Cake', faces: ['groom', 'bride'] }
        ]
    },
    {
        code: 'naveen-kate',
        password: 'memories-kate',
        title: 'The Wedding of Naveen & Kate',
        couple: 'Naveen & Kate',
        date: '2026-05-14',
        photos: [
            { id: 'nk1', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD07968.webp', category: 'portraits', title: 'Kate Solo Portrait', faces: ['bride'] },
            { id: 'nk2', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD07976.webp', category: 'portraits', title: 'Kate Mirror Reflection', faces: ['bride'] },
            { id: 'nk3', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08046.webp', category: 'ceremony', title: 'Groom Sherwani Detail', faces: ['groom'] },
            { id: 'nk4', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08122.webp', category: 'ceremony', title: 'Kate Archway Portrait', faces: ['bride'] },
            { id: 'nk5', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08132.webp', category: 'ceremony', title: 'Kate Interior Portrait', faces: ['bride'] },
            { id: 'nk6', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08167.webp', category: 'candid', title: 'Naveen Groom Portrait', faces: ['groom'] },
            { id: 'nk7', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08209.webp', category: 'candid', title: 'Naveen & Kate Couple Pose', faces: ['groom', 'bride'] },
            { id: 'nk8', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08264.webp', category: 'candid', title: 'Couples Pillar Standing', faces: ['groom', 'bride'] },
            { id: 'nk9', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08292.webp', category: 'portraits', title: 'Naveen & Kate Carved Pillar', faces: ['groom', 'bride'] },
            { id: 'nk10', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08295.webp', category: 'portraits', title: 'Naveen Groom Solo', faces: ['groom'] },
            { id: 'nk11', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08301.webp', category: 'ceremony', title: 'Kate Close-up Portrait', faces: ['bride'] },
            { id: 'nk12', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08325.webp', category: 'ceremony', title: 'Kate Gold Necklace Portrait', faces: ['bride'] },
            { id: 'nk13', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08335.webp', category: 'reception', title: 'Groom Sherwani Close-up', faces: ['groom'] },
            { id: 'nk14', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08347.webp', category: 'reception', title: 'Naveen & Kate Corridor Walk', faces: ['groom', 'bride'] },
            { id: 'nk15', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08349.webp', category: 'reception', title: 'Naveen & Kate Evening Pose', faces: ['groom', 'bride'] },
            { id: 'nk16', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08396.webp', category: 'reception', title: 'Kate Sitting Portrait', faces: ['bride'] },
            { id: 'nk17', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08404.webp', category: 'candid', title: 'Groom Side Profile', faces: ['groom'] },
            { id: 'nk18', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08450.webp', category: 'candid', title: 'Naveen & Kate Handholding', faces: ['groom', 'bride'] },
            { id: 'nk19', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08467.webp', category: 'portraits', title: 'Kate Side Profile Portrait', faces: ['bride'] },
            { id: 'nk20', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08504.webp', category: 'portraits', title: 'Groom Standing Portrait', faces: ['groom'] },
            { id: 'nk21', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08510.webp', category: 'ceremony', title: 'Naveen & Kate Mandap Pose', faces: ['groom', 'bride'] },
            { id: 'nk22', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08526.webp', category: 'ceremony', title: 'Kate Laughing Candid', faces: ['bride'] },
            { id: 'nk23', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08556.webp', category: 'reception', title: 'Groom Reception Smile', faces: ['groom'] },
            { id: 'nk24', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08617.webp', category: 'reception', title: 'Naveen & Kate Reception Dance', faces: ['groom', 'bride'] },
            { id: 'nk25', url: 'https://pub-53f55a87e6f64c51862dbd0fa933eee1.r2.dev/NAVEEN%20AND%20KATE/SYD08653.webp', category: 'portraits', title: 'Kate Farewell Portrait', faces: ['bride'] }
        ]
    }
];

// Load Database from LocalStorage or seed defaults
export function getEvents() {
    let events = localStorage.getItem('sas_events');
    if (!events) {
        localStorage.setItem('sas_events', JSON.stringify(DEFAULT_EVENTS));
        return DEFAULT_EVENTS;
    }
    let parsed = JSON.parse(events);
    // Auto sync naveen-kate with working Cloudflare R2 URLs
    const idx = parsed.findIndex(e => e.code === 'naveen-kate');
    if (idx === -1) {
        parsed.push(DEFAULT_EVENTS[1]);
    } else {
        parsed[idx].photos = DEFAULT_EVENTS[1].photos;
    }
    localStorage.setItem('sas_events', JSON.stringify(parsed));
    return parsed;
}

export function saveEvents(events) {
    localStorage.setItem('sas_events', JSON.stringify(events));
}

// Activity logging system
export function logActivity(eventCode, action, details) {
    let logs = localStorage.getItem('sas_logs');
    logs = logs ? JSON.parse(logs) : [];
    
    const newLog = {
        timestamp: new Date().toISOString(),
        eventCode: eventCode,
        action: action,
        details: details
    };
    
    logs.unshift(newLog); // Newest first
    localStorage.setItem('sas_logs', JSON.stringify(logs));
}

export function getLogs() {
    let logs = localStorage.getItem('sas_logs');
    return logs ? JSON.parse(logs) : [];
}

// Session state variables
export let state = {
    currentUser: null,  // { role: 'admin' | 'couple', code: 'arun-pavithra' }
    activeEvent: null   // Current active event object
};

// UI Elements
const views = {
    login: document.getElementById('view-login'),
    gallery: document.getElementById('view-gallery'),
    faceFinder: document.getElementById('view-face-finder'),
    admin: document.getElementById('view-admin')
};

const topLoader = document.getElementById('top-loader');
const loginForm = document.getElementById('login-form');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginErrorMsg = document.getElementById('login-error');

const btnLogout = document.getElementById('btn-logout');
const btnAdminNav = document.getElementById('btn-admin-nav');
const btnFaceFinderNav = document.getElementById('btn-face-finder-nav');
const btnBackToGallery = document.getElementById('btn-back-to-gallery');

const btnAdminLogout = document.getElementById('btn-admin-logout');
const btnAdminViewGallery = document.getElementById('btn-admin-view-gallery');

// Show progress loader simulation
export function triggerLoading(duration = 600, callback) {
    topLoader.style.width = '0%';
    topLoader.style.display = 'block';
    
    setTimeout(() => { topLoader.style.width = '30%'; }, 50);
    setTimeout(() => { topLoader.style.width = '70%'; }, duration * 0.4);
    setTimeout(() => { 
        topLoader.style.width = '100%'; 
        setTimeout(() => {
            topLoader.style.width = '0%';
            if (callback) callback();
        }, 150);
    }, duration);
}

// Router view switcher
export function navigateTo(hash) {
    triggerLoading(500, () => {
        // Hide all views
        Object.values(views).forEach(view => view.classList.add('view-hidden'));
        
        // Show target view based on hash or auth state
        const session = JSON.parse(localStorage.getItem('sas_session'));
        if (!session && hash !== '#login') {
            window.location.hash = 'login';
            return;
        }

        if (session) {
            state.currentUser = session;
            const events = getEvents();
            if (session.role === 'couple') {
                state.activeEvent = events.find(e => e.code === session.code);
            } else if (session.role === 'admin') {
                // For admin viewing, default to first event if not set
                if (!state.activeEvent) state.activeEvent = events[0];
            }
        }

        switch (hash) {
            case '#login':
                views.login.classList.remove('view-hidden');
                loginForm.reset();
                loginErrorMsg.style.display = 'none';
                break;
                
            case '#gallery':
                if (state.currentUser.role === 'admin') {
                    btnAdminNav.style.display = 'inline-flex';
                } else {
                    btnAdminNav.style.display = 'none';
                }
                views.gallery.classList.remove('view-hidden');
                loadGallery();
                break;
                
            case '#face-finder':
                views.faceFinder.classList.remove('view-hidden');
                resetFaceFinder();
                break;
                
            case '#admin':
                if (state.currentUser.role !== 'admin') {
                    window.location.hash = 'gallery';
                    return;
                }
                views.admin.classList.remove('view-hidden');
                updateAdminStats();
                renderEventsList();
                renderActivityLogs();
                break;
                
            default:
                // Default route redirect
                if (session) {
                    window.location.hash = session.role === 'admin' ? 'admin' : 'gallery';
                } else {
                    window.location.hash = 'login';
                }
                break;
        }
    });
}

// Handle login submissions
function handleLogin(e) {
    e.preventDefault();
    const username = loginUsernameInput.value.trim().toLowerCase();
    const password = loginPasswordInput.value.trim();
    
    // Check photographer admin credentials
    if (username === 'admin' && password === 'admin123') {
        const session = { role: 'admin', code: 'admin', label: 'Photographer Admin' };
        localStorage.setItem('sas_session', JSON.stringify(session));
        state.currentUser = session;
        logActivity('admin', 'Admin Login', 'Logged into photographer dashboard');
        window.location.hash = 'admin';
        return;
    }
    
    // Check client credentials
    const events = getEvents();
    const matchedEvent = events.find(ev => ev.code === username && ev.password === password);
    
    if (matchedEvent) {
        const session = { role: 'couple', code: matchedEvent.code, label: matchedEvent.couple };
        localStorage.setItem('sas_session', JSON.stringify(session));
        state.currentUser = session;
        state.activeEvent = matchedEvent;
        logActivity(matchedEvent.code, 'Client Login', `Logged in via code: ${matchedEvent.code}`);
        window.location.hash = 'gallery';
    } else {
        loginErrorMsg.style.display = 'block';
        loginErrorMsg.textContent = 'Invalid event code or password. Please try again.';
    }
}

// Perform Log Out
function performLogout() {
    if (state.currentUser) {
        logActivity(state.currentUser.code, 'Logout', 'Logged out of session');
    }
    localStorage.removeItem('sas_session');
    state.currentUser = null;
    state.activeEvent = null;
    window.location.hash = 'login';
}

// Set Active Event (used by Admin to view specific client galleries)
export function setActiveEventByCode(code) {
    const events = getEvents();
    const found = events.find(e => e.code === code);
    if (found) {
        state.activeEvent = found;
    }
}

// App Initialization
function init() {
    // Force seed database
    getEvents();

    // Check URL parameters for auto-login
    const urlParams = new URLSearchParams(window.location.search);
    const urlEvent = urlParams.get('event');
    const urlToken = urlParams.get('token');
    
    if (urlEvent && urlToken) {
        const events = getEvents();
        const matched = events.find(e => e.code === urlEvent && e.password === urlToken);
        if (matched) {
            const session = { role: 'couple', code: matched.code, label: matched.couple };
            localStorage.setItem('sas_session', JSON.stringify(session));
            state.currentUser = session;
            state.activeEvent = matched;
            logActivity(matched.code, 'Auto Login Link', `Logged in automatically via shared link`);
            // Clean URL query parameters to look nice
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }
    }

    
    // Form handlers
    loginForm.addEventListener('submit', handleLogin);
    
    // Navigation controls
    btnLogout.addEventListener('click', performLogout);
    btnAdminLogout.addEventListener('click', performLogout);
    
    btnAdminNav.addEventListener('click', () => { window.location.hash = 'admin'; });
    btnAdminViewGallery.addEventListener('click', () => { window.location.hash = 'gallery'; });
    btnFaceFinderNav.addEventListener('click', () => { window.location.hash = 'face-finder'; });
    btnBackToGallery.addEventListener('click', () => { window.location.hash = 'gallery'; });
    
    // Listen to hash routing
    window.addEventListener('hashchange', () => navigateTo(window.location.hash));
    
    // Initialize components
    initGallery();
    initFaceFinder();
    initAdmin();
    
    // Trigger initial route
    navigateTo(window.location.hash || '#login');
}

// Run app when DOM loaded
document.addEventListener('DOMContentLoaded', init);
