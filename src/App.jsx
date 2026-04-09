import { useState, useMemo, useCallback, useEffect } from 'react';
import { matchesDropdowns, applyChartFilter, sortData } from './utils/filters';
import { nearbyFallback } from './utils/geo';
import Header from './components/Header';
import InfoBar from './components/InfoBar';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ChartsSection from './components/ChartsSection';
import ComparisonSection from './components/ComparisonSection';
import Comparison2024Section from './components/Comparison2024Section';
import Footer from './components/Footer';
import SiteFooter from './components/SiteFooter';

function readParams() {
  const p = new URLSearchParams(window.location.search);
  const chart = p.get('chart');
  return {
    search:   p.get('q')        || '',
    location: p.get('location') || '',
    city:     p.get('city')     || '',
    price:    p.get('price')    || '',
    cuisine:  p.get('cuisine')  || '',
    sortMode: p.get('sort')     || 'rank',
    chartFilter: chart ? { field: chart.split(':')[0], value: chart.split(':').slice(1).join(':') } : null,
  };
}

function writeParams(state) {
  const p = new URLSearchParams();
  if (state.search)               p.set('q',        state.search);
  if (state.location)             p.set('location',  state.location);
  if (state.city)                 p.set('city',      state.city);
  if (state.price)                p.set('price',     state.price);
  if (state.cuisine)              p.set('cuisine',   state.cuisine);
  if (state.sortMode !== 'rank')  p.set('sort',      state.sortMode);
  if (state.chartFilter)          p.set('chart',     `${state.chartFilter.field}:${state.chartFilter.value}`);
  const qs = p.toString();
  const url = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

export default function App({
  restaurants, year, articleUrl,
  otherYears,
  comparisonData,
  survivalData,
}) {
  const init = useMemo(() => readParams(), []); // eslint-disable-line

  const [search,         setSearch]         = useState(init.search);
  const [filterLocation, setFilterLocation] = useState(init.location);
  const [filterCity,     setFilterCity]     = useState(init.city);
  const [filterPrice,    setFilterPrice]    = useState(init.price);
  const [filterCuisine,  setFilterCuisine]  = useState(init.cuisine);
  const [sortMode,       setSortMode]       = useState(init.sortMode);
  const [chartFilter,    setChartFilter]    = useState(init.chartFilter);
  const [activeSlug,     setActiveSlug]     = useState(null);

  const filters = { search, location: filterLocation, city: filterCity, price: filterPrice, cuisine: filterCuisine };

  // Sync state → URL
  useEffect(() => {
    writeParams({ search, location: filterLocation, city: filterCity, price: filterPrice, cuisine: filterCuisine, sortMode, chartFilter });
  }, [search, filterLocation, filterCity, filterPrice, filterCuisine, sortMode, chartFilter]);

  const cities   = useMemo(() => [...new Set(restaurants.map(r => r.city))].sort(), [restaurants]);
  const cuisines = useMemo(() => [...new Set(restaurants.map(r => r.cuisine))].sort(), [restaurants]);

  const { baseData, filteredData, nearbyInfo } = useMemo(() => {
    const base = restaurants.filter(r => matchesDropdowns(r, filters));

    if (base.length === 0 && search) {
      const fallback = nearbyFallback(search, filters, restaurants);
      if (fallback?.pool.length > 0) {
        return { baseData: fallback.pool, filteredData: fallback.pool, nearbyInfo: fallback };
      }
    }

    return {
      baseData: base,
      filteredData: sortData(applyChartFilter(base, chartFilter), sortMode),
      nearbyInfo: null,
    };
  }, [search, filterLocation, filterCity, filterPrice, filterCuisine, sortMode, chartFilter]); // eslint-disable-line

  const handleChartFilter = useCallback((field, value) => {
    setChartFilter(prev =>
      prev?.field === field && prev?.value === value ? null : { field, value }
    );
  }, []);

  const hasActiveFilters = search || filterLocation || filterCity || filterPrice || filterCuisine || chartFilter;

  const clearAll = useCallback(() => {
    setSearch('');
    setFilterLocation('');
    setFilterCity('');
    setFilterPrice('');
    setFilterCuisine('');
    setChartFilter(null);
  }, []);

  return (
    <>
      <Header year={year} otherYears={otherYears} articleUrl={articleUrl} />
      <InfoBar />
      <div className="app">
        <Sidebar
          filteredData={filteredData}
          total={restaurants.length}
          filters={filters}
          onSearchChange={setSearch}
          onLocationChange={setFilterLocation}
          onCityChange={setFilterCity}
          onPriceChange={setFilterPrice}
          onCuisineChange={setFilterCuisine}
          sortMode={sortMode}
          onSortChange={setSortMode}
          chartFilter={chartFilter}
          onChartFilterClear={() => setChartFilter(null)}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearAll}
          activeSlug={activeSlug}
          onRestaurantFocus={setActiveSlug}
          nearbyInfo={nearbyInfo}
          cities={cities}
          cuisines={cuisines}
        />
        <MapView
          restaurants={restaurants}
          filteredData={filteredData}
          activeSlug={activeSlug}
          onRestaurantFocus={setActiveSlug}
          nearbyInfo={nearbyInfo}
        />
      </div>
      <ChartsSection
        baseData={baseData}
        chartFilter={chartFilter}
        onChartFilterChange={handleChartFilter}
      />
      {comparisonData && (
        <ComparisonSection restaurants2026={restaurants} restaurants2025={comparisonData} />
      )}
      {survivalData && (
        <Comparison2024Section restaurants2024={restaurants} survivalData={survivalData} />
      )}
      <Footer otherYears={otherYears} />
      <SiteFooter />
    </>
  );
}
