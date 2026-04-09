export default function Header({ year, otherYears, articleUrl }) {
  return (
    <header>
      <div>
        <h1><span>Top {year === 2024 ? 25 : 100}</span> Best Restaurants · Bay Area {year} Explorer</h1>
        <div className="subtitle">San Francisco Chronicle · {year === 2026 ? 'Updated April 2026' : year === 2025 ? 'Updated April 2025' : 'Fall 2024'}</div>
      </div>
      <div className="header-right">
        {year === 2024 ? '25' : '100'} restaurants<br />
        <a href={articleUrl} target="_blank" rel="noreferrer">View original ↗</a>
        {otherYears?.map(({ year: y, path }) => (
          <span key={y}> · <a href={path}>{y} list</a></span>
        ))}
      </div>
    </header>
  );
}
