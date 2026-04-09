import { CITY_COORDS } from '../data';

export function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearbyFallback(searchTerm, filters, restaurants) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return null;

  let coord = CITY_COORDS[term];
  if (!coord) {
    const key = Object.keys(CITY_COORDS).find(k => k.startsWith(term) || term.startsWith(k));
    if (key) coord = CITY_COORDS[key];
  }
  if (!coord) return null;

  const pool = restaurants
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
