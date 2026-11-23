'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToBag, getBag, setLineQty } from '@/lib/actions/cart';
import { shopHref } from '@/lib/shop-filters';

/* Shared shop state: the catalogue (from the server), the bag (a cart on the backend),
   the wishlist (kept in this browser), the quick view, the shop filter and the signed-in customer. */
const WISH_KEY = 'sindhooram-wishlist';
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ } };

const StoreContext = createContext(null);

export function StoreProvider({ catalog, children }) {
  const router = useRouter();
  const [bag, setBag] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [filter, setFilter] = useState('all');
  const wishLoaded = useRef(false);

  const byHandle = useMemo(() => Object.fromEntries(catalog.map((p) => [p.handle, p])), [catalog]);

  useEffect(() => {
    setWishlist(load(WISH_KEY, []));
    wishLoaded.current = true;
    getBag().then((b) => setBag(b)).catch(() => {});
  }, []);
  useEffect(() => { if (wishLoaded.current) save(WISH_KEY, wishlist); }, [wishlist]);

  const refreshBag = useCallback(async () => setBag(await getBag()), []);

  const add = useCallback(async (offerId, qty = 1) => {
    setBagOpen(true);
    setBusy(true);
    setNotice('');
    const res = await addToBag(offerId, qty);
    if (res?.bag !== undefined) setBag(res.bag);
    if (res?.error) setNotice(res.error);
    setBusy(false);
  }, []);

  const setQty = useCallback(async (lineId, qty) => {
    setBusy(true);
    setNotice('');
    // show the change straight away, then settle on what the backend says
    setBag((b) => (b ? { ...b, items: b.items.map((l) => (l.lineId === lineId ? { ...l, qty: Math.max(0, qty) } : l)).filter((l) => l.qty > 0) } : b));
    const res = await setLineQty(lineId, qty);
    if (res?.bag !== undefined) setBag(res.bag);
    if (res?.error) setNotice(res.error);
    setBusy(false);
  }, []);

  const toggleWish = useCallback((id) => {
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  }, []);

  /* Open the shop page on a filter: shop('new'), shop('red'), or a query such as shop('?weave=banarasi'). */
  const shop = useCallback((target = 'all') => {
    setQuickView(null);
    router.push(shopHref(target));
  }, [router]);

  const value = useMemo(() => {
    const items = bag?.items || [];
    return {
      catalog,
      byHandle,
      bag,
      items,
      count: items.reduce((s, l) => s + l.qty, 0),
      subtotal: items.reduce((s, l) => s + l.unitPrice * l.qty, 0),
      busy,
      notice,
      setNotice,
      add,
      setQty,
      refreshBag,
      wishlist,
      toggleWish,
      bagOpen,
      setBagOpen,
      quickView,
      openQuickView: setQuickView,
      filter,
      setFilter,
      shop,
    };
  }, [catalog, byHandle, bag, busy, notice, add, setQty, refreshBag, wishlist, toggleWish, bagOpen, quickView, filter, shop]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
