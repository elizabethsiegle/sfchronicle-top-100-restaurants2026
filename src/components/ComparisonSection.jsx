import { useEffect, useRef, useMemo } from 'react';
import { Chart } from 'chart.js/auto';

const REGION_ORDER = ['San Francisco', 'East Bay', 'North Bay', 'Peninsula', 'South Bay'];
const PRICE_ORDER  = ['$', '$$', '$$$', '$$$$'];

function countBy(data, key, order) {
  const counts = data.reduce((acc, r) => { const v = r[key] || 'Unknown'; acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  return order.map(k => counts[k] || 0);
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className="cmp-stat">
      <div className="cmp-stat-value" style={highlight ? { color: highlight } : {}}>{value}</div>
      <div className="cmp-stat-label">{label}</div>
      {sub && <div className="cmp-stat-sub">{sub}</div>}
    </div>
  );
}

export default function ComparisonSection({ restaurants2026, restaurants2025 }) {
  const regionRef = useRef(null);
  const priceRef  = useRef(null);
  const moversRef = useRef(null);
  const charts    = useRef({});

  const stats = useMemo(() => {
    const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const slugs2026 = new Set(restaurants2026.map(r => norm(r.slug)));
    const newIn2026     = restaurants2026.filter(r => r.prev_rank === null);
    const dropped       = restaurants2025.filter(r => !slugs2026.has(norm(r.slug)));
    const returning     = restaurants2026.filter(r => r.prev_rank !== null)
                           .map(r => ({ ...r, change: r.prev_rank - r.rank }));

    const climbers = [...returning].sort((a, b) => b.change - a.change);
    const fallers  = [...returning].sort((a, b) => a.change - b.change);

    return { newIn2026, dropped, returning, climbers, fallers };
  }, [restaurants2026, restaurants2025]);

  useEffect(() => {
    const TOP_N = 8;
    const climbers = stats.climbers.slice(0, TOP_N);
    const fallers  = stats.fallers.slice(0, TOP_N);
    const movers   = [
      ...climbers.map(r => ({ name: r.name, change: r.change })),
      ...fallers.map(r => ({ name: r.name, change: r.change })),
    ].sort((a, b) => b.change - a.change);

    const COLOR_25 = '#4a7c59';
    const COLOR_26 = '#c9a84c';

    // ── Regional shift ──────────────────────────────────────────────────────
    const reg25 = countBy(restaurants2025, 'location', REGION_ORDER);
    const reg26 = countBy(restaurants2026, 'location', REGION_ORDER);

    charts.current.region?.destroy();
    charts.current.region = new Chart(regionRef.current, {
      type: 'bar',
      data: {
        labels: REGION_ORDER,
        datasets: [
          { label: '2025', data: reg25, backgroundColor: COLOR_25, borderRadius: 3 },
          { label: '2026', data: reg26, backgroundColor: COLOR_26, borderRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#ccc', font: { size: 11, family: 'Georgia' }, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} restaurants` } },
        },
        scales: {
          x: { grid: { color: '#222' }, ticks: { color: '#bbb', font: { size: 10, family: 'Georgia' } } },
          y: { grid: { color: '#222' }, ticks: { color: '#888', font: { size: 10 }, stepSize: 5 }, beginAtZero: true },
        },
      },
    });

    // ── Price shift ──────────────────────────────────────────────────────────
    const price25 = countBy(restaurants2025, 'price', PRICE_ORDER);
    const price26 = countBy(restaurants2026, 'price', PRICE_ORDER);

    charts.current.price?.destroy();
    charts.current.price = new Chart(priceRef.current, {
      type: 'bar',
      data: {
        labels: PRICE_ORDER,
        datasets: [
          { label: '2025', data: price25, backgroundColor: COLOR_25, borderRadius: 3 },
          { label: '2026', data: price26, backgroundColor: COLOR_26, borderRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#ccc', font: { size: 11, family: 'Georgia' }, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} restaurants` } },
        },
        scales: {
          x: { grid: { color: '#222' }, ticks: { color: '#bbb', font: { size: 11, family: 'Georgia' } } },
          y: { grid: { color: '#222' }, ticks: { color: '#888', font: { size: 10 }, stepSize: 5 }, beginAtZero: true },
        },
      },
    });

    // ── Top movers ───────────────────────────────────────────────────────────
    charts.current.movers?.destroy();
    charts.current.movers = new Chart(moversRef.current, {
      type: 'bar',
      data: {
        labels: movers.map(r => r.name),
        datasets: [{
          data: movers.map(r => r.change),
          backgroundColor: movers.map(r => r.change > 0 ? 'rgba(74,124,89,0.85)' : 'rgba(139,26,26,0.85)'),
          borderRadius: 3,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const v = ctx.parsed.x;
                return v > 0 ? ` ▲ climbed ${v} spots` : ` ▼ fell ${Math.abs(v)} spots`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#222' },
            ticks: { color: '#888', font: { size: 10 } },
            title: { display: true, text: '← fell   rose →', color: '#555', font: { size: 10 } },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: ctx => movers[ctx.index]?.change > 0 ? '#4a7c59' : '#8b1a1a',
              font: { size: 10, family: 'Georgia' },
              autoSkip: false,
            },
          },
        },
      },
    });

    return () => Object.values(charts.current).forEach(c => c?.destroy());
  }, [stats]);

  const { newIn2026, dropped, returning, climbers, fallers } = stats;
  const bigClimber = climbers[0];
  const bigFaller  = fallers[0];

  return (
    <div className="comparison-section">
      <div className="comparison-header">
        <span className="comparison-title">Year-over-Year Comparison</span>
        <span className="comparison-sub">2025 → 2026 · What changed on the list?</span>
      </div>

      <div className="cmp-stats-row">
        <StatCard label="New to 2026" value={newIn2026.length} sub="restaurants" highlight="#c9a84c" />
        <StatCard label="Dropped from 2025" value={dropped.length} sub="restaurants" highlight="#8b1a1a" />
        <StatCard label="Returning" value={returning.length} sub="restaurants" highlight="#4a7c59" />
        {bigClimber && (
          <StatCard
            label="Biggest climber"
            value={`▲${bigClimber.change}`}
            sub={bigClimber.name}
            highlight="#4a7c59"
          />
        )}
        {bigFaller && (
          <StatCard
            label="Biggest faller"
            value={`▼${Math.abs(bigFaller.change)}`}
            sub={bigFaller.name}
            highlight="#8b1a1a"
          />
        )}
      </div>

      <div className="cmp-charts-row">
        <div className="cmp-chart-card">
          <div className="chart-title">Regional Shift</div>
          <div className="chart-subtitle">Restaurant count by region</div>
          <div className="chart-wrap" style={{ minHeight: '180px' }}><canvas ref={regionRef} /></div>
        </div>

        <div className="cmp-chart-card">
          <div className="chart-title">Price Tier Shift</div>
          <div className="chart-subtitle">How price distribution changed</div>
          <div className="chart-wrap" style={{ minHeight: '180px' }}><canvas ref={priceRef} /></div>
        </div>

        <div className="cmp-chart-card" style={{ flex: 2, minWidth: '340px' }}>
          <div className="chart-title">Biggest Movers</div>
          <div className="chart-subtitle">Restaurants with the largest rank changes</div>
          <div className="chart-wrap" style={{ minHeight: '280px' }}><canvas ref={moversRef} /></div>
        </div>
      </div>

      {dropped.length > 0 && (
        <div className="cmp-dropped">
          <div className="cmp-dropped-title">Not returning in 2026 ({dropped.length})</div>
          <div className="cmp-dropped-list">
            {dropped.map(r => (
              <span key={r.slug} className="cmp-dropped-item">
                #{r.rank} {r.name} <span style={{ color: '#555' }}>({r.city})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
