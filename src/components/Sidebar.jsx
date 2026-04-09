import { useEffect } from 'react';
import RestaurantCard from './RestaurantCard';

const SORT_LABELS = { rank: 'Rank', name: 'A–Z', 'price-asc': '$ first', 'price-desc': '$$$$ first' };

export default function Sidebar({
  filteredData, total, filters, sortMode,
  onSearchChange, onLocationChange, onCityChange, onPriceChange, onCuisineChange, onSortChange,
  chartFilter, onChartFilterClear,
  hasActiveFilters, onClearAll,
  activeSlug, onRestaurantFocus,
  nearbyInfo,
  cities, cuisines,
}) {
  useEffect(() => {
    if (activeSlug) {
      document.getElementById(`card-${activeSlug}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeSlug]);

  const fieldName = chartFilter ? { location: 'Region', price: 'Price', cuisine: 'Cuisine' }[chartFilter.field] : null;

  return (
    <div className="sidebar">
      <div className="filters">
        <input
          className="search-box"
          type="text"
          placeholder="Search restaurants, cuisine, city..."
          value={filters.search}
          onChange={e => onSearchChange(e.target.value)}
        />

        <div className="filters-row">
          <div className="filter-group">
            <label>Region</label>
            <select value={filters.location} onChange={e => onLocationChange(e.target.value)}>
              <option value="">All regions</option>
              {['San Francisco','East Bay','North Bay','Peninsula','South Bay'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>City</label>
            <select value={filters.city} onChange={e => onCityChange(e.target.value)}>
              <option value="">All cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Price</label>
            <select value={filters.price} onChange={e => onPriceChange(e.target.value)}>
              <option value="">Any price</option>
              <option value="$">$ (Cheap eats)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Pricey)</option>
              <option value="$$$$">$$$$ (Splurge)</option>
            </select>
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group" style={{ flex: 2 }}>
            <label>Cuisine</label>
            <select value={filters.cuisine} onChange={e => onCuisineChange(e.target.value)}>
              <option value="">All cuisines</option>
              {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="filter-tags">
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '24px' }}>Sort:</span>
          {Object.entries(SORT_LABELS).map(([mode, label]) => (
            <button
              key={mode}
              className={`sort-btn${sortMode === mode ? ' active' : ''}`}
              onClick={() => onSortChange(mode)}
            >
              {label}
            </button>
          ))}
          {hasActiveFilters && (
            <button className="sort-btn clear-all-btn" onClick={onClearAll}>
              ✕ Clear all
            </button>
          )}
        </div>
      </div>

      <div className="results-count">
        Showing {filteredData.length} of {total} restaurants
      </div>

      {nearbyInfo && (
        <div className="nearby-notice visible">
          📍 No restaurants found in <strong>{nearbyInfo.cityName.replace(/\b\w/g, c => c.toUpperCase())}</strong> — showing the {nearbyInfo.pool.length} closest (nearest: <strong>{nearbyInfo.pool[0].name}</strong>, {nearbyInfo.pool[0]._dist.toFixed(1)} mi away)
        </div>
      )}

      {chartFilter && (
        <div className="chart-filter-badge">
          <span>Chart filter: <strong>{fieldName} = {chartFilter.value}</strong></span>
          <button onClick={onChartFilterClear}>✕ Clear</button>
        </div>
      )}

      <div className="list">
        {filteredData.map(r => (
          <RestaurantCard
            key={r.slug}
            r={r}
            isActive={r.slug === activeSlug}
            onFocus={onRestaurantFocus}
          />
        ))}
      </div>
    </div>
  );
}
