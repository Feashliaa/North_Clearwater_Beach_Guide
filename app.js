// ══════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════

const MAP_CENTER = [27.98, -82.82];
const MAP_BOUNDS = L.latLngBounds(
    [27.9675, -82.850],
    [28.5, -82.80]
);

const CATEGORY_COLORS = {
    dining: { bg: '#E07A5F', label: 'Dining' },
    attractions: { bg: '#0077B6', label: 'Attractions' },
    nature: { bg: '#57A773', label: 'Nature' },
    shopping: { bg: '#9B5DE5', label: 'Shopping' },
    nightlife: { bg: '#E05299', label: 'Nightlife' },
    services: { bg: '#2EC4B6', label: 'Services' },
    hotels: { bg: '#F4A261', label: 'Hotels' }
};

const CATEGORY_ICONS = {
    dining: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>`,
    attractions: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 9a3 3 0 010-6h20a3 3 0 110 6"/><path d="M2 15a3 3 0 000 6h20a3 3 0 100-6"/><path d="M2 9v6"/><path d="M22 9v6"/><path d="M9 3v18"/>
    </svg>`,
    nature: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>`,
    shopping: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>
    </svg>`,
    nightlife: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 22h8"/><path d="M12 11v11"/><path d="M19 3l-7 8-7-8h14z"/>
    </svg>`,
    services: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 17h14v-5l-2-5H7L5 12v5z"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M5 12h14"/><path d="M9 7v5"/><path d="M15 7v5"/>
    </svg>`,
    hotels: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 21h20"/><path d="M5 21v-8a3 3 0 013-3h8a3 3 0 013 3v8"/><path d="M9 10h.01"/><path d="M15 10h.01"/>
    </svg>`
};


// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════

let POIS = [];
let markers = [];
let activeCategory = 'all';
let filtersExpanded = false;
let isSatellite = false;
let isTracking = false;
let watchId = null;
let locationMarker = null;
let locationCircle = null;
let touchStartY = 0;
let toastTimer = null;


// ══════════════════════════════════════════════
//  MAP INIT & TILE LAYERS
// ══════════════════════════════════════════════

const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri',
    maxZoom: 19
});

const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    pane: 'overlayPane',
    className: 'satellite-labels'
});

const map = L.map('map', {
    center: MAP_CENTER,
    zoom: 15,
    minZoom: 14,
    maxZoom: 18,
    maxBounds: MAP_BOUNDS.pad(0.1),
    maxBoundsViscosity: 0.9,
    zoomControl: false,
    attributionControl: true,
    layers: [streetLayer]
});

function initTileErrorHandling() {
    [streetLayer, satelliteLayer].forEach(layer => {
        layer.on('tileerror', e => {
            const tile = e.tile;
            const src = tile.src;
            setTimeout(() => { tile.src = ''; tile.src = src; }, 2000);
        });
    });
}


// ══════════════════════════════════════════════
//  POI LOADING
// ══════════════════════════════════════════════

async function loadPois() {
    try {
        const res = await fetch('pois.json');
        POIS = await res.json();
    } catch (err) {
        showToast('Failed to load points of interest.');
        POIS = [];
    }
    createMarkers();
}


// ══════════════════════════════════════════════
//  MARKERS
// ══════════════════════════════════════════════

function createMarkers() {
    markers.forEach(m => map.removeLayer(m.leafletMarker));
    markers = [];

    POIS.forEach(poi => {
        const icon = L.divIcon({
            className: '',
            html: `<div class="custom-marker cat-${poi.category}">${CATEGORY_ICONS[poi.category]}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const leafletMarker = L.marker([poi.lat, poi.lng], { icon })
            .addTo(map)
            .on('click', () => openDrawer(poi));

        markers.push({ poi, leafletMarker });
    });
}

function filterMarkers(category) {
    markers.forEach(({ poi, leafletMarker }) => {
        const el = leafletMarker.getElement();
        const visible = category === 'all' || poi.category === category;

        if (visible) {
            el.style.display = '';
            el.style.opacity = '1';
        } else {
            el.style.opacity = '0';
            setTimeout(() => {
                if (activeCategory !== 'all' && poi.category !== activeCategory) {
                    el.style.display = 'none';
                }
            }, 200);
        }
    });
}


// ══════════════════════════════════════════════
//  FILTER PILLS
// ══════════════════════════════════════════════

function initFilters() {
    const filterToggle = document.getElementById('filterToggle');
    const filterOptions = document.getElementById('filterOptions');

    filterToggle.addEventListener('click', () => {
        if (filtersExpanded) {
            filterOptions.classList.remove('expanded');
            filtersExpanded = false;
            filterToggle.classList.add('active');
            activeCategory = 'all';
            filterMarkers('all');
            filterOptions.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        } else {
            filterOptions.classList.add('expanded');
            filtersExpanded = true;
        }
    });

    filterOptions.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            filterOptions.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            filterToggle.classList.remove('active');
            pill.classList.add('active');
            activeCategory = pill.dataset.category;
            filterMarkers(activeCategory);
            filterOptions.classList.remove('expanded');
            filtersExpanded = false;
        });
    });
}


// ══════════════════════════════════════════════
//  BOTTOM DRAWER
// ══════════════════════════════════════════════

function initDrawer() {
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerContent = document.getElementById('drawerContent');

    window.openDrawer = function (poi) {
        const cat = CATEGORY_COLORS[poi.category];

        let actionsHTML = '';
        if (poi.link) {
            actionsHTML += `
                <a href="${poi.link}" target="_blank" rel="noopener" class="drawer-btn primary">
                    ${poi.linkLabel || 'Learn More'} →
                </a>`;
        }
        actionsHTML += `
            <button class="drawer-btn secondary" onclick="openDirections(${poi.lat}, ${poi.lng})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3.27 12.77L12 21.5l8.73-8.73a2.5 2.5 0 000-3.54l-5.19-5.19a2.5 2.5 0 00-3.54 0L3.27 12.77z"
                          stroke="#1B2838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Directions
            </button>`;

        drawerContent.innerHTML = `
            <div class="drawer-category" style="background:${cat.bg}20; color:${cat.bg}">
                <span class="dot" style="background:${cat.bg}"></span>${cat.label}
            </div>
            <h2 class="drawer-title">${poi.name}</h2>
            <p class="drawer-address">${poi.address}</p>
            <p class="drawer-desc">${poi.description}</p>
            <div class="drawer-actions">${actionsHTML}</div>
        `;

        drawer.classList.add('open');
        drawerOverlay.classList.add('visible');
        document.body.classList.add('drawer-open');
    };

    window.closeDrawer = function () {
        drawer.classList.remove('open');
        drawerOverlay.classList.remove('visible');
        document.body.classList.remove('drawer-open');
    };

    drawerOverlay.addEventListener('click', closeDrawer);
    document.getElementById('drawerClose').addEventListener('click', closeDrawer);
    map.on('click', () => { if (drawer.classList.contains('open')) closeDrawer(); });

    drawer.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    drawer.addEventListener('touchmove', e => { if (e.touches[0].clientY - touchStartY > 60) closeDrawer(); }, { passive: true });
}


// ══════════════════════════════════════════════
//  DIRECTIONS
// ══════════════════════════════════════════════

window.openDirections = function (lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
};


// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), duration);
}


// ══════════════════════════════════════════════
//  GPS TRACKING
// ══════════════════════════════════════════════

function initGps() {
    const gpsBtn = document.getElementById('gpsBtn');

    function stopTracking() {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        if (locationMarker) { map.removeLayer(locationMarker); locationMarker = null; }
        if (locationCircle) { map.removeLayer(locationCircle); locationCircle = null; }
        gpsBtn.classList.remove('tracking');
        isTracking = false;
        watchId = null;
    }

    function startTracking() {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser.');
            return;
        }

        gpsBtn.classList.add('tracking');
        isTracking = true;

        watchId = navigator.geolocation.watchPosition(
            ({ coords }) => {
                const latlng = [coords.latitude, coords.longitude];

                if (locationMarker) {
                    locationMarker.setLatLng(latlng);
                    locationCircle.setLatLng(latlng).setRadius(coords.accuracy);
                } else {
                    locationMarker = L.circleMarker(latlng, {
                        radius: 8, fillColor: '#4285F4', fillOpacity: 1,
                        color: '#FFFFFF', weight: 3
                    }).addTo(map);

                    locationCircle = L.circle(latlng, {
                        radius: coords.accuracy, fillColor: '#4285F4',
                        fillOpacity: 0.1, color: '#4285F4', weight: 1
                    }).addTo(map);
                }

                map.setView(latlng, 16);
            },
            () => {
                showToast('Unable to retrieve your location. Please allow location access and try again.');
                stopTracking();
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    }

    gpsBtn.addEventListener('click', () => isTracking ? stopTracking() : startTracking());
}


// ══════════════════════════════════════════════
//  MAP STYLE TOGGLE
// ══════════════════════════════════════════════

const layersIcon = `<path d="M12 2L2 7l10 5 10-5-10-5z" fill="#1B2838" opacity="0.3"/>
    <path d="M2 17l10 5 10-5" stroke="#1B2838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke="#1B2838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

const globeIcon = `<circle cx="12" cy="12" r="10" stroke="#1B2838" stroke-width="2"/>
    <path d="M2 12h20M12 2c-3 3.6-3 16.4 0 20M12 2c3 3.6 3 16.4 0 20" stroke="#1B2838" stroke-width="2" stroke-linecap="round"/>`;

function initMapToggle() {
    const toggleBtn = document.getElementById('mapToggleBtn');
    const svg = document.getElementById('toggleIcon');

    toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.add('disabled');

        if (isSatellite) {
            map.removeLayer(satelliteLayer);
            map.removeLayer(labelsLayer);
            map.addLayer(streetLayer);
            svg.innerHTML = layersIcon;
        } else {
            map.removeLayer(streetLayer);
            map.addLayer(satelliteLayer);
            map.addLayer(labelsLayer);
            svg.innerHTML = globeIcon;
        }

        isSatellite = !isSatellite;
        setTimeout(() => toggleBtn.classList.remove('disabled'), 500);
    });
}


// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════

async function initApp() {
    initTileErrorHandling();
    initFilters();
    initDrawer();
    initGps();
    initMapToggle();
    await loadPois();

    window.addEventListener('load', () => {
        setTimeout(() => map.invalidateSize(), 300);
    });
}

initApp();