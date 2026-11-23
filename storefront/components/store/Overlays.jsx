'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CONFIG, formatINR } from '@/lib/config';
import { useStore } from './StoreProvider';
import { CloseIcon, HeartIcon, MinusIcon, PlusIcon, SearchIcon, StoreIcon, WhatsAppIcon } from './Icons';

/* Closes on Escape and locks page scroll while an overlay is open. */
function useOverlay(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, onClose]);
}

export function Qty({ value, onChange, label, max }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Fewer"><MinusIcon size={14} /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="More" disabled={max !== undefined && value >= max}><PlusIcon size={14} /></button>
    </div>
  );
}

/* Size picker + quantity + add to bag; used by the quick view and the product page. */
export function BuyBox({ p, onAdded }) {
  const { add, wishlist, toggleWish } = useStore();
  const needsSize = p.variants.length > 1;
  const [variantId, setVariantId] = useState(needsSize ? null : p.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [warn, setWarn] = useState(false);
  const variant = p.variants.find((v) => v.id === variantId);
  const price = variant?.price ?? p.price;
  const stock = variant ? variant.stock : p.stock;
  const soldOut = variant ? variant.stock === 0 : !p.inStock;
  const wished = wishlist.includes(p.id);

  const submit = () => {
    if (needsSize && !variant) { setWarn(true); return; }
    add((variant || p.variants[0]).offerId, qty);
    onAdded?.();
  };

  return (
    <>
      {needsSize ? (
        <fieldset className="sizes">
          <legend>Size {warn && <em>Please choose a size</em>}</legend>
          {p.variants.map((v) => (
            <button type="button" key={v.id} className={variantId === v.id ? 'is-active' : ''} aria-pressed={variantId === v.id}
              disabled={v.stock === 0} onClick={() => { setVariantId(v.id); setWarn(false); }}>{v.title}</button>
          ))}
        </fieldset>
      ) : (
        <p className="qv__note">
          Free size · blouse piece included
          {stock !== null && stock > 0 && stock <= 5 && <b className="qv__stock"> · Only {stock} left</b>}
        </p>
      )}
      <div className="qv__buy">
        <Qty value={qty} onChange={(n) => setQty(Math.max(1, stock ? Math.min(n, stock) : n))} label="Quantity" max={stock || undefined} />
        <button type="button" className="btn btn--dark" onClick={submit} disabled={soldOut}>
          {soldOut ? 'Sold out' : <>Add to bag · {formatINR(price * qty)}</>}
        </button>
        <button type="button" className={`icon-btn qv__wish${wished ? ' is-on' : ''}`} onClick={() => toggleWish(p.id)} aria-pressed={wished}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
          <HeartIcon filled={wished} />
        </button>
      </div>
    </>
  );
}

/* Keyed by product, so each product opens on its first photo with no size and one piece. */
export function QuickView() {
  const { quickView: p, openQuickView } = useStore();
  const close = useCallback(() => openQuickView(null), [openQuickView]);
  useOverlay(!!p, close);
  return p ? <QuickViewPanel key={p.id} p={p} close={close} /> : null;
}

function QuickViewPanel({ p, close }) {
  const [img, setImg] = useState(0);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={p.name}>
      <div className="modal__scrim" onClick={close} />
      <div className="qv">
        <button className="icon-btn qv__close" type="button" onClick={close} aria-label="Close"><CloseIcon size={22} /></button>
        <div className="qv__gallery">
          <img src={p.images[img]} alt={p.name} key={img} />
          {p.images.length > 1 && <div className="qv__thumbs">
            {p.images.map((src, i) => (
              <button type="button" key={src} className={i === img ? 'is-active' : ''} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>}
        </div>
        <div className="qv__info">
          <p className="eyebrow eyebrow--dark">{p.collection}</p>
          <h2 className="qv__name">{p.name}</h2>
          <p className="card__price qv__price">
            {formatINR(p.price)}{p.compareAt && <s>{formatINR(p.compareAt)}</s>}
          </p>
          {p.seller && (
            <p className="qv__seller">
              <StoreIcon size={16} /> Sold by <Link href={`/sellers/${p.seller.handle}`} onClick={close}>{p.seller.name}</Link>
            </p>
          )}
          <p className="qv__desc">{p.description}</p>
          <BuyBox p={p} onAdded={close} />
          <ul className="qv__details">{p.details.map((d) => <li key={d}>{d}</li>)}</ul>
          <Link className="qv__more" href={`/products/${p.handle}`} onClick={close}>View full details</Link>
        </div>
      </div>
    </div>
  );
}

export function Bag() {
  const { items, subtotal, setQty, bagOpen, setBagOpen, busy, notice } = useStore();
  const router = useRouter();
  const close = useCallback(() => setBagOpen(false), [setBagOpen]);
  useOverlay(bagOpen, close);
  const threshold = Number(CONFIG.freeShippingAbove) || 0;
  const left = Math.max(0, threshold - subtotal);
  const pct = threshold ? Math.min(100, (subtotal / threshold) * 100) : 100;
  const vendors = new Set(items.map((l) => l.seller?.id).filter(Boolean)).size;

  const whatsapp = () => {
    const lines = items.map((l) => `• ${l.name}${l.variant ? ` (${l.variant})` : ''} × ${l.qty} — ${formatINR(l.unitPrice * l.qty)}`);
    const text = `Hello Sindhooram, I'd like to order:\n${lines.join('\n')}\n\nSubtotal: ${formatINR(subtotal)}`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const checkout = () => { close(); router.push('/checkout'); };

  return (
    <>
      <div className={`drawer-scrim${bagOpen ? ' is-open' : ''}`} onClick={close} />
      <aside className={`bag${bagOpen ? ' is-open' : ''}${busy ? ' is-busy' : ''}`} aria-label="Your bag" aria-hidden={!bagOpen} aria-busy={busy}>
        <div className="bag__head">
          <h2>Your Bag</h2>
          <button className="icon-btn" type="button" onClick={close} aria-label="Close bag" tabIndex={bagOpen ? 0 : -1}><CloseIcon size={22} /></button>
        </div>
        {items.length > 0 && (
          <div className="ship">
            {threshold > 0 ? (
              <>
                <p>{left > 0 ? <>You are <b>{formatINR(left)}</b> away from free shipping</> : <>Your order ships <b>free</b></>}</p>
                <div className="ship__bar"><span style={{ width: `${pct}%` }} /></div>
              </>
            ) : (
              <p>Standard delivery is <b>free</b> on every order</p>
            )}
          </div>
        )}
        {notice && <p className="bag__notice" role="alert">{notice}</p>}
        <div className="bag__items">
          {items.length === 0 && <p className="empty">{busy ? 'Adding to your bag…' : 'Your bag is empty.'}</p>}
          {items.map((l) => (
            <div className="line" key={l.key}>
              <img src={l.image} alt="" />
              <div className="line__info">
                <p className="line__name">{l.name}</p>
                <p className="line__meta">{l.variant ? `Size ${l.variant} · ` : ''}{l.seller ? `Sold by ${l.seller.name}` : ''}</p>
                <Qty value={l.qty} onChange={(n) => setQty(l.lineId, n)} label={`Quantity of ${l.name}`} />
              </div>
              <div className="line__end">
                <p>{formatINR(l.unitPrice * l.qty)}</p>
                <button type="button" className="line__remove" onClick={() => setQty(l.lineId, 0)} tabIndex={bagOpen ? 0 : -1}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="bag__foot">
            <p className="bag__total"><span>Subtotal</span><b>{formatINR(subtotal)}</b></p>
            <p className="bag__fine">
              {vendors > 1 ? `Your bag has pieces from ${vendors} weavers; each ships separately. ` : ''}
              Delivery is chosen at checkout.
            </p>
            <button type="button" className="btn btn--dark btn--block" onClick={checkout} disabled={busy} tabIndex={bagOpen ? 0 : -1}>
              Checkout
            </button>
            {CONFIG.whatsapp && (
              <button type="button" className="bag__alt" onClick={whatsapp} tabIndex={bagOpen ? 0 : -1}>
                <WhatsAppIcon size={16} /> Or order on WhatsApp
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

export function Search({ open, onClose }) {
  useOverlay(open, onClose);
  return open ? <SearchPanel onClose={onClose} /> : null;
}

function SearchPanel({ onClose }) {
  const { catalog, openQuickView } = useStore();
  const [q, setQ] = useState('');
  const input = useRef(null);
  useEffect(() => { const id = setTimeout(() => input.current?.focus(), 60); return () => clearTimeout(id); }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return catalog
      .filter((p) => CONFIG.showDresses || p.type !== 'dress')
      .filter((p) => `${p.name} ${p.collection} ${p.type} ${p.description} ${p.seller?.name || ''}`.toLowerCase().includes(t));
  }, [q, catalog]);

  return (
    <div className="modal modal--top" role="dialog" aria-modal="true" aria-label="Search">
      <div className="modal__scrim" onClick={onClose} />
      <div className="search">
        <label className="search__field">
          <SearchIcon size={22} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={CONFIG.showDresses ? 'Search sarees, dresses, weaves…' : 'Search sarees, weaves, colours…'} aria-label="Search products" />
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close search"><CloseIcon size={20} /></button>
        </label>
        {q && (
          <div className="search__results">
            {results.length === 0 && <p className="empty">No matches for “{q}”.</p>}
            {results.map((p) => (
              <button type="button" key={p.id} className="hit" onClick={() => { onClose(); openQuickView(p); }}>
                <img src={p.images[0]} alt="" />
                <span><strong>{p.name}</strong><em>{p.collection}{p.seller ? ` · ${p.seller.name}` : ''}</em></span>
                <b>{formatINR(p.price)}</b>
              </button>
            ))}
            <Link className="search__all" href={`/shop?q=${encodeURIComponent(q.trim())}`} onClick={onClose}>See all results in the shop</Link>
          </div>
        )}
        {!q && (
          <div className="search__chips">
            {(CONFIG.showDresses ? ['Kanjeevaram', 'Banarasi', 'Bridal', 'Anarkali', 'Kurta'] : ['Kanjeevaram', 'Banarasi', 'Bridal', 'Maroon', 'Ivory']).map((s) => (
              <button type="button" key={s} onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
