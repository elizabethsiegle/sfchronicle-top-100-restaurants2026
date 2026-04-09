import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { RESTAURANTS } from './data';
import { RESTAURANTS_2025 } from './data2025';
import { RESTAURANTS_2024 } from './data2024';

const DATASETS = {
  2026: { label: '2026 Top 100', data: RESTAURANTS,      filename: 'restaurants-2026.json' },
  2025: { label: '2025 Top 100', data: RESTAURANTS_2025, filename: 'restaurants-2025.json' },
  2024: { label: '2024 Top 25',  data: RESTAURANTS_2024, filename: 'restaurants-2024.json' },
};

const FIELDS = ['rank','name','city','location','cuisine','price','address','lat','lng','description','image','url','prev_rank'];

const DO_API_KEY = import.meta.env.VITE_DO_API_KEY;
const DO_API_URL = 'https://inference.do-ai.run/v1/chat/completions';

function buildSystemPrompt(data, year) {
  // Send a compact summary so we don't blow the context window
  const summary = data.map(r =>
    `#${r.rank} ${r.name} (${r.city}, ${r.cuisine}, ${r.price}${r.prev_rank != null ? `, was #${r.prev_rank}` : ''})`
  ).join('\n');
  return `You are a helpful assistant for the SF Chronicle ${year} Bay Area restaurant list. You have access to the following ${data.length} restaurants:\n\n${summary}\n\nAnswer questions concisely based on this data. You can reference ranks, cuisines, prices, cities, and rank changes.`;
}

async function askAI(messages, systemPrompt) {
  const res = await fetch(DO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DO_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'anthropic-claude-opus-4',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 512,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  const msg = json.choices[0].message;
  return msg.content || msg.reasoning_content;
}

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

function AiChat({ data, year }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const systemPrompt = useMemo(() => buildSystemPrompt(data, year), [data, year]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const reply = await askAI([...messages, userMsg], systemPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <span className="ai-chat-title">Ask AI about this data</span>
        <span className="ai-chat-sub">Powered by DigitalOcean Gradient AI · {data.length} restaurants in context</span>
      </div>
      <div className="ai-chat-input-row">
        <input
          className="ai-chat-input"
          type="text"
          placeholder="Ask a question about the data..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button className="ai-chat-send" onClick={send} disabled={loading || !input.trim()}>
          {loading ? '…' : 'Ask'}
        </button>
      </div>
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            Try: "Which restaurants moved up the most?" · "Best cheap eats in Oakland?" · "How many Italian restaurants?"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ai-msg-${m.role}`}>
            <span className="ai-msg-label">{m.role === 'user' ? 'You' : 'AI'}</span>
            <span className="ai-msg-text">{m.content}</span>
          </div>
        ))}
        {loading && (
          <div className="ai-msg ai-msg-assistant">
            <span className="ai-msg-label">AI</span>
            <span className="ai-msg-text ai-thinking">thinking…</span>
          </div>
        )}
        {error && <div className="ai-error">Error: {error}</div>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function DataViewer() {
  const params = new URLSearchParams(window.location.search);
  const initYear = Number(params.get('year')) || 2026;

  const [year,   setYear]   = useState(initYear);
  const [search, setSearch] = useState('');
  const [field,  setField]  = useState('');
  const [expand, setExpand] = useState(null);

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

      <div className="dv-body">
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
                <Fragment key={r.slug}>
                  <tr
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
                    <tr className="dv-detail-row">
                      <td colSpan={hasPrevRank ? 7 : 6}>
                        <pre
                          className="dv-json"
                          dangerouslySetInnerHTML={{ __html: highlight(JSON.stringify(r, null, 2)) }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <AiChat data={filtered} year={year} />
      </div>
    </div>
  );
}
