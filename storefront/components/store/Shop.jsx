'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CONFIG, formatINR } from '@/lib/config';
import { shopHref } from '@/lib/shop-filters';
import { useStore } from './StoreProvider';
import { ArrowIcon, EyeIcon, HeartIcon } from './Icons';
import { Echo } from './Motion';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'saree', label: 'Sarees' },
  { id: 'red', label: 'Sindoor Red' },
  { id: 'dress', label: 'Dresses' },
  { id: 'new', label: 'New In' },
  { id: 'wishlist', label: 'Wishlist' },
].filter((f) => CONFIG.showDresses || f.id !== 'dress');

const NEW_TAGS = ['New', 'Handmade', 'Bridal'];

export function filterProducts(list, filter, wishlist = []) {
  const visible = CONFIG.showDresses ? list : list.filter((p) => p.type !== 'dress');
  if (filter === 'saree' || filter === 'dress') return visible.filter((p) => p.type === filter);
  if (filter === 'red') return visible.filter((p) => p.red);
  if (filter === 'new') return visible.filter((p) => NEW_TAGS.includes(p.tag));
  if (filter === 'wishlist') return visible.filter((p) => wishlist.includes(p.id));
  return visible;
}

export function ProductCard({ product, index = 0 }) {
  const { wishlist, toggleWish, openQuickView, add } = useStore();
  const wished = wishlist.includes(product.id);
  const off = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const soldOut = !product.inStock;

  return (
    <article className="card" data-reveal style={{ '--d': `${(index % 4) * 0.07}s` }}>
      <div className="card__media">
        <button type="button" className="card__open" onClick={() => openQuickView(product)} aria-label={`Quick view ${product.name}`}>
          <img src={product.images[0]} alt={product.name} loading="lazy" />
          {product.images[1] && <img src={product.images[1]} alt="" loading="lazy" className="card__alt" />}
        </button>
        {soldOut ? (
          <span className="card__tag card__tag--out">Sold out</span>
        ) : (product.tag || off > 0) && (
          <span className={`card__tag${off ? ' card__tag--sale' : ''}`}>{off ? `${off}% off` : product.tag}</span>
        )}
        <button type="button" className={`card__wish${wished ? ' is-on' : ''}`} onClick={() => toggleWish(product.id)}
          aria-pressed={wished} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}>
          <HeartIcon size={18} filled={wished} />
        </button>
        <div className="card__actions">
          <button type="button" onClick={() => openQuickView(product)}><EyeIcon size={16} /> Quick view</button>
          {product.type === 'saree' && product.variants.length === 1
            ? <button type="button" onClick={() => add(product.offerId)} disabled={soldOut}>{soldOut ? 'Sold out' : 'Add to bag'}</button>
            : <button type="button" onClick={() => openQuickView(product)}>Choose size</button>}
        </div>
      </div>
      <div className="card__body">
        <p className="card__collection">{product.collection}</p>
        <h3 className="card__name"><Link href={`/products/${product.handle}`}>{product.name}</Link></h3>
        <p className="card__price">
          {formatINR(product.price)}
          {product.compareAt && <s>{formatINR(product.compareAt)}</s>}
        </p>
        {product.seller && <p className="card__seller">by {product.seller.name}</p>}
      </div>
    </article>
  );
}

export default function Shop() {
  const { catalog, wishlist, filter, setFilter } = useStore();
  const list = useMemo(() => filterProducts(catalog, filter, wishlist), [catalog, filter, wishlist]);

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
        <>
          <div className="grid" key={filter}>
            {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
          <div className="shop__more">
            <Link className="btn btn--line" href={shopHref(filter)}>Browse the full shop <ArrowIcon size={14} /></Link>
          </div>
        </>
      ) : (
        <p className="empty">
          {filter === 'wishlist'
            ? 'Your wishlist is empty. Tap the heart on any piece to keep it here.'
            : catalog.length ? 'Nothing here yet.' : 'The collection is loading. Please check back in a moment.'}
        </p>
      )}
    </section>
  );
}
