export default function InfoBar() {
  return (
    <div className="info-bar">
      <span>
        Built with{' '}
        <a href="https://react.dev" target="_blank" rel="noreferrer">React</a>,{' '}
        <a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a> maps,{' '}
        <a href="https://www.chartjs.org" target="_blank" rel="noreferrer">Chart.js</a> visualizations, and{' '}
        <a href="https://gradient.ai" target="_blank" rel="noreferrer">Gradient AI</a>{' '}
        (<a href="https://www.anthropic.com/claude/opus" target="_blank" rel="noreferrer">Claude Opus 4</a>) for the data Q&amp;A.
        Data sourced from the{' '}
        <a href="https://www.sfchronicle.com" target="_blank" rel="noreferrer">SF Chronicle</a>{' '}
        via schema.org JSON-LD and Gatsby JS bundles.
        Hosted on{' '}
        <a href="https://www.digitalocean.com/products/app-platform" target="_blank" rel="noreferrer">DigitalOcean</a>.
        &nbsp;·&nbsp;
        Data:{' '}
        <a href="/data.html?year=2026">2026</a>,{' '}
        <a href="/data.html?year=2025">2025</a>,{' '}
        <a href="/data.html?year=2024">2024</a>
      </span>
    </div>
  );
}
