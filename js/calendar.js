// ==============================================
//  CALENDAR MODULE
// ==============================================

(function () {
    let events = [];
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentView = 'grid'; // 'grid' or 'list'

    // - Load Events -
    async function loadEvents() {
        try {
            const res = await fetch('json/events.json');
            events = await res.json();
        } catch (err) {
            console.error('Failed to load events:', err);
            events = [];
        }
    }

    // - Get events for a specific date -
    function getEventsForDate(year, month, day) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    }

    // - Get upcoming events from today forward -
    function getUpcomingEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return events
            .filter(e => new Date(e.date + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // - Render Month Grid -
    function renderGrid() {
        const daysContainer = document.getElementById('calDays');
        const titleEl = document.getElementById('calTitle');
        if (!daysContainer || !titleEl) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        titleEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

        let html = '';

        // Previous month trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            html += `<div class="calendar-day other-month"><div class="calendar-day-num">${day}</div></div>`;
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEvents = getEventsForDate(currentYear, currentMonth, d);
            const isToday = isCurrentMonth && today.getDate() === d;
            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (dayEvents.length) classes.push('has-events');

            let eventsHtml = '';
            if (dayEvents.length) {
                eventsHtml = '<div class="calendar-day-events">';
                dayEvents.slice(0, 2).forEach(ev => {
                    const color = ev.category && CATEGORY_COLORS[ev.category] ? CATEGORY_COLORS[ev.category].bg : 'var(--ocean)';
                    const icon = ev.category && CATEGORY_ICONS[ev.category] ? CATEGORY_ICONS[ev.category] : '';
                    eventsHtml += `<div class="calendar-event-dot" style="background:${color}" title="${ev.title}">${icon} ${ev.title}</div>`;
                });
                if (dayEvents.length > 2) {
                    eventsHtml += `<div class="calendar-event-dot" style="background:#7A8599">+${dayEvents.length - 2} more</div>`;
                }
                eventsHtml += '</div>';
            }

            html += `<div class="${classes.join(' ')}" data-date="${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}">
                <div class="calendar-day-num">${d}</div>
                ${eventsHtml}
            </div>`;
        }

        // Next month leading days
        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month"><div class="calendar-day-num">${i}</div></div>`;
        }

        daysContainer.innerHTML = html;

        // Attach click handlers for days with events
        daysContainer.querySelectorAll('.calendar-day.has-events').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const date = dayEl.dataset.date;
                const dayEvents = events.filter(e => e.date === date);
                if (dayEvents.length === 1) {
                    openEventDrawer(dayEvents[0]);
                } else {
                    openEventListDrawer(date, dayEvents);
                }
            });
        });
    }

    // - Render Upcoming List -
    function renderList() {
        const listContainer = document.getElementById('calList');
        if (!listContainer) return;

        const upcoming = getUpcomingEvents();

        if (!upcoming.length) {
            listContainer.innerHTML = '<div class="calendar-no-events">No upcoming events</div>';
            return;
        }

        listContainer.innerHTML = upcoming.map(ev => {
            const date = new Date(ev.date + 'T00:00:00');
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const locationHtml = ev.location
                ? `<div class="calendar-event-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${ev.location}
                   </div>`
                : '';
            return `<div class="calendar-event-card" data-date="${ev.date}" style="border-left-color:${CATEGORY_COLORS[ev.category]?.bg || 'var(--ocean)'}">
                <div class="calendar-event-date">${dateStr}</div>
                <div class="calendar-event-title">${ev.title}</div>
                ${ev.time ? `<div class="calendar-event-time">${ev.time}</div>` : ''}
                ${ev.description ? `<div class="calendar-event-desc">${ev.description}</div>` : ''}
                ${locationHtml}
            </div>`;
        }).join('');

        listContainer.querySelectorAll('.calendar-event-card').forEach(card => {
            card.addEventListener('click', () => {
                const ev = events.find(e => e.date === card.dataset.date && e.title === card.querySelector('.calendar-event-title').textContent);
                if (ev) openEventDrawer(ev);
            });
        });
    }

    // - Open event in drawer -
    function openEventDrawer(ev) {
        const date = new Date(ev.date + 'T00:00:00');
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        const drawerContent = document.getElementById('drawerContent');
        drawerContent.innerHTML = `
            <div class="drawer-category" style="background:${CATEGORY_COLORS[ev.category]?.bg || 'var(--ocean)'}20; color:${CATEGORY_COLORS[ev.category]?.bg || 'var(--ocean)'}">
                <span class="dot" style="background:${CATEGORY_COLORS[ev.category]?.bg || 'var(--ocean)'}"></span>${ev.category || 'Event'}
            </div>
            <h2 class="drawer-title">${ev.title}</h2>
            <div class="drawer-address-row">
                <p class="drawer-address">${dateStr}${ev.time ? ' · ' + ev.time : ''}</p>
            </div>
            ${ev.description ? `<p class="drawer-desc">${ev.description}</p>` : ''}
            ${ev.location ? `<div class="drawer-actions">
                <span style="font-size:13px;color:#7A8599;display:flex;align-items:center;gap:6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${ev.location}
                </span>
            </div>` : ''}
        `;

        document.getElementById('drawer').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('visible');
    }

    // - Open list of events for a day in drawer - 
    function openEventListDrawer(date, dayEvents) {
        const d = new Date(date + 'T00:00:00');
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

        const drawerContent = document.getElementById('drawerContent');
        drawerContent.innerHTML = `
            <h2 class="drawer-title">${dateStr}</h2>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
                ${dayEvents.map(ev => `
                    <div class="calendar-event-card" style="border-left-color:${CATEGORY_COLORS[ev.category]?.bg || 'var(--ocean)'}; cursor:pointer;" onclick='document.getElementById("drawer").classList.remove("open"); document.getElementById("drawerOverlay").classList.remove("visible"); setTimeout(function(){ window._openCalendarEvent("${ev.date}", "${ev.title.replace(/"/g, '\\"')}"); }, 400);'>
                        <div class="calendar-event-title">${ev.title}</div>
                        ${ev.time ? `<div class="calendar-event-time">${ev.time}</div>` : ''}
                        ${ev.description ? `<div class="calendar-event-desc">${ev.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('drawer').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('visible');
    }

    // Expose for inline onclick in multi-event drawer
    window._openCalendarEvent = function (date, title) {
        const ev = events.find(e => e.date === date && e.title === title);
        if (ev) openEventDrawer(ev);
    };

    // - View Toggle (Grid/List) -
    function initViewToggle() {
        document.querySelectorAll('.calendar-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.calendar-view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.dataset.view;

                document.querySelector('.calendar-view-toggle').classList.toggle('list-active', currentView === 'list');

                const grid = document.getElementById('calGrid');
                const list = document.getElementById('calList');

                if (currentView === 'grid') {
                    grid.style.display = '';
                    list.style.display = 'none';
                    renderGrid();
                } else {
                    grid.style.display = 'none';
                    list.style.display = '';
                    renderList();
                }
            });
        });
    }

    // - Month Navigation -
    function initNav() {
        let navLocked = false;

        function navigate(direction) {
            if (navLocked) return;
            navLocked = true;

            currentMonth += direction;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderGrid();

            setTimeout(() => { navLocked = false; }, 200);
        }

        document.getElementById('calPrev').addEventListener('click', () => navigate(-1));
        document.getElementById('calNext').addEventListener('click', () => navigate(1));
    }

    // - Calendar Button Toggle -
    function initCalendarToggle() {
        const btn = document.getElementById('viewCalendarBtn');
        const panel = document.getElementById('calendarPanel');

        btn.addEventListener('click', () => {
            const isActive = document.body.classList.contains('calendar-mode');

            if (isActive) {
                document.body.classList.remove('calendar-mode');
                panel.setAttribute('aria-hidden', 'true');
                btn.classList.remove('calendar-active');
            } else {
                // Exit list mode if active
                document.body.classList.remove('list-mode');
                document.getElementById('listPanel').setAttribute('aria-hidden', 'true');
                const listBtn = document.getElementById('viewToggleBtn');
                const listLabel = listBtn.querySelector('.view-toggle-label');
                if (listLabel) listLabel.textContent = 'List';
                isListView = false;

                document.body.classList.add('calendar-mode');
                panel.setAttribute('aria-hidden', 'false');
                btn.classList.add('calendar-active');

                if (currentView === 'grid') renderGrid();
                else renderList();

                panel.scrollTop = 0;
            }
        });
    }

    // - Init -
    async function initCalendar() {
        await loadEvents();
        initNav();
        initViewToggle();
        initCalendarToggle();
        renderGrid();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCalendar);
    } else {
        initCalendar();
    }
})();