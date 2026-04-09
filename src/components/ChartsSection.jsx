import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const CHART_COLORS = [
  '#c9a84c','#8b1a1a','#4a7c59','#2c5f8a','#7a4f8a',
  '#c96c2c','#3a8a7a','#8a7a2c','#6c2c8a','#2c8a4a',
  '#a84c4c','#4c6ca8','#a8844c','#4ca880','#a84c84',
];

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function countBy(data, key) {
  return data.reduce((acc, r) => {
    const v = r[key] || 'Unknown';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}

function ChartCard({ title, subtitle, noteId, children }) {
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <div className="chart-subtitle">{subtitle}</div>
      {children}
      <div className="chart-note" id={noteId} />
    </div>
  );
}

export default function ChartsSection({ baseData, chartFilter, onChartFilterChange }) {
  const regionRef  = useRef(null);
  const priceRef   = useRef(null);
  const cuisineRef = useRef(null);
  const charts     = useRef({});

  // Keep a stable ref to the callback so chart onClick closures don't go stale
  const onFilterRef = useRef(onChartFilterChange);
  useEffect(() => { onFilterRef.current = onChartFilterChange; });

  useEffect(() => {
    const total       = baseData.length;
    const activeField = chartFilter?.field ?? null;
    const activeValue = chartFilter?.value ?? null;

    function toggle(field, value) {
      onFilterRef.current(field, value);
    }

    function segColors(labels, baseColors, field) {
      if (!activeField || activeField !== field) return [...baseColors];
      return labels.map((lbl, i) =>
        lbl === activeValue ? baseColors[i] : hexAlpha(baseColors[i], 0.25)
      );
    }

    function donutClick(field, labels) {
      return (evt, elements) => {
        if (!elements.length) return;
        toggle(field, labels[elements[0].index]);
      };
    }

    function legendClick(field) {
      return (evt, item, legend) => toggle(field, legend.chart.data.labels[item.index]);
    }

    function legendLabels(chart, field) {
      return chart.data.labels.map((label, i) => ({
        text:        field === 'price' ? `${label} — ${chart.data.datasets[0].data[i]}` : label,
        fillStyle:   chart.data.datasets[0].backgroundColor[i],
        strokeStyle: '#111',
        lineWidth:   2,
        index:       i,
        fontColor:   (!activeField || activeField !== field || label === activeValue) ? '#ccc' : '#555',
        fontStyle:   (activeField === field && label === activeValue) ? 'bold' : 'normal',
      }));
    }

    // ── Region donut ────────────────────────────────────────────────────────
    const regionCounts     = countBy(baseData, 'location');
    const regionLabels     = Object.keys(regionCounts).sort((a, b) => regionCounts[b] - regionCounts[a]);
    const regionBaseColors = regionLabels.map((_, i) => CHART_COLORS[i]);

    charts.current.region?.destroy();
    charts.current.region = new Chart(regionRef.current, {
      type: 'doughnut',
      data: {
        labels: regionLabels,
        datasets: [{ data: regionLabels.map(k => regionCounts[k]), backgroundColor: segColors(regionLabels, regionBaseColors, 'location'), borderColor: '#111', borderWidth: 2, hoverOffset: 8 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        onClick: donutClick('location', regionLabels),
        plugins: {
          legend: { position: 'right', onClick: legendClick('location'), labels: { color: '#ccc', font: { size: 11, family: 'Georgia' }, boxWidth: 12, padding: 8, generateLabels: chart => legendLabels(chart, 'location') } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed / total * 100)}%) — click to filter` } },
        },
      },
    });
    document.getElementById('note-region').textContent = activeField === 'location'
      ? `Filtered: ${activeValue} · ${regionCounts[activeValue] || 0} restaurants`
      : `${total} restaurants · SF leads with ${regionCounts['San Francisco'] || 0}`;

    // ── Price donut ─────────────────────────────────────────────────────────
    const priceCounts     = countBy(baseData, 'price');
    const priceOrder      = ['$', '$$', '$$$', '$$$$'];
    const priceLabels     = priceOrder.filter(p => priceCounts[p]);
    const priceColorMap   = { '$': '#4a7c59', '$$': '#2c5f8a', '$$$': '#c9a84c', '$$$$': '#8b1a1a' };
    const priceBaseColors = priceLabels.map(p => priceColorMap[p]);

    charts.current.price?.destroy();
    charts.current.price = new Chart(priceRef.current, {
      type: 'doughnut',
      data: {
        labels: priceLabels,
        datasets: [{ data: priceLabels.map(p => priceCounts[p]), backgroundColor: segColors(priceLabels, priceBaseColors, 'price'), borderColor: '#111', borderWidth: 2, hoverOffset: 8 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        onClick: donutClick('price', priceLabels),
        plugins: {
          legend: { position: 'right', onClick: legendClick('price'), labels: { color: '#ccc', font: { size: 12, family: 'Georgia' }, boxWidth: 12, padding: 8, generateLabels: chart => legendLabels(chart, 'price') } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} restaurants (${Math.round(ctx.parsed / total * 100)}%) — click to filter` } },
        },
      },
    });
    const modePrice = priceLabels[priceLabels.map(p => priceCounts[p]).indexOf(Math.max(...priceLabels.map(p => priceCounts[p])))];
    document.getElementById('note-price').textContent = activeField === 'price'
      ? `Filtered: ${activeValue} · ${priceCounts[activeValue] || 0} restaurants`
      : `Most common: ${modePrice} (${priceCounts[modePrice]} restaurants)`;

    // ── Cuisine bar ─────────────────────────────────────────────────────────
    const cuisineCounts     = countBy(baseData, 'cuisine');
    const cuisineEntries    = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const cuisineLabels     = cuisineEntries.map(([k]) => k);
    const cuisineVals       = cuisineEntries.map(([, v]) => v);
    const cuisineBaseColors = cuisineLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    const cuisineBgColors   = activeField === 'cuisine'
      ? cuisineLabels.map((lbl, i) => lbl === activeValue ? cuisineBaseColors[i] : hexAlpha(cuisineBaseColors[i], 0.2))
      : cuisineBaseColors;

    charts.current.cuisine?.destroy();
    charts.current.cuisine = new Chart(cuisineRef.current, {
      type: 'bar',
      data: {
        labels: cuisineLabels,
        datasets: [{ data: cuisineVals, backgroundColor: cuisineBgColors, borderRadius: 3, borderSkipped: false }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        onClick: (evt, elements) => {
          if (!elements.length) return;
          toggle('cuisine', cuisineLabels[elements[0].index]);
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} restaurants (${Math.round(ctx.parsed.x / total * 100)}%) — click to filter` } },
        },
        scales: {
          x: { grid: { color: '#222' }, ticks: { color: '#888', font: { size: 10 }, stepSize: 1 } },
          y: {
            grid: { display: false },
            ticks: {
              autoSkip: false,
              color: ctx => activeField === 'cuisine'
                ? (cuisineLabels[ctx.index] === activeValue ? '#c9a84c' : '#555')
                : '#bbb',
              font: ctx => ({
                size: 11, family: 'Georgia',
                weight: activeField === 'cuisine' && cuisineLabels[ctx.index] === activeValue ? 'bold' : 'normal',
              }),
            },
          },
        },
      },
    });
    document.getElementById('note-cuisine').textContent = activeField === 'cuisine'
      ? `Filtered: ${activeValue} · ${cuisineCounts[activeValue] || 0} restaurants`
      : `${Object.keys(cuisineCounts).length} cuisine types · click any bar to filter`;

    return () => {
      Object.values(charts.current).forEach(c => c?.destroy());
    };
  }, [baseData, chartFilter]);

  return (
    <div className="charts-section">
      <ChartCard title="By Region" subtitle="Where are the restaurants?" noteId="note-region">
        <div className="chart-wrap"><canvas ref={regionRef} /></div>
      </ChartCard>

      <ChartCard title="By Price" subtitle="How much will it cost?" noteId="note-price">
        <div className="chart-wrap"><canvas ref={priceRef} /></div>
      </ChartCard>

      <div className="chart-card" style={{ flex: 2, minWidth: '340px' }}>
        <div className="chart-title">By Cuisine</div>
        <div className="chart-subtitle">Top food types represented</div>
        <div className="chart-wrap" style={{ minHeight: '420px' }}><canvas ref={cuisineRef} /></div>
        <div className="chart-note" id="note-cuisine" />
      </div>
    </div>
  );
}
