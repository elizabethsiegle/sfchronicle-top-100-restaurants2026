import { useState, useMemo, useCallback, useEffect } from 'react';
import { matchesDropdowns, matchesTag, applyChartFilter, sortData } from './utils/filters';
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

const DO_API_KEY = import.meta.env.VITE_DO_API_KEY;
const DO_API_URL = 'https://inference.do-ai.run/v1/chat/completions';

async function semanticSearchAPI(query, restaurants) {
  const list = restaurants.map(r =>
    `${r.slug}|${r.name} (${r.cuisine}, ${r.price}, ${r.city}): ${r.description.slice(0, 120)}`
  ).join('\n');
  const res = await fetch(DO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DO_API_KEY}` },
    body: JSON.stringify({
      model: 'anthropic-claude-opus-4',
      messages: [
        { role: 'system', content: 'You are a restaurant semantic search assistant. Given a list of Bay Area restaurants, return the slugs of the best matches for the user\'s query. Return ONLY a comma-separated list of slugs, nothing else. Return at most 20 slugs.' },
        { role: 'user', content: `Restaurants:\n${list}\n\nQuery: "${query}"` },
      ],
      max_tokens: 300,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  const msg = json.choices[0].message;
  const content = msg.content || msg.reasoning_content || '';
  return content.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

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
    tagFilter: p.get('tag') || null,
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
  if (state.tagFilter)             p.set('tag',        state.tagFilter);
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
  const [tagFilter,      setTagFilter]      = useState(init.tagFilter);
  const [semanticSlugs,  setSemanticSlugs]  = useState(null);
  const [semanticLoading,setSemanticLoading]= useState(false);
  const [semanticError,  setSemanticError]  = useState(null);
  const [semanticQuery,  setSemanticQuery]  = useState('');

  const filters = { search, location: filterLocation, city: filterCity, price: filterPrice, cuisine: filterCuisine };

  // Sync state → URL
  useEffect(() => {
    writeParams({ search, location: filterLocation, city: filterCity, price: filterPrice, cuisine: filterCuisine, sortMode, chartFilter, tagFilter });
  }, [search, filterLocation, filterCity, filterPrice, filterCuisine, sortMode, chartFilter, tagFilter]);

  const cities      = useMemo(() => [...new Set(restaurants.map(r => r.city))].sort(), [restaurants]);
  const cuisines    = useMemo(() => [...new Set(restaurants.map(r => r.cuisine))].sort(), [restaurants]);
  const hasPrevRank = useMemo(() => restaurants.some(r => r.prev_rank !== null), [restaurants]);

  const { baseData, filteredData, nearbyInfo } = useMemo(() => {
    const base = restaurants.filter(r =>
      matchesDropdowns(r, filters) &&
      matchesTag(r, tagFilter) &&
      (semanticSlugs == null || semanticSlugs.includes(r.slug))
    );

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
  }, [search, filterLocation, filterCity, filterPrice, filterCuisine, sortMode, chartFilter, tagFilter, semanticSlugs]); // eslint-disable-line

  const handleSemanticSearch = useCallback(async (query) => {
    if (!query.trim()) return;
    setSemanticLoading(true);
    setSemanticError(null);
    try {
      const slugs = await semanticSearchAPI(query, restaurants);
      setSemanticSlugs(slugs);
      setSemanticQuery(query);
    } catch (e) {
      setSemanticError(e.message);
    } finally {
      setSemanticLoading(false);
    }
  }, [restaurants]);

  const handleChartFilter = useCallback((field, value) => {
    setChartFilter(prev =>
      prev?.field === field && prev?.value === value ? null : { field, value }
    );
  }, []);

  const hasActiveFilters = search || filterLocation || filterCity || filterPrice || filterCuisine || chartFilter || tagFilter || semanticSlugs;

  const clearAll = useCallback(() => {
    setSearch('');
    setFilterLocation('');
    setFilterCity('');
    setFilterPrice('');
    setFilterCuisine('');
    setChartFilter(null);
    setTagFilter(null);
    setSemanticSlugs(null);
    setSemanticQuery('');
    setSemanticError(null);
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
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          hasPrevRank={hasPrevRank}
          semanticSlugs={semanticSlugs}
          semanticLoading={semanticLoading}
          semanticError={semanticError}
          semanticQuery={semanticQuery}
          onSemanticSearch={handleSemanticSearch}
          onClearSemantic={() => { setSemanticSlugs(null); setSemanticQuery(''); setSemanticError(null); }}
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
