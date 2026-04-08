// ── State ─────────────────────────────────────────────────────────────────────

let activeSlug = null;
let markers = {};
let currentData = [...RESTAURANTS];
let sortMode = 'rank';
let chartFilter = null; // { field: 'location'|'price'|'cuisine', value: string } | null

// ── Map ───────────────────────────────────────────────────────────────────────

const map = L.map('map', { zoomControl: true }).setView([37.76, -122.26], 10);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

function markerColor(rank) {
  if (rank <= 3)  return { bg: '#2c2c2c', border: '#c9a84c', text: '#c9a84c' };
  if (rank <= 10) return { bg: '#c9a84c', border: '#fff',    text: '#1a1a1a' };
  return                  { bg: '#8b1a1a', border: '#fff',    text: '#fff'    };
}

function createIcon(r) {
  const c = markerColor(r.rank);
  const size = r.rank <= 3 ? 34 : r.rank <= 10 ? 30 : 26;
  const fontSize = r.rank <= 3 ? '0.75' : '0.65';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${c.bg};color:${c.text};border:2px solid ${c.border};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}rem;font-weight:bold;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);font-family:Georgia,serif;
    "><span style="transform:rotate(45deg)">${r.rank}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Build markers for all restaurants
RESTAURANTS.forEach(r => {
  if (!r.lat || !r.lng) return;
  const marker = L.marker([r.lat, r.lng], { icon: createIcon(r) })
    .bindPopup(popupHtml(r), { maxWidth: 340, maxHeight: 520 })
    .addTo(map);
  marker.on('click', () => {
    activeSlug = r.slug;
    scrollToCard(r.slug);
    highlightCard(r.slug);
  });
  markers[r.slug] = marker;
});

function focusRestaurant(slug) {
  const r = RESTAURANTS.find(x => x.slug === slug);
  if (!r) return;
  activeSlug = slug;
  highlightCard(slug);
  if (r.lat && r.lng) {
    map.setView([r.lat, r.lng], 15, { animate: true });
    markers[slug]?.openPopup();
  }
}

function highlightCard(slug) {
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  document.getElementById('card-' + slug)?.classList.add('active');
}

function scrollToCard(slug) {
  document.getElementById('card-' + slug)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function gmapsUrl(r) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.full_address)}`;
}

function yelpUrl(r) {
  const slug = (r.name + '-' + r.city)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `https://www.yelp.com/biz/${slug}`;
}

function googleReviewsUrl(r) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.full_address)}`;
}

function addToGmapsUrl(r) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.full_address)}&query_place_id=${encodeURIComponent(r.name)}`;
}

// ── HTML templates ────────────────────────────────────────────────────────────

function rankChangeBadge(r, compact = false) {
  if (r.prev_rank === null) return '<span class="tag tag-new">NEW</span>';
  if (r.prev_rank > r.rank) return compact
    ? `<span class="tag tag-up">▲${r.prev_rank - r.rank}</span>`
    : `<span class="tag tag-up">▲ was #${r.prev_rank}</span>`;
  if (r.prev_rank < r.rank) return compact
    ? `<span class="tag tag-down">▼${r.rank - r.prev_rank}</span>`
    : `<span class="tag tag-down">▼ was #${r.prev_rank}</span>`;
  return compact ? '' : '<span style="font-size:0.68rem;color:#888">Same as 2025</span>';
}

function popupHtml(r) {
  return `
    ${r.image ? `<img class="popup-img" src="${r.image}" alt="${r.name}" onerror="this.style.display='none'">` : ''}
    <div class="popup-body">
      <div class="popup-rank">#${r.rank} · ${r.location}</div>
      <div class="popup-name">${r.name}</div>
      <div class="popup-meta">
        <span class="tag tag-cuisine">${r.cuisine}</span>
        <span class="tag tag-price">${r.price}</span>
        ${rankChangeBadge(r)}
      </div>
      <div style="font-size:0.72rem;color:#666;margin-bottom:6px;">📍 ${r.address}, ${r.city}</div>
      ${r.description ? `<div class="popup-desc">${r.description}</div>` : ''}
      <div class="popup-actions">
        <a class="action-btn btn-maps"     href="${gmapsUrl(r)}"        target="_blank">📍 Maps</a>
        <a class="action-btn btn-gmaps-add" href="${addToGmapsUrl(r)}"   target="_blank">💾 Save to Maps</a>
        <a class="action-btn btn-yelp"     href="${yelpUrl(r)}"         target="_blank">★ Yelp</a>
        <a class="action-btn" style="background:#e8e8e8;color:#333;" href="${googleReviewsUrl(r)}" target="_blank">G ★ Reviews</a>
        <a class="action-btn btn-sfc"      href="${r.url}"              target="_blank">SFC ↗</a>
      </div>
    </div>`;
}

function cardHtml(r) {
  return `
    <div class="card" id="card-${r.slug}" data-slug="${r.slug}" onclick="focusRestaurant('${r.slug}')">
      <div class="card-rank"><div class="rank-num">${r.rank}</div></div>
      ${r.image
        ? `<img class="card-img" src="${r.image}" alt="${r.name}" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="card-img-placeholder">🍽</div>`}
      <div class="card-body">
        <div class="card-name">${r.name}</div>
        <div class="card-meta">
          <span class="tag tag-cuisine">${r.cuisine}</span>
          <span class="tag tag-price">${r.price}</span>
          ${rankChangeBadge(r, true)}
          <span style="color:#888">· ${r.city}</span>
        </div>
        <div class="card-actions">
          <a class="action-btn btn-maps" href="${gmapsUrl(r)}" target="_blank" onclick="event.stopPropagation()">📍 Maps</a>
          <a class="action-btn btn-yelp" href="${yelpUrl(r)}"  target="_blank" onclick="event.stopPropagation()">★ Yelp</a>
          <a class="action-btn" style="background:#e8e8e8;color:#333;" href="${googleReviewsUrl(r)}" target="_blank" onclick="event.stopPropagation()">G ★ Reviews</a>
        </div>
      </div>
    </div>`;
}

// ── Nearby fallback ───────────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearbyFallback(searchTerm, filters) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return null;

  let coord = CITY_COORDS[term];
  if (!coord) {
    const key = Object.keys(CITY_COORDS).find(k => k.startsWith(term) || term.startsWith(k));
    if (key) coord = CITY_COORDS[key];
  }
  if (!coord) return null;

  const pool = RESTAURANTS
    .filter(r => {
      if (filters.location && !r.location.includes(filters.location)) return false;
      if (filters.city     && r.city    !== filters.city)             return false;
      if (filters.price    && r.price   !== filters.price)            return false;
      if (filters.cuisine  && r.cuisine !== filters.cuisine)          return false;
      return true;
    })
    .map(r => ({ ...r, _dist: haversine(coord.lat, coord.lng, r.lat, r.lng) }))
    .sort((a, b) => a._dist - b._dist)
    .slice(0, 10);

  return { coord, pool, cityName: term };
}

// ── List rendering ────────────────────────────────────────────────────────────

function renderList(data) {
  document.getElementById('list').innerHTML = data.map(cardHtml).join('');
  document.getElementById('results-count').textContent = `Showing ${data.length} of 100 restaurants`;
}

function syncMapMarkers(data) {
  const visibleSlugs = new Set(data.map(r => r.slug));
  Object.keys(markers).forEach(slug => {
    if (visibleSlugs.has(slug) && !map.hasLayer(markers[slug])) markers[slug].addTo(map);
    if (!visibleSlugs.has(slug) && map.hasLayer(markers[slug])) map.removeLayer(markers[slug]);
  });
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function getFilterValues() {
  return {
    search:   document.getElementById('search').value.toLowerCase(),
    location: document.getElementById('filter-location').value,
    city:     document.getElementById('filter-city').value,
    price:    document.getElementById('filter-price').value,
    cuisine:  document.getElementById('filter-cuisine').value,
  };
}

function matchesDropdowns(r, { search, location, city, price, cuisine }) {
  if (search && !r.name.toLowerCase().includes(search) &&
                !r.cuisine.toLowerCase().includes(search) &&
                !r.city.toLowerCase().includes(search) &&
                !r.description.toLowerCase().includes(search)) return false;
  if (location && !r.location.includes(location)) return false;
  if (city     && r.city    !== city)             return false;
  if (price    && r.price   !== price)            return false;
  if (cuisine  && r.cuisine !== cuisine)          return false;
  return true;
}

function sortData(data) {
  const sorted = [...data];
  if      (sortMode === 'rank')       sorted.sort((a, b) => a.rank - b.rank);
  else if (sortMode === 'name')       sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortMode === 'price-asc')  sorted.sort((a, b) => (a.price_num - b.price_num) || (a.rank - b.rank));
  else if (sortMode === 'price-desc') sorted.sort((a, b) => (b.price_num - a.price_num) || (a.rank - b.rank));
  return sorted;
}

function applyFilters() {
  const filters = getFilterValues();
  const notice  = document.getElementById('nearby-notice');

  // Base set: dropdown + search filters only (chart filter layered on top)
  let base = RESTAURANTS.filter(r => matchesDropdowns(r, filters));

  // Nearby fallback when search matches a city with no list entries
  if (base.length === 0 && filters.search) {
    const fallback = nearbyFallback(filters.search, filters);
    if (fallback?.pool.length > 0) {
      const nearest     = fallback.pool[0];
      const displayName = fallback.cityName.replace(/\b\w/g, c => c.toUpperCase());
      notice.innerHTML  = `📍 No restaurants found in <strong>${displayName}</strong> — showing the ${fallback.pool.length} closest (nearest: <strong>${nearest.name}</strong>, ${nearest._dist.toFixed(1)} mi away)`;
      notice.classList.add('visible');
      renderList(fallback.pool);
      buildCharts(fallback.pool);
      syncMapMarkers(fallback.pool);
      const pts = fallback.pool.filter(r => r.lat).map(r => [r.lat, r.lng]);
      pts.push([fallback.coord.lat, fallback.coord.lng]);
      map.fitBounds(pts, { padding: [50, 50], maxZoom: 13 });
      return;
    }
  }
  notice.classList.remove('visible');

  // Apply chart filter on top of base
  const filtered = chartFilter
    ? base.filter(r => r[chartFilter.field] === chartFilter.value ||
        (chartFilter.field === 'location' && r.location.includes(chartFilter.value)))
    : base;

  currentData = sortData(filtered);

  // Render list and charts, then sync markers last — after buildCharts has fully
  // settled — to prevent Chart.js's resize observer from re-adding removed markers
  renderList(currentData);
  buildCharts(base);
  syncMapMarkers(currentData);

  if (currentData.length > 0 && currentData.length < 100) {
    const pts = currentData.filter(r => r.lat).map(r => [r.lat, r.lng]);
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────

['search', 'filter-location', 'filter-city', 'filter-price', 'filter-cuisine'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener(id === 'search' ? 'input' : 'change', () => applyFilters());
});

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sortMode = btn.dataset.sort;
    applyFilters();
  });
});

// ── Charts ────────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#c9a84c', '#8b1a1a', '#4a7c59', '#2c5f8a', '#7a4f8a',
  '#c96c2c', '#3a8a7a', '#8a7a2c', '#6c2c8a', '#2c8a4a',
  '#a84c4c', '#4c6ca8', '#a8844c', '#4ca880', '#a84c84',
];

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function countBy(data, key) {
  return data.reduce((acc, r) => {
    const v = r[key] || 'Unknown';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}

function setChartFilter(field, value) {
  chartFilter = (chartFilter?.field === field && chartFilter?.value === value)
    ? null
    : { field, value };
  updateChartFilterBadge();
  applyFilters();
}

function updateChartFilterBadge() {
  let badge = document.getElementById('chart-filter-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'chart-filter-badge';
    badge.style.cssText = 'display:none;padding:5px 16px;background:#2a1f00;border-bottom:1px solid #c9a84c;font-size:0.73rem;color:#c9a84c;flex-shrink:0;align-items:center;gap:8px;';
    document.getElementById('nearby-notice').insertAdjacentElement('afterend', badge);
  }
  if (chartFilter) {
    const fieldName = { location: 'Region', price: 'Price', cuisine: 'Cuisine' }[chartFilter.field];
    const safeValue = chartFilter.value.replace(/'/g, "\\'");
    badge.innerHTML = `
      <span>Chart filter: <strong>${fieldName} = ${chartFilter.value}</strong></span>
      <button onclick="setChartFilter('${chartFilter.field}','${safeValue}')"
        style="margin-left:auto;background:none;border:1px solid #c9a84c;color:#c9a84c;border-radius:3px;padding:1px 8px;cursor:pointer;font-size:0.7rem;">
        ✕ Clear
      </button>`;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function buildCharts(baseData) {
  const total       = baseData.length;
  const activeField = chartFilter?.field ?? null;
  const activeValue = chartFilter?.value ?? null;

  // Dim segments that aren't the active selection
  function segColors(labels, baseColors, field) {
    if (!activeField || activeField !== field) return [...baseColors];
    return labels.map((lbl, i) =>
      lbl === activeValue ? baseColors[i] : hexAlpha(baseColors[i], 0.25)
    );
  }

  function onDonutClick(field, labels) {
    return (evt, elements) => {
      if (!elements.length) return;
      setChartFilter(field, labels[elements[0].index]);
    };
  }

  function onLegendClick(field) {
    return (evt, item, legend) => {
      setChartFilter(field, legend.chart.data.labels[item.index]);
    };
  }

  function legendLabels(chart, field) {
    return chart.data.labels.map((label, i) => ({
      text:       field === 'price' ? `${label} — ${chart.data.datasets[0].data[i]}` : label,
      fillStyle:  chart.data.datasets[0].backgroundColor[i],
      strokeStyle: '#111',
      lineWidth:  2,
      index:      i,
      fontColor:  (!activeField || activeField !== field || label === activeValue) ? '#ccc' : '#555',
      fontStyle:  (activeField === field && label === activeValue) ? 'bold' : 'normal',
    }));
  }

  // ── Region donut ──────────────────────────────────────────────────────────
  const regionCounts     = countBy(baseData, 'location');
  const regionLabels     = Object.keys(regionCounts).sort((a, b) => regionCounts[b] - regionCounts[a]);
  const regionBaseColors = regionLabels.map((_, i) => CHART_COLORS[i]);

  window._chartRegion?.destroy();
  window._chartRegion = new Chart(document.getElementById('chart-region'), {
    type: 'doughnut',
    data: {
      labels: regionLabels,
      datasets: [{ data: regionLabels.map(k => regionCounts[k]), backgroundColor: segColors(regionLabels, regionBaseColors, 'location'), borderColor: '#111', borderWidth: 2, hoverOffset: 8 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      onClick: onDonutClick('location', regionLabels),
      plugins: {
        legend: { position: 'right', onClick: onLegendClick('location'), labels: { color: '#ccc', font: { size: 11, family: 'Georgia' }, boxWidth: 12, padding: 8, generateLabels: chart => legendLabels(chart, 'location') } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed / total * 100)}%) — click to filter` } },
      },
    },
  });
  document.getElementById('chart-region-note').textContent = activeField === 'location'
    ? `Filtered: ${activeValue} · ${regionCounts[activeValue] || 0} restaurants`
    : `${total} restaurants · SF leads with ${regionCounts['San Francisco'] || 0}`;

  // ── Price donut ────────────────────────────────────────────────────────────
  const priceCounts      = countBy(baseData, 'price');
  const priceOrder       = ['$', '$$', '$$$', '$$$$'];
  const priceLabels      = priceOrder.filter(p => priceCounts[p]);
  const priceColorMap    = { '$': '#4a7c59', '$$': '#2c5f8a', '$$$': '#c9a84c', '$$$$': '#8b1a1a' };
  const priceBaseColors  = priceLabels.map(p => priceColorMap[p]);

  window._chartPrice?.destroy();
  window._chartPrice = new Chart(document.getElementById('chart-price'), {
    type: 'doughnut',
    data: {
      labels: priceLabels,
      datasets: [{ data: priceLabels.map(p => priceCounts[p]), backgroundColor: segColors(priceLabels, priceBaseColors, 'price'), borderColor: '#111', borderWidth: 2, hoverOffset: 8 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      onClick: onDonutClick('price', priceLabels),
      plugins: {
        legend: { position: 'right', onClick: onLegendClick('price'), labels: { color: '#ccc', font: { size: 12, family: 'Georgia' }, boxWidth: 12, padding: 8, generateLabels: chart => legendLabels(chart, 'price') } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} restaurants (${Math.round(ctx.parsed / total * 100)}%) — click to filter` } },
      },
    },
  });
  const modePrice = priceLabels[priceLabels.map(p => priceCounts[p]).indexOf(Math.max(...priceLabels.map(p => priceCounts[p])))];
  document.getElementById('chart-price-note').textContent = activeField === 'price'
    ? `Filtered: ${activeValue} · ${priceCounts[activeValue] || 0} restaurants`
    : `Most common: ${modePrice} (${priceCounts[modePrice]} restaurants)`;

  // ── Cuisine bar ────────────────────────────────────────────────────────────
  const cuisineCounts    = countBy(baseData, 'cuisine');
  const cuisineEntries   = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const cuisineLabels    = cuisineEntries.map(([k]) => k);
  const cuisineVals      = cuisineEntries.map(([, v]) => v);
  const cuisineBaseColors = cuisineLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
  const cuisineBgColors  = activeField === 'cuisine'
    ? cuisineLabels.map((lbl, i) => lbl === activeValue ? cuisineBaseColors[i] : hexAlpha(cuisineBaseColors[i], 0.2))
    : cuisineBaseColors;

  window._chartCuisine?.destroy();
  window._chartCuisine = new Chart(document.getElementById('chart-cuisine'), {
    type: 'bar',
    data: {
      labels: cuisineLabels,
      datasets: [{ data: cuisineVals, backgroundColor: cuisineBgColors, borderRadius: 3, borderSkipped: false }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      onClick: (evt, elements) => {
        if (!elements.length) return;
        setChartFilter('cuisine', cuisineLabels[elements[0].index]);
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} restaurants (${Math.round(ctx.parsed.x / total * 100)}%) — click to filter` } },
      },
      scales: {
        x: { grid: { color: '#222' }, ticks: { color: '#888', font: { size: 10 }, stepSize: 1 } },
        y: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            color: ctx => activeField === 'cuisine'
              ? (cuisineLabels[ctx.index] === activeValue ? '#c9a84c' : '#555')
              : '#bbb',
            font: ctx => ({
              size: 11, family: 'Georgia',
              weight: activeField === 'cuisine' && cuisineLabels[ctx.index] === activeValue ? 'bold' : 'normal',
            }),
          },
        },
      },
    },
  });
  document.getElementById('chart-cuisine-note').textContent = activeField === 'cuisine'
    ? `Filtered: ${activeValue} · ${cuisineCounts[activeValue] || 0} restaurants`
    : `${Object.keys(cuisineCounts).length} cuisine types · click any bar to filter`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

renderList(RESTAURANTS);
buildCharts(RESTAURANTS);
syncMapMarkers(RESTAURANTS);
