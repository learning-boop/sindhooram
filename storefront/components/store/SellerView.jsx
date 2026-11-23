'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONFIG } from '@/lib/config';
import { ProductCard } from './Shop';
import { LotusIcon } from './Icons';

/* A weaver's shop on Sindhooram: their banner, story and every piece they sell here. */
export default function SellerView({ seller, products }) {
  const [logoOk, setLogoOk] = useState(true);
  const initials = seller.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const visible = CONFIG.showDresses ? products : products.filter((p) => p.type !== 'dress');
  return (
    <div className="vendor">
      <section className="vendor__hero">
        {seller.banner && <img className="vendor__banner" src={seller.banner} alt="" />}
        <div className="vendor__shade" />
        <div className="vendor__copy" data-reveal>
          {seller.logo && logoOk
            ? <img className="vendor__logo" src={seller.logo} alt="" width="84" height="84" onError={() => setLogoOk(false)} />
            : <span className="vendor__logo vendor__logo--text" aria-hidden="true">{initials}</span>}
          <p className="eyebrow">Weaver on Sindhooram</p>
          <h1 className="title">{seller.name}</h1>
          {seller.description && <p className="vendor__line">{seller.description}</p>}
        </div>
      </section>
      <section className="shop vendor__shop">
        <header className="head" data-reveal>
          <p className="eyebrow">{visible.length} {visible.length === 1 ? 'piece' : 'pieces'}</p>
          <h2 className="title title--ink">From the loom of {seller.name}</h2>
          <span className="divider" aria-hidden="true"><i /></span>
        </header>
        {visible.length ? (
          <div className="grid">
            {visible.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          <p className="empty">New pieces from this weaver are on their way.</p>
        )}
        <p className="vendor__foot"><LotusIcon size={20} /> Every piece ships directly from the weaver. <Link href="/shop">Browse all weavers</Link></p>
      </section>
    </div>
  );
}
