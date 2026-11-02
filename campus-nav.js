/* ============================================================
   Campus Navigator v2 — JavaScript
   campus-nav.js

   Features:
   - Floor-by-floor navigation with colour coding
   - Live search across all floors and spaces
   - Professional Lucide icons for every space
   - Lift & stairwell markers (which side of the building)
   - Access badges: Walk-in vs Appointment required
   - Hours of operation for key services
   - Emergency info: fire assembly point + first aid cabinet
   - QR codes that deep-link to a specific floor
   - Colour-coded sticker guide (printable)
   - URL deep-linking: campus-nav.html?floor=7
   ============================================================ */


/* ─── CONFIGURATION ──────────────────────────────────────────
   Set BASE_URL to your hosted address so QR codes work when
   scanned across the network. Leave null to auto-detect.
   Example: const BASE_URL = 'http://192.168.122.10/campus-nav.html';
   ──────────────────────────────────────────────────────────── */
const BASE_URL = null;


/* ─── FLOOR DATA ─────────────────────────────────────────────
   Each space object:
     icon   — Lucide icon name  (https://lucide.dev/icons)
     n      — display name
     access — 'walk-in' | 'appointment' | null (no badge shown)
     hours  — opening hours string, or null
   ──────────────────────────────────────────────────────────── */
const FLOORS = [
  {
    id: 9,
    label: '9th Floor',
    tag: 'Faculty & Offices',
    color: '#D97706',
    tip: 'Visit lecturer and HOA offices here — confirm your room assignment before heading to a lower-floor lecture.',
    lift: {
      side: 'East wing',
      note: 'Doors open facing the main corridor. Turn right for HOA & PM offices.'
    },
    stairwell: {
      side: 'West wing',
      note: 'Red emergency door beside the HOA office. Emergency use only.'
    },
    emergency: {
      assembly: 'Ground floor — Exit A, East Street pavement (muster point marked in yellow)',
      firstAid: 'Corridor outside HOA Office — First Aid Cabinet F9'
    },
    spaces: [
      { icon: 'monitor',        n: 'Lecture Rooms',     access: 'walk-in',     hours: null },
      { icon: 'user',           n: 'Lecturer Offices',  access: 'appointment', hours: 'Mon–Fri  08:00–16:00' },
      { icon: 'laptop',         n: 'PC Office',         access: 'appointment', hours: 'Mon–Fri  08:00–15:30' },
      { icon: 'clipboard',      n: 'PM Office',         access: 'appointment', hours: 'Mon–Fri  09:00–16:00' },
      { icon: 'briefcase',      n: 'HOA Office',        access: 'appointment', hours: 'Mon–Fri  08:00–16:00' }
    ]
  },
  {
    id: 8,
    label: '8th Floor',
    tag: 'Online Learning',
    color: '#E11D48',
    tip: 'The dedicated Online Lecture Room has a stable wired connection — request a cable from the technician on arrival.',
    lift: {
      side: 'East wing',
      note: 'Doors open facing the lecture corridor. The Online Lecture Room is straight ahead.'
    },
    stairwell: {
      side: 'West wing',
      note: 'Next to the fire hose reel. Door is alarmed — emergency use only.'
    },
    emergency: {
      assembly: 'Ground floor — Exit A, East Street pavement',
      firstAid: 'Near stairwell door — First Aid Cabinet F8'
    },
    spaces: [
      { icon: 'video',    n: 'Online Lecture Room', access: 'walk-in', hours: 'Mon–Fri  07:30–18:00' },
      { icon: 'monitor',  n: 'Lecture Rooms',        access: 'walk-in', hours: null }
    ]
  },
  {
    id: 7,
    label: '7th Floor',
    tag: 'Student Life',
    color: '#16A34A',
    tip: 'Cafeteria closes at 15:00 — grab lunch before your afternoon lecture. The SRC office has a lost property desk too.',
    lift: {
      side: 'East wing',
      note: 'Doors open near the Cafeteria entrance. Follow the green ⬤ floor markers.'
    },
    stairwell: {
      side: 'West wing',
      note: 'Opposite the Recreational Room entrance. Connects all floors.'
    },
    emergency: {
      assembly: 'Ground floor — Exit B, West Street pavement',
      firstAid: 'SRC Office entrance — First Aid Cabinet F7'
    },
    spaces: [
      { icon: 'gamepad-2',    n: 'Recreational Room', access: 'walk-in', hours: 'Mon–Fri  08:00–18:00' },
      { icon: 'utensils',     n: 'Cafeteria',          access: 'walk-in', hours: 'Mon–Fri  07:30–15:00' },
      { icon: 'users',        n: 'SRC Office',          access: 'walk-in', hours: 'Mon–Fri  09:00–16:00' },
      { icon: 'monitor',      n: 'Lecture Rooms',       access: 'walk-in', hours: null }
    ]
  },
  {
    id: 6,
    label: '6th Floor',
    tag: 'Tech & Gaming',
    color: '#2563EB',
    tip: 'Log a ticket at the IT helpdesk for hardware/software issues. The Gaming Room is bookable in 30-min slots via the SRC.',
    lift: {
      side: 'East wing',
      note: 'Doors open directly facing the IT Department helpdesk reception.'
    },
    stairwell: {
      side: 'West wing',
      note: 'Beside the server room (grey door, staff only). Stairwell is the next door along.'
    },
    emergency: {
      assembly: 'Ground floor — Exit A, East Street pavement',
      firstAid: 'IT Department reception counter — First Aid Cabinet F6'
    },
    spaces: [
      { icon: 'cpu',       n: 'IT Department', access: 'walk-in', hours: 'Mon–Fri  08:00–17:00' },
      { icon: 'gamepad-2', n: 'Gaming Room',   access: 'walk-in', hours: 'Mon–Fri  10:00–17:00' },
      { icon: 'monitor',   n: 'Lecture Rooms', access: 'walk-in', hours: null }
    ]
  },
  {
    id: 5,
    label: '5th Floor',
    tag: 'Administration',
    color: '#7C3AED',
    tip: 'All admin services are on this floor. Finance closes at 15:30 — arrive early. The Library has the longest hours: open until 18:00 weekdays.',
    lift: {
      side: 'East wing',
      note: 'Doors open directly to Reception. Follow the purple ⬤ floor markers to your service.'
    },
    stairwell: {
      side: 'West wing',
      note: 'Next to the Finance Department. Door is signposted.'
    },
    emergency: {
      assembly: 'Ground floor — Exit A, East Street pavement',
      firstAid: 'Reception desk — First Aid Cabinet F5'
    },
    spaces: [
      { icon: 'settings',      n: 'Operations',          access: 'walk-in',     hours: 'Mon–Fri  08:00–16:30' },
      { icon: 'credit-card',   n: 'Finance Department',  access: 'walk-in',     hours: 'Mon–Fri  08:30–15:30' },
      { icon: 'file-text',     n: 'Assessment Office',   access: 'appointment', hours: 'Mon–Fri  08:00–16:00' },
      { icon: 'compass',       n: 'Career Services',     access: 'walk-in',     hours: 'Mon–Fri  09:00–16:00' },
      { icon: 'book-open',     n: 'Library',             access: 'walk-in',     hours: 'Mon–Fri  07:30–18:00 · Sat  09:00–13:00' },
      { icon: 'message-square',n: 'Reception',           access: 'walk-in',     hours: 'Mon–Fri  07:30–17:00' },
      { icon: 'graduation-cap',n: "Principal's Office",  access: 'appointment', hours: 'Mon–Fri  09:00–15:00' },
      { icon: 'user',          n: 'Lecturer Rooms',      access: 'appointment', hours: 'Mon–Fri  08:00–16:00' }
    ]
  },
  {
    id: '2–4',
    label: 'Floors 2–4',
    tag: 'Parking',
    color: '#475569',
    tip: 'Parking entrance is on Level 2 from street level. Use the East wing lift to reach the campus floors above.',
    lift: {
      side: 'East wing',
      note: 'Lift is accessible from Level 2. Press B2 at street level or use the ramp.'
    },
    stairwell: {
      side: 'West wing',
      note: 'Stairwell connects all three parking levels to the campus floors above.'
    },
    emergency: {
      assembly: 'Ground floor — Exit A, East Street pavement',
      firstAid: 'Level 2 security booth (manned 06:00–22:00)'
    },
    spaces: [
      { icon: 'car', n: 'Parking (3 Levels)', access: 'walk-in', hours: 'Mon–Sun  06:00–22:00' }
    ]
  }
];


/* ─── STATE ──────────────────────────────────────────────── */
let activeFloor = FLOORS[0];
let searchQuery  = '';


/* ─── URL DEEP-LINKING ───────────────────────────────────── */
/**
 * Reads the ?floor= query parameter on page load.
 * Allows QR codes to open a specific floor directly.
 */
function getFloorFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('floor');
    if (!id) return null;
    return FLOORS.find(f => String(f.id) === id) || null;
  } catch (e) {
    return null;
  }
}


/* ─── HELPERS ────────────────────────────────────────────── */
/**
 * Returns true if the floor or any of its spaces match the query.
 */
function matchesSearch(floor, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    floor.label.toLowerCase().includes(q) ||
    floor.tag.toLowerCase().includes(q)   ||
    floor.spaces.some(s => s.n.toLowerCase().includes(q))
  );
}

/**
 * Returns a Lucide <i> tag string for use inside innerHTML.
 * After render(), lucide.createIcons() converts these to real SVGs.
 */
function icon(name, cls = '') {
  return `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ''}></i>`;
}


/* ─── CARD BUILDER ───────────────────────────────────────── */
/**
 * Builds the full HTML string for one floor card, including:
 * - header, nav strip, spaces grid, emergency strip, QR section
 */
function buildFloorCard(floor, query) {
  const hl = query ? query.toLowerCase() : null;

  /* ── Spaces grid ── */
  const spacesHTML = floor.spaces.map(space => {
    const isMatch = hl && space.n.toLowerCase().includes(hl);

    const accessBadge = space.access
      ? `<span class="access-badge ${space.access === 'appointment' ? 'appointment' : 'walkin'}">
           ${icon(space.access === 'appointment' ? 'calendar' : 'check-circle')}
           ${space.access === 'appointment' ? 'Appointment' : 'Walk-in'}
         </span>`
      : '';

    const hoursHTML = space.hours
      ? `<div class="space-hours">${icon('clock')} ${space.hours}</div>`
      : '';

    return `
      <div class="space-tile${isMatch ? ' lit' : ''}">
        <div class="space-icon-wrap">${icon(space.icon)}</div>
        <div class="space-name">${space.n}</div>
        ${accessBadge}
        ${hoursHTML}
      </div>`;
  }).join('');

  /* ── Navigation strip ── */
  const navStripHTML = `
    <div class="nav-strip">
      <div class="nav-item">
        <div class="nav-item-icon lift">${icon('arrow-up-down')}</div>
        <div class="nav-item-body">
          <div class="nav-item-label">
            ${icon('chevron-right')} Lift / Elevator — ${floor.lift.side}
          </div>
          <div class="nav-item-desc">${floor.lift.note}</div>
        </div>
      </div>
      <div class="nav-divider"></div>
      <div class="nav-item">
        <div class="nav-item-icon stairs">${icon('trending-up')}</div>
        <div class="nav-item-body">
          <div class="nav-item-label">
            ${icon('chevron-right')} Stairwell — ${floor.stairwell.side}
          </div>
          <div class="nav-item-desc">${floor.stairwell.note}</div>
        </div>
      </div>
    </div>`;

  /* ── Spaces section ── */
  const spacesSectionHTML = `
    <div class="section-row">
      ${icon('layout-grid')}
      <span class="section-row-label">Spaces &amp; Hours</span>
    </div>
    <div class="spaces-grid">${spacesHTML}</div>`;

  /* ── Emergency strip ── */
  const emergencyHTML = `
    <div class="emergency-strip">
      <div class="emergency-heading">
        ${icon('alert-triangle')} Emergency Information
      </div>
      <div class="emergency-items">
        <div class="emergency-item">
          <div class="emergency-item-icon">${icon('map-pin')}</div>
          <div>
            <div class="emergency-item-label">Fire Assembly Point</div>
            <div class="emergency-item-desc">${floor.emergency.assembly}</div>
          </div>
        </div>
        <div class="emergency-item">
          <div class="emergency-item-icon">${icon('heart')}</div>
          <div>
            <div class="emergency-item-label">First Aid</div>
            <div class="emergency-item-desc">${floor.emergency.firstAid}</div>
          </div>
        </div>
      </div>
    </div>`;

  /* ── QR code section ── */
  const qrHTML = `
    <div class="qr-section">
      <div class="qr-info">
        <div class="qr-heading">${icon('qr-code')} Floor QR Code</div>
        <div class="qr-desc">
          Stick this QR code on the lift door of ${floor.label}.<br>
          Students scan it to jump straight to this floor's information.
        </div>
        <div class="qr-url" id="qr-url-${floor.id}"></div>
      </div>
      <div class="qr-code-box" data-qr="${floor.id}"></div>
    </div>`;

  /* ── Tip ── */
  const tipHTML = `
    <div class="card-tip">
      ${icon('lightbulb')} <strong>Tip:</strong> ${floor.tip}
    </div>`;

  /* ── Bathroom badge in header ── */
  const bathroomHTML = `
    <span class="bathroom-badge">
      ${icon('users')} Male · Female · Gender-Neutral bathrooms on this floor
    </span>`;

  return `
    <div class="floor-card">
      <div class="card-top" style="border-top: 3px solid ${floor.color}">
        <span class="floor-badge" style="background: ${floor.color}">${floor.label}</span>
        <div class="card-title">${floor.tag}</div>
        <div class="card-meta-row">
          <span class="card-count">${floor.spaces.length} space${floor.spaces.length !== 1 ? 's' : ''} on this floor</span>
          ${bathroomHTML}
        </div>
      </div>
      ${navStripHTML}
      ${spacesSectionHTML}
      ${emergencyHTML}
      ${qrHTML}
      ${tipHTML}
    </div>`;
}


/* ─── QR CODE GENERATOR ──────────────────────────────────── */
/**
 * Finds all [data-qr] elements after a render and fills each
 * with a QRCode canvas pointing to ?floor=<id>.
 */
function generateQRCodes() {
  if (typeof QRCode === 'undefined') return; // CDN unavailable

  const pageBase = BASE_URL
    || (window.location.origin + window.location.pathname);

  document.querySelectorAll('[data-qr]').forEach(el => {
    const floorId = el.dataset.qr;
    const url     = `${pageBase}?floor=${encodeURIComponent(floorId)}`;

    /* Show the URL below the code */
    const urlEl = document.getElementById(`qr-url-${floorId}`);
    if (urlEl) urlEl.textContent = url;

    /* Generate the QR canvas */
    el.innerHTML = ''; // clear any previous render
    try {
      new QRCode(el, {
        text:          url,
        width:         108,
        height:        108,
        colorDark:     '#0C1117',
        colorLight:    '#FFFFFF',
        correctLevel:  QRCode.CorrectLevel.M
      });
    } catch (err) {
      el.innerHTML = `<span style="font-size:0.65rem;color:#8B949E;padding:8px;display:block">
        QR unavailable — set BASE_URL in campus-nav.js
      </span>`;
    }
  });
}


/* ─── PRINT STICKERS ─────────────────────────────────────── */
/**
 * Opens a new browser window formatted for printing colour-coded
 * floor stickers to place on lift doors and signage.
 */
function printStickers() {
  const campusFloors = FLOORS.filter(f => f.id !== '2–4');

  const stickersHTML = campusFloors.map(f => `
    <div class="sticker">
      <div class="sticker-inner" style="background:${f.color}">
        <div class="floor-num">${f.id}</div>
        <div class="floor-tag">${f.tag}</div>
      </div>
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Campus Floor Stickers — Rosebank Institute</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      padding: 24px;
      background: #fff;
    }
    h1 {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    p {
      font-size: 12px;
      color: #555;
      margin-bottom: 24px;
    }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .sticker {
      page-break-inside: avoid;
    }
    .sticker-inner {
      width: 100px;
      height: 100px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 8px;
    }
    .floor-num {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
    }
    .floor-tag {
      font-size: 9px;
      font-weight: 600;
      margin-top: 4px;
      line-height: 1.3;
      opacity: 0.92;
    }
    @media print {
      @page { margin: 12mm; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>Campus Floor Colour Guide</h1>
  <p>Print, cut out and laminate these stickers. Place one on each lift door and at stairwell entrances.</p>
  <div class="grid">${stickersHTML}</div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=680,height=720');
  if (!win) {
    alert('Pop-up blocked — please allow pop-ups for this page to print stickers.');
    return;
  }
  win.document.write(html);
  win.document.close();
}


/* ─── STICKER GUIDE SIDEBAR ──────────────────────────────── */
/**
 * Populates the colour guide chips in the sidebar.
 */
function buildStickerChips() {
  const el = document.getElementById('stickerChips');
  if (!el) return;
  el.innerHTML = FLOORS.map(f => `
    <div class="sticker-chip" onclick="selectFloor('${f.id}')" title="${f.tag}">
      <div class="sticker-swatch" style="background:${f.color}">${f.id}</div>
      <div class="sticker-info">
        <div class="sticker-floor-num">${f.label}</div>
        <div class="sticker-tag">${f.tag}</div>
      </div>
    </div>`).join('');
}

/**
 * Selects a floor by ID (used by sticker chip clicks).
 */
function selectFloor(id) {
  const floor = FLOORS.find(f => String(f.id) === String(id));
  if (!floor) return;
  activeFloor  = floor;
  searchQuery  = '';
  document.getElementById('searchInput').value = '';
  render();
  // Scroll detail panel into view on mobile
  document.getElementById('detailContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ─── MAIN RENDER ────────────────────────────────────────── */
/**
 * Full render pass — rebuilds sidebar nav + detail panel,
 * then initialises Lucide icons and QR codes.
 */
function render() {
  const navEl     = document.getElementById('buildingNav');
  const noticeEl  = document.getElementById('searchNotice');
  const contentEl = document.getElementById('detailContent');

  const hasQuery     = searchQuery.length > 0;
  const matchedFloors = hasQuery
    ? FLOORS.filter(f => matchesSearch(f, searchQuery))
    : null;

  /* ── Sidebar nav ── */
  navEl.innerHTML = FLOORS.map(floor => {
    const isActive = !hasQuery && floor.id === activeFloor.id;
    const isMatch  = !hasQuery || matchesSearch(floor, searchQuery);
    const borderCol = isActive || (hasQuery && isMatch) ? floor.color : 'transparent';

    return `
      <button
        class="floor-btn${isActive ? ' active' : ''}${!isMatch ? ' dimmed' : ''}"
        style="border-left-color: ${borderCol}"
        data-id="${floor.id}"
      >
        <div class="floor-num" style="background: ${floor.color}">${floor.id}</div>
        <div class="floor-meta">
          <div class="floor-name">${floor.label}</div>
          <div class="floor-subtag">${floor.tag}</div>
        </div>
      </button>`;
  }).join('');

  /* Click listeners on newly rendered buttons */
  navEl.querySelectorAll('.floor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFloor = FLOORS.find(f => String(f.id) === btn.dataset.id) || activeFloor;
      searchQuery = '';
      document.getElementById('searchInput').value = '';
      render();
    });
  });

  /* ── Detail content ── */
  if (hasQuery) {
    if (matchedFloors.length === 0) {
      noticeEl.className  = 'search-notice visible';
      noticeEl.textContent = `No results for "${searchQuery}" — try a different term`;
      contentEl.innerHTML = `<div class="no-results">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <span>Nothing found</span>
      </div>`;
    } else {
      const count = matchedFloors.length;
      noticeEl.className  = 'search-notice visible';
      noticeEl.textContent = `"${searchQuery}" found on ${count} floor${count > 1 ? 's' : ''}`;
      contentEl.innerHTML = matchedFloors.map(f => buildFloorCard(f, searchQuery)).join('');
    }
  } else {
    noticeEl.className = 'search-notice'; // hidden
    contentEl.innerHTML = buildFloorCard(activeFloor, '');
  }

  /* ── Post-render: icons + QR codes ── */
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  generateQRCodes();
}


/* ─── EVENT LISTENERS ────────────────────────────────────── */
document.getElementById('searchInput').addEventListener('input', function (e) {
  searchQuery = e.target.value.trim();
  render();
});


/* ─── INIT ───────────────────────────────────────────────── */
(function init() {
  /* Check for ?floor= deep-link */
  const urlFloor = getFloorFromURL();
  if (urlFloor) activeFloor = urlFloor;

  /* Build sidebar sticker chips */
  buildStickerChips();

  /* First render */
  render();
})();
