import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PRODUCTS } from './data';

/* Bag and wishlist, kept in this browser's localStorage so they survive a reload. */
const CART_KEY = 'sindhooram-bag';
const WISH_KEY = 'sindhooram-wishlist';
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ } };

const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const lineKey = (id, size) => `${id}|${size || ''}`;

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  // lines: [{ key, id, size, qty }] — products that left the catalogue are dropped on load
  const [lines, setLines] = useState(() => load(CART_KEY, []).filter((l) => byId[l.id]));
  const [wishlist, setWishlist] = useState(() => load(WISH_KEY, []).filter((id) => byId[id]));
  const [bagOpen, setBagOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);

  useEffect(() => save(CART_KEY, lines), [lines]);
  useEffect(() => save(WISH_KEY, wishlist), [wishlist]);

  const add = useCallback((id, size, qty = 1) => {
    const key = lineKey(id, size);
    setLines((ls) => (ls.some((l) => l.key === key)
      ? ls.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
      : [...ls, { key, id, size, qty }]));
    setBagOpen(true);
  }, []);
  const setQty = useCallback((key, qty) => {
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, qty } : l))));
  }, []);
  const toggleWish = useCallback((id) => {
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  }, []);

  const value = useMemo(() => {
    const items = lines.map((l) => ({ ...l, product: byId[l.id] }));
    return {
      items,
      count: items.reduce((s, l) => s + l.qty, 0),
      subtotal: items.reduce((s, l) => s + l.qty * l.product.price, 0),
      add, setQty,
      wishlist, toggleWish,
      bagOpen, setBagOpen,
      quickView, openQuickView: setQuickView,
    };
  }, [lines, add, setQty, wishlist, toggleWish, bagOpen, quickView]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export const useStore = () => useContext(StoreContext);
