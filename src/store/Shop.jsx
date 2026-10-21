import { useMemo } from 'react';
import { PRODUCTS, SHOW_DRESSES, formatINR } from './data';
import { useStore } from './cart';
import { EyeIcon, HeartIcon } from './Icons';
import { Echo } from './Motion';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'saree', label: 'Sarees' },
  { id: 'red', label: 'Sindoor Red' },
  { id: 'dress', label: 'Dresses' },
  { id: 'new', label: 'New In' },
  { id: 'wishlist', label: 'Wishlist' },
].filter((f) => SHOW_DRESSES || f.id !== 'dress');

export function ProductCard({ product, index = 0 }) {
  const { wishlist, toggleWish, openQuickView, add } = useStore();
  const wished = wishlist.includes(product.id);
  const off = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  return (
    <article className="card" data-reveal style={{ '--d': `${(index % 4) * 0.07}s` }}>
      <div className="card__media">
        <button type="button" className="card__open" onClick={() => openQuickView(product)} aria-label={`Quick view ${product.name}`}>
          <img src={product.images[0]} alt={product.name} loading="lazy" />
          {product.images[1] && <img src={product.images[1]} alt="" loading="lazy" className="card__alt" />}
        </button>
        {(product.tag || off > 0) && (
          <span className={`card__tag${off ? ' card__tag--sale' : ''}`}>{off ? `${off}% off` : product.tag}</span>
        )}
        <button type="button" className={`card__wish${wished ? ' is-on' : ''}`} onClick={() => toggleWish(product.id)}
          aria-pressed={wished} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}>
          <HeartIcon size={18} filled={wished} />
        </button>
        <div className="card__actions">
          <button type="button" onClick={() => openQuickView(product)}><EyeIcon size={16} /> Quick view</button>
          {product.type === 'saree'
            ? <button type="button" onClick={() => add(product.id)}>Add to bag</button>
            : <button type="button" onClick={() => openQuickView(product)}>Choose size</button>}
        </div>
      </div>
      <div className="card__body">
        <p className="card__collection">{product.collection}</p>
        <h3 className="card__name">{product.name}</h3>
        <p className="card__price">
          {formatINR(product.price)}
          {product.compareAt && <s>{formatINR(product.compareAt)}</s>}
        </p>
      </div>
    </article>
  );
}

export default function Shop({ filter, setFilter }) {
  const { wishlist } = useStore();
  const list = useMemo(() => {
    if (filter === 'saree' || filter === 'dress') return PRODUCTS.filter((p) => p.type === filter);
    if (filter === 'red') return PRODUCTS.filter((p) => p.red);
    if (filter === 'new') return PRODUCTS.filter((p) => p.tag === 'New' || p.tag === 'Handmade' || p.tag === 'Bridal');
    if (filter === 'wishlist') return PRODUCTS.filter((p) => wishlist.includes(p.id));
    return PRODUCTS;
  }, [filter, wishlist]);

  return (
    <section className="shop" id="shop">
      <header className="head" data-reveal>
        <p className="eyebrow">The Sindhooram edit</p>
        <Echo className="title">Shop the Collection</Echo>
        <span className="divider" aria-hidden="true"><i /></span>
      </header>
      <div className="tabs" role="tablist" aria-label="Filter products">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id}
            className={`tab${filter === f.id ? ' is-active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
            {f.id === 'wishlist' && wishlist.length > 0 && <sup>{wishlist.length}</sup>}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid" key={filter}>
          {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      ) : (
        <p className="empty">
          {filter === 'wishlist' ? 'Your wishlist is empty. Tap the heart on any piece to keep it here.' : 'Nothing here yet.'}
        </p>
      )}
    </section>
  );
}
