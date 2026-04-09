import { gmapsUrl, yelpUrl, googleReviewsUrl } from '../utils/urls';

function RankChangeBadge({ r, compact }) {
  if (r.prev_rank === null) return <span className="tag tag-new">NEW</span>;
  if (r.prev_rank > r.rank) return compact
    ? <span className="tag tag-up">▲{r.prev_rank - r.rank}</span>
    : <span className="tag tag-up">▲ was #{r.prev_rank}</span>;
  if (r.prev_rank < r.rank) return compact
    ? <span className="tag tag-down">▼{r.rank - r.prev_rank}</span>
    : <span className="tag tag-down">▼ was #{r.prev_rank}</span>;
  return null;
}

export default function RestaurantCard({ r, isActive, onFocus }) {
  return (
    <div
      className={`card${isActive ? ' active' : ''}`}
      id={`card-${r.slug}`}
      onClick={() => onFocus(r.slug)}
    >
      <div className="card-rank">
        <div className="rank-num">{r.rank}</div>
      </div>

      {r.image
        ? <img className="card-img" src={r.image} alt={r.name} loading="lazy" onError={e => { e.target.style.display = 'none'; }} />
        : <div className="card-img-placeholder">🍽</div>}

      <div className="card-body">
        <div className="card-name">{r.name}</div>
        <div className="card-meta">
          <span className="tag tag-cuisine">{r.cuisine}</span>
          <span className="tag tag-price">{r.price}</span>
          <RankChangeBadge r={r} compact />
          <span style={{ color: '#888' }}>· {r.city}</span>
        </div>
        <div className="card-actions">
          <a className="action-btn btn-maps" href={gmapsUrl(r)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>📍 Maps</a>
          <a className="action-btn btn-yelp" href={yelpUrl(r)}  target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>★ Yelp</a>
          <a className="action-btn" style={{ background: '#e8e8e8', color: '#333' }} href={googleReviewsUrl(r)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>G ★ Reviews</a>
        </div>
      </div>
    </div>
  );
}
