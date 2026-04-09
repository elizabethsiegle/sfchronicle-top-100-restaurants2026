export default function Footer({ otherYears }) {
  if (!otherYears?.length) return null;
  return (
    <div className="year-footer">
      {otherYears.map(({ year, path }, i) => (
        <span key={year}>
          {i > 0 && ' · '}
          <a href={path}>← {year} SF Chronicle Top Best Restaurants</a>
        </span>
      ))}
    </div>
  );
}
