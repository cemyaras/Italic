/**
 * app.js – Travel Info Site
 * Fetches data.json and renders the appropriate page (index or city).
 */

// ─── Data Fetching ─────────────────────────────────────────────
async function fetchData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error(`Failed to load data: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Data fetch error:', error);
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4" style="background:#0A1128">
        <div class="rounded-2xl shadow-lg p-10 text-center max-w-md" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px)">
          <p class="text-4xl mb-4">😕</p>
          <h2 class="text-xl font-bold text-white mb-2">Data Unavailable</h2>
          <p class="text-slate-400 mb-6">Travel information is currently unavailable. Please try again later.</p>
          <a href="index.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition">Back to Home</a>
        </div>
      </div>`;
    return null;
  }
}

// ─── Utilities ─────────────────────────────────────────────────
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ─── Countdown Timer ───────────────────────────────────────────
function startCountdown(targetDateStr) {
  const targetDate = new Date(targetDateStr).getTime();
  const daysEl = document.getElementById('countdown-days');
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');
  const labelEl = document.getElementById('countdown-label');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function update() {
    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      if (labelEl) labelEl.textContent = '🎉 The Journey Has Begun!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

// ─── Copy to Clipboard ────────────────────────────────────────
function copyToClipboard(text, buttonEl) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonEl.textContent;
    buttonEl.textContent = '✓ Copied';
    buttonEl.classList.add('copied');
    setTimeout(() => {
      buttonEl.textContent = originalText;
      buttonEl.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    const originalText = buttonEl.textContent;
    buttonEl.textContent = '✓ Copied';
    buttonEl.classList.add('copied');
    setTimeout(() => {
      buttonEl.textContent = originalText;
      buttonEl.classList.remove('copied');
    }, 2000);
  });
}

// ─── Flight Card Builder ───────────────────────────────────────
function buildFlightCard(direction, colorFrom, colorTo, badgeColor) {
  const layoverMs = direction.legs.length > 1
    ? calculateLayover(direction.legs[0].arrival, direction.legs[1].departure)
    : null;

  return `
    <div class="glass-card rounded-2xl shadow-md overflow-hidden fade-in" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px)">
      <div class="bg-gradient-to-r ${colorFrom} ${colorTo} px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">✈️</span>
            <div>
              <p class="text-white/80 text-xs font-medium uppercase tracking-wider">Flight</p>
              <p class="text-white font-bold text-lg">${direction.label}</p>
            </div>
          </div>
          ${direction.legs.length > 1 ? `
          <div class="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p class="text-white text-xs font-medium">1 Layover</p>
          </div>` : ''}
        </div>
      </div>
      <div class="p-4 space-y-3">
        ${direction.legs.map((leg, i) => `
          ${i > 0 && layoverMs ? `
          <div class="flex items-center gap-3 py-2 border-y border-dashed border-white/10">
            <div class="flex-shrink-0 w-7 h-7 bg-amber-500/10 rounded-full flex items-center justify-center">
              <span class="text-sm">⏳</span>
            </div>
            <div>
              <p class="text-xs text-amber-400 font-semibold uppercase tracking-wide">Layover in Sofia</p>
              <p class="text-sm font-bold text-white">${layoverMs}</p>
            </div>
          </div>` : ''}
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-0.5">From</p>
              <p class="text-sm font-bold text-white">${leg.from}</p>
              <p class="text-base font-bold ${badgeColor} tabular-nums">${leg.departure}</p>
            </div>
            <div class="flex flex-col items-center gap-1 px-1">
              <div class="w-6 border-t-2 border-dashed border-white/10"></div>
              <span class="text-xs text-slate-500">${leg.icon}</span>
              <div class="w-6 border-t-2 border-dashed border-white/10"></div>
            </div>
            <div class="flex-1 text-right">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-0.5">To</p>
              <p class="text-sm font-bold text-white">${leg.to}</p>
              <p class="text-base font-bold ${badgeColor} tabular-nums">${leg.arrival}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 pt-0.5">
            ${leg.airline ? `<span class="text-xs font-semibold text-amber-300 bg-amber-500/10 rounded-md px-2 py-0.5">${leg.airline}</span>` : ''}
            ${leg.flightNo ? `<span class="text-xs font-mono text-slate-300 bg-white/5 rounded-md px-2 py-0.5">${leg.flightNo}</span>` : ''}
            ${leg.pnr ? `<span class="text-xs font-mono text-blue-300 bg-blue-500/10 rounded-md px-2 py-0.5">PNR: ${leg.pnr}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function calculateLayover(arrivalTime, departureTime) {
  const [aH, aM] = arrivalTime.split(':').map(Number);
  const [dH, dM] = departureTime.split(':').map(Number);
  const diffMinutes = (dH * 60 + dM) - (aH * 60 + aM);
  if (diffMinutes <= 0) return null;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}h ${mins}m`;
}

function renderFlights(flights) {
  const container = document.getElementById('flights-container');
  if (!container || !flights) return;

  container.innerHTML =
    buildFlightCard(flights.outbound, 'from-blue-600', 'to-blue-700', 'text-blue-400') +
    buildFlightCard(flights.return, 'from-amber-600', 'to-amber-700', 'text-amber-400');
}

// ─── Train Card Builder ────────────────────────────────────────
function buildTrainCard(train) {
  return `
    <div class="glass-card rounded-2xl shadow-md overflow-hidden fade-in" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px)">
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${train.icon}</span>
            <div>
              <p class="text-white/80 text-xs font-medium uppercase tracking-wider">Train</p>
              <p class="text-white font-bold text-base">${train.label}</p>
            </div>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
            <p class="text-white text-xs font-medium">${train.company}</p>
          </div>
        </div>
      </div>
      <div class="p-4 space-y-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-0.5">From</p>
            <p class="text-sm font-bold text-white">${train.from}</p>
            <p class="text-base font-bold text-purple-400 tabular-nums">${train.departure}</p>
          </div>
          <div class="flex flex-col items-center gap-1 px-1">
            <div class="w-6 border-t-2 border-solid border-purple-500/30"></div>
            <span class="text-xs text-slate-500">${train.icon}</span>
            <div class="w-6 border-t-2 border-solid border-purple-500/30"></div>
          </div>
          <div class="flex-1 text-right">
            <p class="text-xs text-slate-400 uppercase tracking-wider mb-0.5">To</p>
            <p class="text-sm font-bold text-white">${train.to}</p>
            <p class="text-base font-bold text-purple-400 tabular-nums">${train.arrival}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 pt-0.5">
          <span class="text-xs font-semibold text-purple-300 bg-purple-500/10 rounded-md px-2 py-0.5">${train.company}</span>
          <span class="text-xs font-mono text-slate-300 bg-white/5 rounded-md px-2 py-0.5">${train.trainNo}</span>
          ${train.pnr ? `<span class="text-xs font-mono text-blue-300 bg-blue-500/10 rounded-md px-2 py-0.5">PNR: ${train.pnr}</span>` : ''}
          <span class="text-xs text-slate-400 bg-white/5 rounded-md px-2 py-0.5">${train.date}</span>
        </div>
      </div>
    </div>
  `;
}

function renderTrains(trains) {
  const container = document.getElementById('trains-container');
  if (!container || !trains || trains.length === 0) return;

  container.innerHTML = trains.map(train => buildTrainCard(train)).join('');
}

// ─── Route Map (Leaflet) ───────────────────────────────────────
function renderRouteMap() {
  const mapEl = document.getElementById('route-map');
  if (!mapEl || typeof L === 'undefined') return;

  // City coordinates
  const cities = {
    istanbul: { lat: 40.8986, lng: 29.3091, label: 'Istanbul', sub: 'SAW', emoji: '🇹🇷' },
    sofia: { lat: 42.6975, lng: 23.3242, label: 'Sofia', sub: 'SOF', emoji: '🇧🇬' },
    rome: { lat: 41.8003, lng: 12.2389, label: 'Rome', sub: 'FCO', emoji: '🏛️' },
    florence: { lat: 43.7696, lng: 11.2558, label: 'Florence', sub: 'SMN', emoji: '🌸' },
    venice: { lat: 45.6484, lng: 12.1944, label: 'Venice', sub: 'TSF', emoji: '🎭' },
  };

  // Init the map
  const map = L.map('route-map', {
    center: [42.5, 20],
    zoom: 5,
    zoomControl: true,
    attributionControl: false,
    scrollWheelZoom: false,
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
  }).addTo(map);

  // Helper: create curved points between two coords
  function curvedPoints(from, to, offset) {
    const midLat = (from.lat + to.lat) / 2 + (offset || 0);
    const midLng = (from.lng + to.lng) / 2;
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const lat = (1 - t) * (1 - t) * from.lat + 2 * (1 - t) * t * midLat + t * t * to.lat;
      const lng = (1 - t) * (1 - t) * from.lng + 2 * (1 - t) * t * midLng + t * t * to.lng;
      points.push([lat, lng]);
    }
    return points;
  }

  // ── Outbound flights (dashed blue) ──
  const outbound1 = curvedPoints(cities.istanbul, cities.sofia, 1.5);
  const outbound2 = curvedPoints(cities.sofia, cities.rome, 1.5);

  L.polyline(outbound1, {
    color: '#60a5fa', weight: 3, dashArray: '10, 6', opacity: 0.85,
  }).addTo(map);
  L.polyline(outbound2, {
    color: '#60a5fa', weight: 3, dashArray: '10, 6', opacity: 0.85,
  }).addTo(map);

  // ── Return flights (dashed amber) ──
  const return1 = curvedPoints(cities.venice, cities.sofia, 1.2);
  const return2 = curvedPoints(cities.sofia, cities.istanbul, -1.2);

  L.polyline(return1, {
    color: '#f59e0b', weight: 3, dashArray: '10, 6', opacity: 0.85,
  }).addTo(map);
  L.polyline(return2, {
    color: '#f59e0b', weight: 3, dashArray: '10, 6', opacity: 0.85,
  }).addTo(map);

  // ── Train routes (solid purple) ──
  L.polyline(
    [[cities.rome.lat, cities.rome.lng], [cities.florence.lat, cities.florence.lng]],
    { color: '#a78bfa', weight: 3, opacity: 0.9 }
  ).addTo(map);

  L.polyline(
    [[cities.florence.lat, cities.florence.lng], [cities.venice.lat, cities.venice.lng]],
    { color: '#a78bfa', weight: 3, opacity: 0.9 }
  ).addTo(map);

  // ── City markers ──
  const markerColors = {
    istanbul: '#3b82f6',
    sofia: '#f59e0b',
    rome: '#3b82f6',
    florence: '#a78bfa',
    venice: '#f59e0b',
  };

  const markerInfo = {
    istanbul: '✈️ PC271 → Sofia (May 22, 11:00)<br>✈️ PC272 ← Sofia (May 31, 20:00)',
    sofia: '🔄 Layover hub<br>Outbound: 12:20 – 18:55<br>Return: 10:45 – 18:45',
    rome: '✈️ Wizz Air ← Sofia (May 22, 20:00)<br>🚄 Train → Florence (May 26)',
    florence: '🚄 Roma → Firenze (May 26)<br>🚄 Firenze → Venezia (May 29)',
    venice: '✈️ Ryanair FR6428 → Sofia (May 31, 08:00)',
  };

  Object.keys(cities).forEach(key => {
    const c = cities[key];
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: ${markerColors[key]};
        width: 32px; height: 32px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        box-shadow: 0 0 12px ${markerColors[key]}80;
      ">${c.emoji}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    L.marker([c.lat, c.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif; min-width:160px;">
          <strong style="font-size:14px;">${c.label}</strong>
          <span style="color:#999; font-size:11px; margin-left:4px;">${c.sub}</span>
          <hr style="border-color:#333; margin:6px 0;">
          <div style="font-size:11px; color:#ccc; line-height:1.6;">${markerInfo[key]}</div>
        </div>
      `, {
        className: 'dark-popup',
      });

    // City label on map
    L.marker([c.lat, c.lng], {
      icon: L.divIcon({
        className: 'city-label',
        html: `<div style="
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #e2e8f0;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          white-space: nowrap;
          text-align: center;
          pointer-events: none;
        ">${c.label}<br><span style="font-size:9px; color:#94a3b8; font-weight:400;">${c.sub}</span></div>`,
        iconSize: [80, 30],
        iconAnchor: [40, -12],
      }),
    }).addTo(map);
  });

  // Fit bounds
  const allCoords = Object.values(cities).map(c => [c.lat, c.lng]);
  map.fitBounds(allCoords, { padding: [40, 40] });
}

// ─── Highlight Section Builders ────────────────────────────────────
function buildHighlightCard(item, delayIndex) {
  const searchQuery = encodeURIComponent(item.name + ' ' + (item.city !== 'All Cities' ? item.city : 'Italy') + ' travel');
  return `
    <a href="https://www.google.com/search?q=${searchQuery}" target="_blank" rel="noopener noreferrer" class="card-hover glass-card rounded-2xl shadow-md overflow-hidden slide-up group block" style="animation-delay: ${delayIndex * 0.1}s; background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px)">
      <div class="relative h-48 overflow-hidden">
        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div class="absolute top-3 left-3 bg-black/50 backdrop-blur-md rounded-lg px-2 py-1 border border-white/10">
          <span class="text-xs font-semibold text-white tracking-widest uppercase">${item.city}</span>
        </div>
        <div class="absolute bottom-3 left-4 right-4">
          <h3 class="text-white font-bold text-lg leading-tight shadow-sm">${item.name}</h3>
        </div>
      </div>
      <div class="p-4">
        <p class="text-sm text-slate-300 leading-relaxed">${item.description}</p>
      </div>
    </a>
  `;
}

function buildRecommendationCard(item, delayIndex) {
  return `
    <div class="flex gap-4 p-5 rounded-2xl shadow-sm slide-up" style="animation-delay: ${delayIndex * 0.15}s; background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05)">
      <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-2xl">
        ${item.icon}
      </div>
      <div>
        <h3 class="text-white font-bold text-lg mb-1">${item.title}</h3>
        <p class="text-sm text-slate-400 leading-relaxed">${item.description}</p>
      </div>
    </div>
  `;
}

function buildHomeAccommodationCard(city, delayIndex) {
  const acc = city.accommodation;
  if (!acc) return '';

  // Format dates: "May 22, 2026 – 22:00" -> "May 22 - May 26"
  let datesText = city.dates; // fallback
  if (acc.checkIn && acc.checkOut) {
    const ciMatch = acc.checkIn.match(/^([A-Za-z]+ \d+)/);
    const coMatch = acc.checkOut.match(/^([A-Za-z]+ \d+)/);
    if (ciMatch && coMatch) {
      datesText = `${ciMatch[1]} - ${coMatch[1]}`;
    }
  }

  return `
    <div class="card-hover glass-card rounded-2xl shadow-md overflow-hidden slide-up flex flex-col justify-between group" style="animation-delay: ${delayIndex * 0.1}s; background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px)">
      <div class="relative h-48 overflow-hidden">
        ${acc.image ? `<img src="${acc.image}" alt="${acc.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">` : `<div class="w-full h-full bg-slate-800"></div>`}
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div class="absolute top-3 left-3 bg-black/50 backdrop-blur-md rounded-lg px-2 py-1 border border-white/10">
          <span class="text-xs font-semibold text-white tracking-widest uppercase">${city.name}</span>
        </div>
        <div class="absolute bottom-3 right-3 bg-blue-500/80 backdrop-blur-md border border-blue-400/50 rounded-lg px-2 py-1 flex items-center shadow-lg">
          <span class="text-xs text-white font-bold tracking-wide">${datesText}</span>
        </div>
      </div>
      <div class="p-5 flex flex-col flex-1">
        <div class="flex justify-between items-start gap-3">
          <div class="flex-1">
            <h3 class="text-white font-bold text-xl leading-tight mb-2">${acc.name}</h3>
            <p class="text-sm text-slate-400 line-clamp-2">${acc.address}</p>
          </div>
          ${acc.mapsLink ? `
          <a href="${acc.mapsLink}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da Aç" aria-label="Google Haritalar'da Aç" class="flex-shrink-0 w-10 h-10 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-full flex items-center justify-center transition-all border border-blue-500/30">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </a>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ─── Home Page Renderer ────────────────────────────────────────
function renderHomePage(data) {
  const { trip, cities } = data;

  // Hero content
  const titleEl = document.getElementById('hero-title');
  const subtitleEl = document.getElementById('hero-subtitle');
  const datesEl = document.getElementById('hero-dates');
  const departureInfoEl = document.getElementById('departure-info');

  if (titleEl) titleEl.textContent = trip.title;
  if (subtitleEl) subtitleEl.textContent = trip.subtitle;
  if (datesEl) datesEl.textContent = `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
  if (departureInfoEl && trip.departure) {
    departureInfoEl.textContent = `${trip.departure.from} → ${trip.departure.to} (${trip.departure.airline})`;
  }

  // Start countdown
  if (trip.departure && trip.departure.date) {
    startCountdown(trip.departure.date);
  }

  // Render flights
  if (trip.flights) {
    renderFlights(trip.flights);
  }

  // Render trains
  if (trip.trains) {
    renderTrains(trip.trains);
  }

  // Render route map
  renderRouteMap();

  // Render Accommodation section
  const accGrid = document.getElementById('accommodation-grid');
  if (accGrid) {
    accGrid.innerHTML = cities
      .filter(city => !city.isTransit && city.accommodation) // exclude Transit
      .map((city, i) => buildHomeAccommodationCard(city, i))
      .join('');
  }

  // Render Highlights
  const highlightsGrid = document.getElementById('highlights-grid');
  if (highlightsGrid && trip.highlights) {
    highlightsGrid.innerHTML = trip.highlights.map((h, i) => buildHighlightCard(h, i)).join('');
  }

  // Render Food
  const foodGrid = document.getElementById('food-grid');
  if (foodGrid && trip.food) {
    foodGrid.innerHTML = trip.food.map((f, i) => buildHighlightCard(f, i)).join('');
  }

  // Render Activities
  const actGrid = document.getElementById('activities-grid');
  if (actGrid && trip.activities) {
    actGrid.innerHTML = trip.activities.map((a, i) => buildHighlightCard(a, i)).join('');
  }

  // Render Recommendations
  const recGrid = document.getElementById('recommendations-grid');
  if (recGrid && trip.recommendations) {
    recGrid.innerHTML = trip.recommendations.map((r, i) => buildRecommendationCard(r, i)).join('');
  }

  // Render city cards
  const grid = document.getElementById('cities-grid');
  if (!grid) return;

  grid.innerHTML = cities.map((city, index) => `
    <a href="city.html?id=${city.id}" class="card-hover block rounded-2xl shadow-md overflow-hidden slide-up" style="animation-delay: ${index * 0.12}s; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(8px)">
      <div class="relative h-52 overflow-hidden">
        <img src="${city.coverImage}" alt="${city.name}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div class="absolute bottom-4 left-5">
          <h3 class="text-white text-2xl font-bold">${city.name}</h3>
          <p class="text-amber-300/80 text-sm mt-0.5">${city.dates}</p>
        </div>
        ${city.isTransit ? `<div class="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 border border-white/10">
          <span class="text-sm">✈️</span>
          <span class="text-xs font-semibold text-white">Transit</span>
        </div>` : (city.nights !== undefined ? `<div class="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-lg px-2.5 py-1.5 flex items-center gap-2 border border-white/10">
          <span class="flex items-center gap-1"><span class="text-sm">🌙</span><span class="text-xs font-bold text-white">${city.nights}</span></span>
          <span class="text-white/30">·</span>
          <span class="flex items-center gap-1"><span class="text-sm">☀️</span><span class="text-xs font-bold text-white">${city.days}</span></span>
        </div>` : '')}
      </div>
      <div class="p-5">
        <p class="text-slate-300 text-sm leading-relaxed">${city.shortDescription}</p>
        <div class="mt-4 flex items-center text-blue-400 text-sm font-semibold">
          <span>View Details</span>
          <svg class="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    </a>
  `).join('');
}

// ─── Transport Detail Builder ──────────────────────────────────
function buildTransportDetails(transport) {
  const pnrCode = transport.pnr || '';
  const codeLabel = transport.flightNo ? 'Flight' : 'Train';
  const codeValue = transport.flightNo || transport.trainNo || '';

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Route</p>
        <p class="text-sm font-semibold text-white">${transport.from}</p>
        <div class="flex items-center gap-2 my-1">
          <div class="flex-1 border-t border-dashed border-white/10"></div>
          <span class="text-slate-500 text-xs">${transport.icon || '→'}</span>
          <div class="flex-1 border-t border-dashed border-white/10"></div>
        </div>
        <p class="text-sm font-semibold text-white">${transport.to}</p>
      </div>
      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Date & Time</p>
        <p class="text-sm font-medium text-slate-200">${transport.date}</p>
        <p class="text-sm text-slate-400 mt-0.5">${transport.time}</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-3 pt-2 border-t border-white/5">
      ${codeValue ? `
      <div class="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
        <span class="text-xs text-slate-400">${codeLabel}:</span>
        <span class="text-sm font-bold text-slate-200">${codeValue}</span>
      </div>` : ''}
      ${pnrCode ? `
      <div class="flex items-center gap-2 bg-blue-500/10 rounded-lg px-3 py-2">
        <span class="text-xs text-blue-400">PNR:</span>
        <span class="text-sm font-bold text-blue-300 font-mono tracking-wider">${pnrCode}</span>
        <button onclick="copyToClipboard('${pnrCode}', this)" class="copy-btn ml-1 text-xs bg-blue-500/15 text-blue-300 px-2 py-1 rounded-md font-medium cursor-pointer">Copy</button>
      </div>` : ''}
    </div>
  `;
}

// ─── Accommodation Builder ─────────────────────────────────────
function buildAccommodationDetails(accommodation) {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Address</p>
        <p class="text-sm text-slate-300 leading-relaxed">${accommodation.address}</p>
      </div>
      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Check-in</p>
        <p class="text-sm font-medium text-slate-200">${accommodation.checkIn}</p>
      </div>
      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Check-out</p>
        <p class="text-sm font-medium text-slate-200">${accommodation.checkOut}</p>
      </div>
      <div class="flex flex-col gap-2">
        ${accommodation.confirmationNo ? `
        <div class="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2 w-fit">
          <span class="text-xs text-emerald-400">Conf. No:</span>
          <span class="text-sm font-bold text-emerald-300 font-mono">${accommodation.confirmationNo}</span>
          <button onclick="copyToClipboard('${accommodation.confirmationNo}', this)" class="copy-btn ml-1 text-xs bg-emerald-500/15 text-emerald-300 px-2 py-1 rounded-md font-medium cursor-pointer">Copy</button>
        </div>` : ''}
        ${accommodation.mapsLink ? `
        <a href="${accommodation.mapsLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium w-fit">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
           View on Map
        </a>` : ''}
      </div>
    </div>
  `;
}

// ─── Must See Builder ──────────────────────────────────────────
function buildMustSeeSection(mustSeeItems) {
  if (!mustSeeItems || mustSeeItems.length === 0) return '';

  return mustSeeItems.map((item, index) => `
    <div class="card-hover glass-card rounded-2xl shadow-md overflow-hidden slide-up group" style="animation-delay: ${index * 0.15}s; background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px)">
      <div class="relative h-48 overflow-hidden">
        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div class="absolute bottom-4 left-4 right-4">
          <h3 class="text-white font-bold text-lg leading-tight shadow-sm">${item.name}</h3>
        </div>
      </div>
      <div class="p-4">
        <p class="text-sm text-slate-300 leading-relaxed">${item.description}</p>
      </div>
    </div>
  `).join('');
}

// ─── Itinerary Timeline Builder ────────────────────────────────
function buildItineraryTimeline(itinerary) {
  return itinerary.map((day, dayIndex) => `
    <div class="slide-up" style="animation-delay: ${dayIndex * 0.1}s">
      <!-- Day Header -->
      <div class="flex items-center gap-4 mb-6">
        <div class="flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl px-5 py-3 shadow-md">
          <p class="text-sm font-bold">${day.day}</p>
        </div>
        <div class="flex-1">
          <p class="text-lg font-semibold text-white">${day.title}</p>
          <div class="h-0.5 bg-gradient-to-r from-blue-500/30 to-transparent mt-2 rounded-full"></div>
        </div>
      </div>

      <!-- Activities -->
      <div class="relative ml-2 pl-12 space-y-0">
        <div class="timeline-line"></div>
        ${day.activities.map((act, actIndex) => `
          <div class="relative pb-5 last:pb-0">
            <div class="timeline-dot" style="top: 6px"></div>
            <div class="rounded-xl px-5 py-3.5 shadow-sm transition-shadow duration-200 hover:shadow-md" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)">
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 text-xs font-bold text-blue-300 bg-blue-500/10 rounded-lg px-2.5 py-1 tabular-nums min-w-[52px] text-center">${act.time}</span>
                <p class="text-sm text-slate-300 leading-relaxed pt-0.5">${act.activity}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ─── City Page Renderer ────────────────────────────────────────
function renderCityPage(data, cityId) {
  const city = data.cities.find(c => c.id === cityId);

  if (!city) {
    window.location.href = 'index.html';
    return;
  }

  // Update page title
  document.title = `${city.name} – Italy Trip`;

  // City hero
  const coverEl = document.getElementById('city-cover');
  const nameEl = document.getElementById('city-name');
  const datesEl = document.getElementById('city-dates');

  if (coverEl) {
    coverEl.src = city.coverImage;
    coverEl.alt = city.name;
  }
  if (nameEl) nameEl.textContent = city.name;
  if (datesEl) datesEl.textContent = city.dates;

  // Transport - Arrival
  if (city.transport && city.transport.arrival) {
    const arr = city.transport.arrival;
    const arrIcon = document.getElementById('arrival-icon');
    const arrType = document.getElementById('arrival-type');
    const arrDetails = document.getElementById('arrival-details');
    if (arrIcon) arrIcon.textContent = arr.icon || '✈️';
    if (arrType) arrType.textContent = arr.type || 'Ulaşım';
    if (arrDetails) arrDetails.innerHTML = buildTransportDetails(arr);
  }

  // Transport - Departure
  if (city.transport && city.transport.departure) {
    const dep = city.transport.departure;
    const depIcon = document.getElementById('departure-icon');
    const depType = document.getElementById('departure-type');
    const depDetails = document.getElementById('departure-details');
    if (depIcon) depIcon.textContent = dep.icon || '🚄';
    if (depType) depType.textContent = dep.type || 'Ulaşım';
    if (depDetails) depDetails.innerHTML = buildTransportDetails(dep);
  }

  // Accommodation
  if (city.accommodation) {
    const hotelNameEl = document.getElementById('hotel-name');
    const accDetails = document.getElementById('accommodation-details');
    if (hotelNameEl) hotelNameEl.textContent = city.accommodation.name;
    if (accDetails) accDetails.innerHTML = buildAccommodationDetails(city.accommodation);
  } else {
    // Hide accommodation card if none exists (e.g., Transit in Sofia)
    const accCard = document.getElementById('accommodation-card');
    if (accCard) accCard.style.display = 'none';
  }

  // Must See Section
  const mustSeeSection = document.getElementById('must-see-section');
  const mustSeeContainer = document.getElementById('must-see-container');
  if (mustSeeSection && mustSeeContainer && city.mustSee && city.mustSee.length > 0) {
    mustSeeContainer.innerHTML = buildMustSeeSection(city.mustSee);
    mustSeeSection.classList.remove('hidden');
  }

  // Itinerary
  if (city.itinerary && city.itinerary.length > 0) {
    const itineraryContainer = document.getElementById('itinerary-container');
    if (itineraryContainer) itineraryContainer.innerHTML = buildItineraryTimeline(city.itinerary);
  }
}

// ─── Page Detection & Init ─────────────────────────────────────
async function init() {
  setFooterYear();

  const data = await fetchData();
  if (!data) return;

  // Detect which page we're on
  const citiesGrid = document.getElementById('cities-grid');
  const cityHero = document.getElementById('city-hero');

  if (citiesGrid) {
    // Home page
    renderHomePage(data);
  } else if (cityHero) {
    // City detail page
    const params = new URLSearchParams(window.location.search);
    const cityId = params.get('id');

    if (!cityId) {
      window.location.href = 'index.html';
      return;
    }

    renderCityPage(data, cityId);
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
