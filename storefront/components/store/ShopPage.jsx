'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import {
  HIGHLIGHTS, PRICE_BUCKETS, SORTS, activeCount, applyFilters, facetOptions, readFilters, writeFilters,
} from '@/lib/shop-filters';
import { useStore } from './StoreProvider';
import { ProductCard } from './Shop';
import { CloseIcon, SearchIcon } from './Icons';

const FACETS = [
  { key: 'weave', title: 'Weave' },
  { key: 'price', title: 'Price' },
  { key: 'vendor', title: 'Weaver' },
  { key: 'show', title: 'Highlights' },
];

/* Every piece on Sindhooram with filters (weave, price, weaver, highlights, in stock), search and sort.
   The filters live in the address bar, so a filtered view can be shared or bookmarked. */
export default function ShopPage() {
  const { catalog, wishlist } = useStore();
  const pathname = usePathname();
  // The filters as a query string. Changing one updates the page at once and rewrites the address
  // (history.replaceState, no reload); arriving with a new address (menu link, back button) resets them.
  const paramStr = useSearchParams().toString();
  const [qs, setQs] = useState(paramStr);
  useEffect(() => { setQs(paramStr); }, [paramStr]);
  const f = useMemo(() => readFilters(new URLSearchParams(qs)), [qs]);
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState(f.q);
  const typing = useRef(null);

  const base = useMemo(() => (CONFIG.showDresses ? catalog : catalog.filter((p) => p.type !== 'dress')), [catalog]);
  const results = useMemo(() => applyFilters(base, f, wishlist), [base, f, wishlist]);
  const options = useMemo(() => facetOptions(base, f, wishlist), [base, f, wishlist]);
  const weavers = useMemo(() => new Set(results.map((p) => p.seller?.handle).filter(Boolean)).size, [results]);

  const update = (next) => {
    const nextQs = writeFilters({ ...f, ...next });
    setQs(nextQs);
    window.history.replaceState(null, '', nextQs ? `${pathname}?${nextQs}` : pathname);
  };
  const toggle = (key, id) => {
    const set = new Set(f[key]);
    if (set.has(id)) set.delete(id); else set.add(id);
    update({ [key]: set });
  };
  const clearAll = () => { setQ(''); update({ weave: new Set(), vendor: new Set(), price: new Set(), show: new Set(), stock: false, q: '' }); };

  // search as you type, written to the address bar a moment after the last key
  useEffect(() => { setQ(f.q); }, [f.q]);
  const onSearch = (value) => {
    setQ(value);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => update({ q: value.trim() }), 250);
  };
  useEffect(() => () => clearTimeout(typing.current), []);

  // the filter drawer on phones: close with Escape, no page scroll behind it
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [drawer]);

  const chips = [
    ...FACETS.flatMap(({ key }) => [...f[key]].map((id) => ({
      key, id, label: options[key].find((o) => o.id === id)?.label || labelFor(key, id),
    }))),
    ...(f.stock ? [{ key: 'stock', id: '1', label: 'In stock' }] : []),
    ...(f.q ? [{ key: 'q', id: f.q, label: `“${f.q}”` }] : []),
  ];
  const removeChip = (c) => {
    if (c.key === 'stock') update({ stock: false });
    else if (c.key === 'q') { setQ(''); update({ q: '' }); }
    else toggle(c.key, c.id);
  };

  const n = activeCount(f);

  return (
    <div className="page shoppage">
      <header className="page__head shoppage__head">
        <p className="eyebrow">The Sindhooram edit</p>
        <h1 className="page__title">{titleFor(f, options)}</h1>
        <p className="page__line">
          {catalog.length
            ? `${results.length} ${results.length === 1 ? 'piece' : 'pieces'}${weavers ? ` from ${weavers} ${weavers === 1 ? 'weaver' : 'weavers'}` : ''}`
            : 'The collection is loading. Please check back in a moment.'}
        </p>
      </header>

      <div className="shoppage__bar">
        <label className="shoppage__search">
          <SearchIcon size={18} />
          <span className="sr-only">Search the shop</span>
          <input type="search" value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Search sarees, weaves, weavers" />
        </label>
        <button type="button" className="btn btn--line shoppage__filters-btn" onClick={() => setDrawer(true)} aria-expanded={drawer} aria-controls="shop-filters">
          Filters{n ? ` (${n})` : ''}
        </button>
        <label className="shoppage__sort">
          <span>Sort</span>
          <select value={f.sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <div className="shoppage__chips" aria-label="Active filters">
          {chips.map((c) => (
            <button type="button" key={`${c.key}-${c.id}`} className="chip" onClick={() => removeChip(c)} aria-label={`Remove filter ${c.label}`}>
              {c.label} <CloseIcon size={13} />
            </button>
          ))}
          <button type="button" className="link-btn shoppage__clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      <div className="shoppage__body">
        <div className={`drawer-scrim shoppage__scrim${drawer ? ' is-open' : ''}`} onClick={() => setDrawer(false)} />
        <aside id="shop-filters" className={`facets${drawer ? ' is-open' : ''}`} aria-label="Filters">
          <div className="facets__head">
            <p>Filters</p>
            <button type="button" className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close filters"><CloseIcon /></button>
          </div>
          {FACETS.map(({ key, title }) => options[key].length > 0 && (
            <fieldset className="facet" key={key}>
              <legend>{title}</legend>
              {options[key].map((o) => {
                const on = f[key].has(o.id);
                return (
                  <label key={o.id} className={`facet__opt${!on && o.count === 0 ? ' is-empty' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(key, o.id)} disabled={!on && o.count === 0} />
                    <span>{o.label}</span>
                    <em>{o.count}</em>
                  </label>
                );
              })}
            </fieldset>
          ))}
          <fieldset className="facet">
            <legend>Availability</legend>
            <label className="facet__opt">
              <input type="checkbox" checked={f.stock} onChange={() => update({ stock: !f.stock })} />
              <span>In stock only</span>
              <em>{options.stock}</em>
            </label>
          </fieldset>
          <div className="facets__foot">
            {n > 0 && <button type="button" className="link-btn" onClick={clearAll}>Clear all</button>}
            <button type="button" className="btn btn--cream" onClick={() => setDrawer(false)}>
              Show {results.length} {results.length === 1 ? 'piece' : 'pieces'}
            </button>
          </div>
        </aside>

        <section className="shop shoppage__results" aria-label="Products">
          {results.length ? (
            <div className="grid">
              {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : catalog.length ? (
            <div className="shoppage__empty">
              <p className="empty">
                {f.show.has('wishlist') && !wishlist.length
                  ? 'Your wishlist is empty. Tap the heart on any piece to keep it here.'
                  : 'No pieces match these filters.'}
              </p>
              {n > 0 && <button type="button" className="btn btn--line" onClick={clearAll}>Clear filters</button>}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function labelFor(key, id) {
  if (key === 'price') return PRICE_BUCKETS.find((b) => b.id === id)?.label || id;
  if (key === 'show') return id === 'wishlist' ? 'My wishlist' : HIGHLIGHTS.find((h) => h.id === id)?.label || id;
  return id;
}

/* "Banarasi sarees", "Sarees by Kanchi Silk House", "The Sindoor Edit"… or "All sarees". */
function titleFor(f, options) {
  const noun = f.type === 'dress' ? 'dresses' : CONFIG.showDresses && f.type !== 'saree' ? 'pieces' : 'sarees';
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  const only = (key) => (f[key].size === 1 ? [...f[key]][0] : null);
  const others = (key) => ['weave', 'vendor', 'price', 'show'].filter((k) => k !== key).every((k) => !f[k].size);
  if (only('weave') && others('weave')) return `${options.weave.find((o) => o.id === only('weave'))?.label || 'Our'} ${noun}`;
  if (only('vendor') && others('vendor')) return `${Noun} by ${options.vendor.find((o) => o.id === only('vendor'))?.label || 'our weavers'}`;
  if (only('show') && others('show')) {
    const titles = { 'sindoor-red': 'The Sindoor Edit', new: 'New arrivals', bridal: 'The Bridal Edit', bestseller: 'Best sellers', handmade: 'Handmade', sale: 'On sale', wishlist: 'My wishlist' };
    return titles[only('show')] || `All ${noun}`;
  }
  return `All ${noun}`;
}
