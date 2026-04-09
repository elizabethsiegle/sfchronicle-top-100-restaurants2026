export default function InfoBar() {
  return (
    <div className="info-bar">
      <span>
        An interactive explorer built with{' '}
        <a href="https://react.dev" target="_blank" rel="noreferrer">React</a>,{' '}
        <a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a> maps,{' '}
        <a href="https://www.chartjs.org" target="_blank" rel="noreferrer">Chart.js</a> visualizations,
        and a{' '}
        <a href="https://www.gradient.ai" target="_blank" rel="noreferrer">Gradient AI</a> chatbot trained on the SF Chronicle articles.
        Restaurant data sourced from the{' '}
        <a href="https://www.sfchronicle.com" target="_blank" rel="noreferrer">San Francisco Chronicle</a>.
        Hosted on{' '}
        <a href="https://www.digitalocean.com/products/app-platform" target="_blank" rel="noreferrer">DigitalOcean App Platform</a>.
      </span>
    </div>
  );
}
