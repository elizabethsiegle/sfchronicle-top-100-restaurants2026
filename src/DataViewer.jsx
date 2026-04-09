import { useState, useMemo } from 'react';
import { RESTAURANTS } from './data';
import { RESTAURANTS_2025 } from './data2025';
import { RESTAURANTS_2024 } from './data2024';

const DATASETS = {
  2026: { label: '2026 Top 100', data: RESTAURANTS,      filename: 'restaurants-2026.json' },
  2025: { label: '2025 Top 100', data: RESTAURANTS_2025, filename: 'restaurants-2025.json' },
  2024: { label: '2024 Top 25',  data: RESTAURANTS_2024, filename: 'restaurants-2024.json' },
};

const FIELDS = ['rank','name','city','location','cuisine','price','address','lat','lng','description','image','url','prev_rank'];

function highlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, match => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
        return `<span class="json-str">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
      if (/null/.test(match)) return `<span class="json-null">${match}</span>`;
      return `<span class="json-num">${match}</span>`;
    });
}

function download(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function DataViewer() {
  const params = new URLSearchParams(window.location.search);
  const initYear = Number(params.get('year')) || 2026;

  const [year,    setYear]    = useState(initYear);
  const [search,  setSearch]  = useState('');
  const [field,   setField]   = useState('');
  const [expand,  setExpand]  = useState(null); // index of expanded row

  const { data, filename } = DATASETS[year];
  const hasPrevRank = data.some(r => r.prev_rank !== null);

  const filtered = useMemo(() => {
    if (!search && !field) return data;
    const term = search.toLowerCase();
    return data.filter(r => {
      const val = field ? String(r[field] ?? '') : JSON.stringify(r);
      return val.toLowerCase().includes(term);
    });
  }, [data, search, field]);

  return (
    <div className="dv-page">
      <div className="dv-header">
        <div>
          <a href="/" className="dv-back">← Back to explorer</a>
          <h1 className="dv-title">Restaurant Data</h1>
          <p className="dv-sub">SF Chronicle Bay Area restaurant lists — open dataset</p>
        </div>
        <div className="dv-tabs">
          {Object.entries(DATASETS).map(([y, { label }]) => (
            <button
              key={y}
              className={`dv-tab${Number(y) === year ? ' active' : ''}`}
              onClick={() => { setYear(Number(y)); setExpand(null); setSearch(''); }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="dv-toolbar">
        <input
          className="dv-search"
          type="text"
          placeholder="Search within data..."
          value={search}
          onChange={e => { setSearch(e.target.value); setExpand(null); }}
        />
        <select className="dv-field-select" value={field} onChange={e => setField(e.target.value)}>
          <option value="">All fields</option>
          {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <span className="dv-count">{filtered.length} of {data.length} restaurants</span>
        <button className="dv-download" onClick={() => download(filtered, filename)}>
          ↓ Download JSON
        </button>
      </div>

      <div className="dv-table-wrap">
        <table className="dv-table">
          <thead>
            <tr>
              <th>Rank</th><th>Name</th><th>City</th><th>Cuisine</th><th>Price</th>
              {hasPrevRank && <th>Prev. Rank</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <>
                <tr
                  key={r.slug}
                  className={`dv-row${expand === i ? ' expanded' : ''}`}
                  onClick={() => setExpand(expand === i ? null : i)}
                >
                  <td className="dv-cell-rank">{r.rank}</td>
                  <td className="dv-cell-name">{r.name}</td>
                  <td>{r.city}</td>
                  <td>{r.cuisine}</td>
                  <td>{r.price}</td>
                  {hasPrevRank && <td>{r.prev_rank != null ? `was #${r.prev_rank}` : '—'}</td>}
                  <td className="dv-cell-toggle">{expand === i ? '▲' : '▼'}</td>
                </tr>
                {expand === i && (
                  <tr key={`${r.slug}-detail`} className="dv-detail-row">
                    <td colSpan={hasPrevRank ? 7 : 6}>
                      <pre
                        className="dv-json"
                        dangerouslySetInnerHTML={{ __html: highlight(JSON.stringify(r, null, 2)) }}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
