// ══════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════

const MAP_CENTER = [27.990, -82.825];
const MAP_BOUNDS = L.latLngBounds(
    [27.940, -82.845],   // SW
    [28.045, -82.795]    // NE
);
const minZoom = window.innerWidth <= 400 ? 13 : 14;

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
let isListView = false;


// ══════════════════════════════════════════════
//  MAP INIT & TILE LAYERS
// ══════════════════════════════════════════════

const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri',
    maxZoom: 19,
});

const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    pane: 'overlayPane',
    className: 'satellite-labels'
});

const map = L.map('map', {
    center: MAP_CENTER,
    zoom: minZoom,
    minZoom: minZoom,
    maxZoom: 19,
    maxBounds: MAP_BOUNDS,
    maxBoundsViscosity: 1.0,
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
    renderCards();
    buildLegend();
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
            html: `<div class="custom-marker cat-${poi.category}" data-num="${POIS.indexOf(poi) + 1}">${POIS.indexOf(poi) + 1}</div>`,
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

    // Also re-render cards if in list mode
    renderCards();
    buildLegend(category);
}

// ══════════════════════════════════════════════
//  LEGEND PANEL BUILD
// ══════════════════════════════════════════════

const CAT_ORDER = ['dining', 'attractions', 'nature', 'nightlife', 'shopping', 'hotels', 'services'];

function buildLegend(filterCat = 'all') {
    const body = document.getElementById('legendBody');
    if (!body) return;
    body.innerHTML = '';

    CAT_ORDER.forEach(catKey => {
        if (filterCat !== 'all' && catKey !== filterCat) return;

        const items = POIS.filter(p => p.category === catKey);
        if (!items.length) return;

        const cat = CATEGORY_COLORS[catKey];
        const cat_icons = CATEGORY_ICONS[catKey];

        const section = document.createElement('div');
        section.className = `cat-section ${catKey}`;

        const head = document.createElement('div');
        head.className = `cat-head ${catKey}`;
        head.innerHTML = `<span class="cat-icon">${cat_icons}</span> ${cat.label}`;
        section.appendChild(head);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'cat-items';

        items.forEach(poi => {
            const num = POIS.indexOf(poi) + 1;
            const item = document.createElement('div');
            item.className = 'cat-item';
            item.innerHTML = `
                <div class="nbadge ${catKey}">${num}</div>
                <div>
                    <div class="item-name">${poi.name}</div>
                    <div class="item-addr">${poi.address}</div>
                </div>`;
            item.addEventListener('click', () => {
                const entry = markers.find(m => m.poi === poi);
                if (entry) {
                    map.flyTo([poi.lat, poi.lng], 16, { duration: 0.8 });
                    setTimeout(() => openDrawer(poi), 850);
                }
            });
            itemsDiv.appendChild(item);
        });

        section.appendChild(itemsDiv);
        body.appendChild(section);
    });
}


// ══════════════════════════════════════════════
//  LIST VIEW — CARDS
// ══════════════════════════════════════════════

function renderCards() {
    const grid = document.getElementById('listGrid');
    const countEl = document.getElementById('listCount');
    if (!grid) return;

    let userLatLng = null;
    try {
        const stored = localStorage.getItem('lastLocation');
        if (stored) {
            const { lat, lng } = JSON.parse(stored);
            userLatLng = L.latLng(lat, lng);
        }
    } catch (err) {
        console.error('Error parsing user location:', err);
    }

    // Filter, attach distance, sort
    let filtered = (activeCategory === 'all' ? POIS : POIS.filter(p => p.category === activeCategory))
        .map((poi, originalIndex) => ({
            ...poi,
            _poiIndex: POIS.indexOf(poi), // capture before spread
            distance: userLatLng ? userLatLng.distanceTo(L.latLng(poi.lat, poi.lng)) * 0.000621371 : null
        }));

    if (userLatLng) {
        filtered.sort((a, b) => a.distance - b.distance);
    }

    countEl.textContent = `${filtered.length} place${filtered.length !== 1 ? 's' : ''}${activeCategory !== 'all' ? ` · ${CATEGORY_COLORS[activeCategory].label}` : ''}`;

    grid.innerHTML = filtered.map((poi, i) => {
        const cat = CATEGORY_COLORS[poi.category];
        const icon = CATEGORY_ICONS[poi.category];
        const distanceLabel = poi.distance !== null
            ? `<span class="poi-card-distance">${poi.distance.toFixed(1)} mi away</span>`
            : '';

        const linkBtn = poi.link
            ? `<span class="poi-card-cta">${poi.linkLabel || 'Learn More'} →</span>`
            : `<span></span>`;

        return `
            <div class="poi-card" style="animation-delay:${i * 30}ms" data-poi-index="${poi._poiIndex}"">
                <div class="poi-card-accent" style="background:${cat.bg}"></div>
                <div class="poi-card-body">
                    <div class="poi-card-header">
                        <div class="poi-card-icon" style="background:${cat.bg}20">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color:${cat.bg}" stroke="${cat.bg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                ${icon.replace(/<svg[^>]*>|<\/svg>/g, '')}
                            </svg>
                        </div>
                        <div class="poi-card-meta">
                            <div class="poi-card-category" style="color:${cat.bg}">${cat.label}</div>
                            <div class="poi-card-name" title="${poi.name}">${poi.name}</div>
                        </div>
                    </div>
                    <div class="poi-card-address">${poi.address}</div>
                    <div class="poi-card-desc">${poi.description}</div>
                    <div class="poi-card-footer">
                        ${distanceLabel}
                        ${linkBtn}
                        <button class="poi-card-dir" onclick="event.stopPropagation(); openDirections(${poi.lat}, ${poi.lng})">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <path d="M3.27 12.77L12 21.5l8.73-8.73a2.5 2.5 0 000-3.54l-5.19-5.19a2.5 2.5 0 00-3.54 0L3.27 12.77z"
                                    stroke="#7A8599" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Directions
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Attach click handlers to cards
    grid.querySelectorAll('.poi-card').forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.dataset.poiIndex, 10);
            openDrawer(POIS[idx]);
        });
    });
}

// ══════════════════════════════════════════════
//  VIEW TOGGLE (MAP ↔ LIST)
// ══════════════════════════════════════════════

function initViewToggle() {
    const btn = document.getElementById('viewToggleBtn');
    const label = btn.querySelector('.view-toggle-label');

    btn.addEventListener('click', () => {
        isListView = !isListView;
        document.body.classList.toggle('list-mode', isListView);
        document.getElementById('listPanel').setAttribute('aria-hidden', String(!isListView));

        if (isListView) {
            label.textContent = 'Map';
            renderCards();
            // Scroll list back to top on each open
            document.getElementById('listPanel').scrollTop = 0;
        } else {
            label.textContent = 'List';
            // Invalidate map size in case viewport changed
            setTimeout(() => map.invalidateSize(), 350);
        }
    });
}


// ══════════════════════════════════════════════
//  FILTER PILLS
// ══════════════════════════════════════════════

function initFilters() {
    const filterOptions = document.getElementById('filterOptions');

    filterOptions.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const isActive = pill.classList.contains('active');

            // Deselect all
            filterOptions.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));

            if (isActive) {
                // Tapping the active pill again resets to "all"
                activeCategory = 'all';
            } else {
                pill.classList.add('active');
                activeCategory = pill.dataset.category;
            }

            filterMarkers(activeCategory);
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

        let distanceLabel = '';
        try {
            const stored = localStorage.getItem('lastLocation');
            if (stored) {
                const { lat, lng } = JSON.parse(stored);
                const distance = L.latLng(lat, lng).distanceTo(L.latLng(poi.lat, poi.lng)) * 0.000621371;
                distanceLabel = `<p class="drawer-distance">${distance.toFixed(1)} mi away</p>`;
            }

        } catch (e) {
            console.error('Error calculating distance for drawer:', e);
        }

        let actionsHTML = '';
        if (poi.link) {
            actionsHTML += `
                <a href="${poi.link}" target="_blank" rel="noopener" class="drawer-btn primary" title="Visit ${poi.name}">
                    ${poi.linkLabel || 'Learn More'} →
                </a>`;
        }
        actionsHTML += `
            <button class="drawer-btn secondary" onclick="openDirections(${poi.lat}, ${poi.lng})" title="Get directions to ${poi.name}">
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
            <div class="drawer-address-row">
                <p class="drawer-address">${poi.address}</p>
                ${distanceLabel}
            </div>
            <p class="drawer-desc">${poi.description}</p>
            <div class="drawer-actions">${actionsHTML}</div>
        `;

        drawer.classList.add('open');
        drawerOverlay.classList.add('visible');
        if (!isListView) document.body.classList.add('drawer-open');
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

    let formatted = message.replace(/\.\s+/g, '.<br>');

    toast.innerHTML = formatted;
    toast.classList.add('visible');

    toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
        toast.textContent = ''; // reset safely
    }, duration);
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
                // store in localStorage for potential future use (e.g. centering map on reload)
                localStorage.setItem('lastLocation', JSON.stringify({ lat: coords.latitude, lng: coords.longitude }));

                if (!MAP_BOUNDS.contains(latlng)) {
                    showToast('You are outside the map area. Tracking Stopped.');

                    // drop lastLocation since it's out of bounds, so we don't try to recenter there on reload
                    localStorage.removeItem('lastLocation');

                    stopTracking();
                    return;
                }
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

    // Auto-start on page load
    startTracking();
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
    initViewToggle();
    await loadPois();

    window.addEventListener('load', () => {
        setTimeout(() => map.invalidateSize(), 300);
    });
}

initApp();

// ══════════════════════════════════════════════
//  Event Handlers for elements above map
// ══════════════════════════════════════════════
document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('mouseenter', () => pill.classList.add('hovered'));
    pill.addEventListener('mouseleave', () => pill.classList.remove('hovered'));
});