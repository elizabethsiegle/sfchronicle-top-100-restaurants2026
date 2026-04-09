import { useMemo } from 'react';

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className="cmp-stat">
      <div className="cmp-stat-value" style={highlight ? { color: highlight } : {}}>{value}</div>
      <div className="cmp-stat-label">{label}</div>
      {sub && <div className="cmp-stat-sub">{sub}</div>}
    </div>
  );
}

function RankBadge({ rank, year }) {
  if (!rank) return <span className="survival-badge survival-miss">not listed</span>;
  const color = rank <= 10 ? '#c9a84c' : rank <= 25 ? '#4a7c59' : '#555';
  return <span className="survival-badge survival-hit" style={{ color }}>#{rank} in {year}</span>;
}

export default function Comparison2024Section({ restaurants2024, survivalData }) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const enriched = useMemo(() => {
    const lookups = survivalData.map(({ year, data }) => ({
      year,
      byName: new Map(data.map(r => [norm(r.name), r.rank])),
    }));

    return restaurants2024.map(r => ({
      ...r,
      survival: lookups.map(({ year, byName }) => ({ year, rank: byName.get(norm(r.name)) ?? null })),
    }));
  }, [restaurants2024, survivalData]);

  const counts = survivalData.map(({ year }) => ({
    year,
    count: enriched.filter(r => r.survival.find(s => s.year === year)?.rank != null).length,
  }));

  return (
    <div className="comparison-section">
      <div className="comparison-header">
        <span className="comparison-title">List Survival · Fall 2024 → 2025 → 2026</span>
        <span className="comparison-sub">Which of the 2024 top 25 made subsequent lists?</span>
      </div>

      <div className="cmp-stats-row">
        <StatCard label="2024 restaurants" value={restaurants2024.length} sub="in this list" highlight="#c9a84c" />
        {counts.map(({ year, count }) => (
          <StatCard
            key={year}
            label={`On ${year} top 100`}
            value={`${count}/25`}
            sub={`${Math.round(count / 25 * 100)}% retention`}
            highlight={count >= 18 ? '#4a7c59' : count >= 12 ? '#c9a84c' : '#8b1a1a'}
          />
        ))}
        <StatCard
          label="On all lists"
          value={enriched.filter(r => r.survival.every(s => s.rank != null)).length}
          sub="consistent favorites"
          highlight="#4a7c59"
        />
      </div>

      <div className="survival-grid">
        {enriched.map(r => (
          <div key={r.slug} className="survival-row">
            <div className="survival-name">
              <span className="survival-rank-num">{r.rank}</span>
              {r.name}
              <span className="survival-city">{r.city}</span>
            </div>
            <div className="survival-badges">
              {r.survival.map(s => <RankBadge key={s.year} rank={s.rank} year={s.year} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
