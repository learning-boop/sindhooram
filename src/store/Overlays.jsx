import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { DRESS_SIZES, PRODUCTS, SHOW_DRESSES, formatINR } from './data';
import { useStore } from './cart';
import { CloseIcon, HeartIcon, MinusIcon, PlusIcon, SearchIcon, WhatsAppIcon } from './Icons';

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

function Qty({ value, onChange, label }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Fewer"><MinusIcon size={14} /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="More"><PlusIcon size={14} /></button>
    </div>
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
  const { add, wishlist, toggleWish } = useStore();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [warn, setWarn] = useState(false);

  const needsSize = p.type === 'dress';
  const wished = wishlist.includes(p.id);
  const submit = () => {
    if (needsSize && !size) { setWarn(true); return; }
    add(p.id, size, qty);
    close();
  };

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
          <p className="qv__desc">{p.description}</p>
          {needsSize ? (
            <fieldset className="sizes">
              <legend>Size {warn && <em>Please choose a size</em>}</legend>
              {DRESS_SIZES.map((s) => (
                <button type="button" key={s} className={size === s ? 'is-active' : ''} aria-pressed={size === s}
                  onClick={() => { setSize(s); setWarn(false); }}>{s}</button>
              ))}
            </fieldset>
          ) : (
            <p className="qv__note">Free size · blouse piece included</p>
          )}
          <div className="qv__buy">
            <Qty value={qty} onChange={(n) => setQty(Math.max(1, n))} label="Quantity" />
            <button type="button" className="btn btn--dark" onClick={submit}>Add to bag · {formatINR(p.price * qty)}</button>
            <button type="button" className={`icon-btn qv__wish${wished ? ' is-on' : ''}`} onClick={() => toggleWish(p.id)} aria-pressed={wished}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}>
              <HeartIcon filled={wished} />
            </button>
          </div>
          <ul className="qv__details">{p.details.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

export function Bag() {
  const { items, subtotal, setQty, bagOpen, setBagOpen } = useStore();
  const close = useCallback(() => setBagOpen(false), [setBagOpen]);
  useOverlay(bagOpen, close);
  const left = Math.max(0, CONFIG.freeShippingAbove - subtotal);
  const pct = Math.min(100, (subtotal / CONFIG.freeShippingAbove) * 100);

  const order = () => {
    const lines = items.map((l) => `• ${l.product.name}${l.size ? ` (${l.size})` : ''} × ${l.qty} — ${formatINR(l.product.price * l.qty)}`);
    const text = `Hello Sindhooram, I'd like to order:\n${lines.join('\n')}\n\nSubtotal: ${formatINR(subtotal)}`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <>
      <div className={`drawer-scrim${bagOpen ? ' is-open' : ''}`} onClick={close} />
      <aside className={`bag${bagOpen ? ' is-open' : ''}`} aria-label="Your bag" aria-hidden={!bagOpen}>
        <div className="bag__head">
          <h2>Your Bag</h2>
          <button className="icon-btn" type="button" onClick={close} aria-label="Close bag" tabIndex={bagOpen ? 0 : -1}><CloseIcon size={22} /></button>
        </div>
        {items.length > 0 && (
          <div className="ship">
            <p>{left > 0 ? <>You are <b>{formatINR(left)}</b> away from free shipping</> : <>Your order ships <b>free</b></>}</p>
            <div className="ship__bar"><span style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        <div className="bag__items">
          {items.length === 0 && <p className="empty">Your bag is empty.</p>}
          {items.map((l) => (
            <div className="line" key={l.key}>
              <img src={l.product.images[0]} alt="" />
              <div className="line__info">
                <p className="line__name">{l.product.name}</p>
                <p className="line__meta">{l.size ? `Size ${l.size}` : l.product.collection}</p>
                <Qty value={l.qty} onChange={(n) => setQty(l.key, n)} label={`Quantity of ${l.product.name}`} />
              </div>
              <div className="line__end">
                <p>{formatINR(l.product.price * l.qty)}</p>
                <button type="button" className="line__remove" onClick={() => setQty(l.key, 0)} tabIndex={bagOpen ? 0 : -1}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="bag__foot">
            <p className="bag__total"><span>Subtotal</span><b>{formatINR(subtotal)}</b></p>
            <p className="bag__fine">Shipping and taxes are worked out at checkout.</p>
            <button type="button" className="btn btn--dark btn--block" onClick={order} disabled={!CONFIG.whatsapp} tabIndex={bagOpen ? 0 : -1}>
              <WhatsAppIcon size={18} /> {CONFIG.whatsapp ? 'Order on WhatsApp' : 'Checkout opens soon'}
            </button>
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
  const { openQuickView } = useStore();
  const [q, setQ] = useState('');
  const input = useRef(null);
  useEffect(() => { const id = setTimeout(() => input.current?.focus(), 60); return () => clearTimeout(id); }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return PRODUCTS.filter((p) => `${p.name} ${p.collection} ${p.type} ${p.description}`.toLowerCase().includes(t));
  }, [q]);

  return (
    <div className="modal modal--top" role="dialog" aria-modal="true" aria-label="Search">
      <div className="modal__scrim" onClick={onClose} />
      <div className="search">
        <label className="search__field">
          <SearchIcon size={22} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={SHOW_DRESSES ? 'Search sarees, dresses, weaves…' : 'Search sarees, weaves, colours…'} aria-label="Search products" />
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close search"><CloseIcon size={20} /></button>
        </label>
        {q && (
          <div className="search__results">
            {results.length === 0 && <p className="empty">No matches for “{q}”.</p>}
            {results.map((p) => (
              <button type="button" key={p.id} className="hit" onClick={() => { onClose(); openQuickView(p); }}>
                <img src={p.images[0]} alt="" />
                <span><strong>{p.name}</strong><em>{p.collection}</em></span>
                <b>{formatINR(p.price)}</b>
              </button>
            ))}
          </div>
        )}
        {!q && (
          <div className="search__chips">
            {(SHOW_DRESSES ? ['Kanjeevaram', 'Banarasi', 'Bridal', 'Anarkali', 'Kurta'] : ['Kanjeevaram', 'Banarasi', 'Bridal', 'Maroon', 'Ivory']).map((s) => (
              <button type="button" key={s} onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
