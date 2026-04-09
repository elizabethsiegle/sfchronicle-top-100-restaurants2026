import { useState, useMemo, useCallback } from 'react';
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

export default function App({
  restaurants, year, articleUrl,
  otherYears,          // [{year, path}, ...]
  comparisonData,      // 2026 page: 2025 restaurants for year-over-year comparison
  survivalData,        // 2024 page: [{year, data}, ...] to show which survived
}) {
  const [search, setSearch]               = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCity, setFilterCity]       = useState('');
  const [filterPrice, setFilterPrice]     = useState('');
  const [filterCuisine, setFilterCuisine] = useState('');
  const [sortMode, setSortMode]           = useState('rank');
  const [chartFilter, setChartFilter]     = useState(null);
  const [activeSlug, setActiveSlug]       = useState(null);

  const filters = { search, location: filterLocation, city: filterCity, price: filterPrice, cuisine: filterCuisine };

  // Derive city/cuisine options from this year's data
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

  return (
    <>
      <Header year={year} otherYears={otherYears} articleUrl={articleUrl} />
      <InfoBar />
      <div className="app">
        <Sidebar
          filteredData={filteredData}
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
