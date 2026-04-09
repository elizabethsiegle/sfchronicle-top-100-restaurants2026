import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gmapsUrl, yelpUrl, googleReviewsUrl, addToGmapsUrl } from '../utils/urls';

function markerColor(rank) {
  if (rank <= 3)  return { bg: '#2c2c2c', border: '#c9a84c', text: '#c9a84c' };
  if (rank <= 10) return { bg: '#c9a84c', border: '#fff',    text: '#1a1a1a' };
  return                  { bg: '#8b1a1a', border: '#fff',    text: '#fff'    };
}

function createIcon(r) {
  const c    = markerColor(r.rank);
  const size = r.rank <= 3 ? 34 : r.rank <= 10 ? 30 : 26;
  const fs   = r.rank <= 3 ? '0.75' : '0.65';
  return L.divIcon({
    className: '',
    html: `<div style="background:${c.bg};color:${c.text};border:2px solid ${c.border};border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${fs}rem;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-family:Georgia,serif;"><span style="transform:rotate(45deg)">${r.rank}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function popupHtml(r) {
  const rankChange = r.prev_rank === null
    ? '<span class="tag tag-new">NEW</span>'
    : r.prev_rank > r.rank
      ? `<span class="tag tag-up">▲ was #${r.prev_rank}</span>`
      : r.prev_rank < r.rank
        ? `<span class="tag tag-down">▼ was #${r.prev_rank}</span>`
        : '<span style="font-size:0.68rem;color:#888">Same as 2025</span>';

  return `
    ${r.image ? `<img class="popup-img" src="${r.image}" alt="${r.name}" onerror="this.style.display='none'">` : ''}
    <div class="popup-body">
      <div class="popup-rank">#${r.rank} · ${r.location}</div>
      <div class="popup-name">${r.name}</div>
      <div class="popup-meta">
        <span class="tag tag-cuisine">${r.cuisine}</span>
        <span class="tag tag-price">${r.price}</span>
        ${rankChange}
      </div>
      <div style="font-size:0.72rem;color:#666;margin-bottom:6px;">📍 ${r.address}, ${r.city}</div>
      ${r.description ? `<div class="popup-desc">${r.description}</div>` : ''}
      <div class="popup-actions">
        <a class="action-btn btn-maps"      href="${gmapsUrl(r)}"        target="_blank">📍 Maps</a>
        <a class="action-btn btn-gmaps-add" href="${addToGmapsUrl(r)}"   target="_blank">💾 Save to Maps</a>
        <a class="action-btn btn-yelp"      href="${yelpUrl(r)}"         target="_blank">★ Yelp</a>
        <a class="action-btn" style="background:#e8e8e8;color:#333;" href="${googleReviewsUrl(r)}" target="_blank">G ★ Reviews</a>
        <a class="action-btn btn-sfc"       href="${r.url}"              target="_blank">SFC ↗</a>
      </div>
    </div>`;
}

export default function MapView({ restaurants, filteredData, activeSlug, onRestaurantFocus, nearbyInfo }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});

  // Initialize map once on mount
  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: true }).setView([37.76, -122.26], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Create all markers up front
    restaurants.forEach(r => {
      if (!r.lat || !r.lng) return;
      const marker = L.marker([r.lat, r.lng], { icon: createIcon(r) })
        .bindPopup(popupHtml(r), { maxWidth: 340, maxHeight: 520 })
        .addTo(map);
      marker.on('click', () => onRestaurantFocus(r.slug));
      markersRef.current[r.slug] = marker;
    });

    return () => map.remove();
  }, [restaurants]); // eslint-disable-line

  // Sync visible markers whenever filteredData changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const visibleSlugs = new Set(filteredData.map(r => r.slug));
    Object.keys(markersRef.current).forEach(slug => {
      const marker = markersRef.current[slug];
      if (visibleSlugs.has(slug)  && !map.hasLayer(marker)) marker.addTo(map);
      if (!visibleSlugs.has(slug) &&  map.hasLayer(marker)) map.removeLayer(marker);
    });

    if (filteredData.length > 0 && filteredData.length < 100) {
      const pts = filteredData.filter(r => r.lat).map(r => [r.lat, r.lng]);
      if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    }

    // Extend bounds to include the searched city for nearby mode
    if (nearbyInfo) {
      const pts = filteredData.filter(r => r.lat).map(r => [r.lat, r.lng]);
      pts.push([nearbyInfo.coord.lat, nearbyInfo.coord.lng]);
      map.fitBounds(pts, { padding: [50, 50], maxZoom: 13 });
    }
  }, [filteredData, nearbyInfo]);

  // Pan to + open popup for the active restaurant
  useEffect(() => {
    const map    = mapRef.current;
    const marker = markersRef.current[activeSlug];
    const r      = restaurants.find(x => x.slug === activeSlug);
    if (map && marker && r?.lat) {
      map.setView([r.lat, r.lng], 15, { animate: true });
      marker.openPopup();
    }
  }, [activeSlug]);

  return (
    <div className="map-container">
      <div ref={containerRef} id="map" />
      <div className="map-legend">
        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '0.73rem' }}>Legend</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#2c2c2c', border: '2px solid #c9a84c' }} /> #1–3</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#c9a84c' }} /> #4–10</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#8b1a1a' }} /> #11–100</div>
      </div>
    </div>
  );
}
