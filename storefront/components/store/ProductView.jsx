'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/config';
import { useStore } from './StoreProvider';
import { BuyBox } from './Overlays';
import { ProductCard } from './Shop';
import { GemIcon, LotusIcon, ShieldIcon, StoreIcon, TruckIcon } from './Icons';

/* The full product page: the gallery on the left, the buy box on the right (the quick view, larger),
   the weaver who sells it, and more pieces from the same weaver. */
export default function ProductView({ product: p }) {
  const { catalog } = useStore();
  const [img, setImg] = useState(0);
  const more = catalog.filter((x) => x.id !== p.id && x.seller?.handle && x.seller.handle === p.seller?.handle).slice(0, 4);
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

  return (
    <div className="pdp">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/shop">Shop</Link><span>/</span><em>{p.name}</em>
      </nav>
      <div className="pdp__grid">
        <div className="pdp__gallery">
          <div className="pdp__main">
            <img src={p.images[img]} alt={p.name} key={img} />
            {off > 0 && <span className="card__tag card__tag--sale">{off}% off</span>}
          </div>
          {p.images.length > 1 && (
            <div className="pdp__thumbs">
              {p.images.map((src, i) => (
                <button type="button" key={src} className={i === img ? 'is-active' : ''} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pdp__info qv__info">
          <p className="eyebrow eyebrow--dark">{p.collection}</p>
          <h1 className="qv__name">{p.name}</h1>
          <p className="card__price qv__price">
            {formatINR(p.price)}{p.compareAt && <s>{formatINR(p.compareAt)}</s>}
            <span className="pdp__tax">Inclusive of all taxes</span>
          </p>
          {p.seller && (
            <p className="qv__seller">
              <StoreIcon size={16} /> Sold by <Link href={`/sellers/${p.seller.handle}`}>{p.seller.name}</Link>
            </p>
          )}
          <p className="qv__desc">{p.description}</p>
          <BuyBox p={p} />
          <ul className="qv__details">{p.details.map((d) => <li key={d}>{d}</li>)}</ul>
          <ul className="pdp__promises">
            <li><TruckIcon size={20} /> Free standard delivery across India</li>
            <li><ShieldIcon size={20} /> Packed with care, tracked to you</li>
            <li><LotusIcon size={20} /> Woven by master weavers</li>
            <li><GemIcon size={20} /> Pure silks, checked by hand</li>
          </ul>
        </div>
      </div>

      {more.length > 0 && (
        <section className="shop pdp__more">
          <header className="head" data-reveal>
            <p className="eyebrow">From the same loom</p>
            <h2 className="title">More from {p.seller.name}</h2>
            <span className="divider" aria-hidden="true"><i /></span>
          </header>
          <div className="grid">
            {more.map((x, i) => <ProductCard key={x.id} product={x} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
