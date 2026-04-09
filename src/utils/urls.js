export function gmapsUrl(r) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.full_address)}`;
}

export function yelpUrl(r) {
  const slug = (r.name + '-' + r.city)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `https://www.yelp.com/biz/${slug}`;
}

export function googleReviewsUrl(r) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.full_address)}`;
}

export function addToGmapsUrl(r) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.full_address)}&query_place_id=${encodeURIComponent(r.name)}`;
}
