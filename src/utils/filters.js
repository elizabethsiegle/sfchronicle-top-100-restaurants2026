export function matchesDropdowns(r, { search, location, city, price, cuisine }) {
  if (search &&
      !r.name.toLowerCase().includes(search) &&
      !r.cuisine.toLowerCase().includes(search) &&
      !r.city.toLowerCase().includes(search) &&
      !r.description.toLowerCase().includes(search)) return false;
  if (location && !r.location.includes(location)) return false;
  if (city     && r.city    !== city)             return false;
  if (price    && r.price   !== price)            return false;
  if (cuisine  && r.cuisine !== cuisine)          return false;
  return true;
}

export function applyChartFilter(data, chartFilter) {
  if (!chartFilter) return data;
  return data.filter(r =>
    r[chartFilter.field] === chartFilter.value ||
    (chartFilter.field === 'location' && r.location.includes(chartFilter.value))
  );
}

export function sortData(data, sortMode) {
  const sorted = [...data];
  if      (sortMode === 'rank')       sorted.sort((a, b) => a.rank - b.rank);
  else if (sortMode === 'name')       sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortMode === 'price-asc')  sorted.sort((a, b) => (a.price_num - b.price_num) || (a.rank - b.rank));
  else if (sortMode === 'price-desc') sorted.sort((a, b) => (b.price_num - a.price_num) || (a.rank - b.rank));
  return sorted;
}
