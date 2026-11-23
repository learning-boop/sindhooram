'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { StoreProvider } from './StoreProvider';
import Header from './Header';
import Footer from './Footer';
import { Bag, QuickView, Search } from './Overlays';

/* Reveal: anything marked data-reveal fades up the first time it enters the viewport.
   A MutationObserver picks up content added later (shop tabs, new pages after navigation).
   Parallax: elements marked data-parallax="0.12" drift against the scroll by that factor. */
function useScrollEffects(rootRef, reduced, pathname) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (reduced) {
      const showAll = () => root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    // A clip reveal starts fully clipped, which the observer counts as zero area, so its parent
    // is watched instead and reveals it.
    const owners = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        (owners.get(e.target) || [e.target]).forEach((el) => el.classList.add('is-in'));
        owners.delete(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const watch = () => root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => {
      if (el.dataset.reveal !== 'clip') { io.observe(el); return; }
      const parent = el.parentElement;
      const list = owners.get(parent) || [];
      if (!list.includes(el)) list.push(el);
      owners.set(parent, list);
      io.observe(parent);
    });
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(root, { childList: true, subtree: true });

    let raf = 0;
    const parallax = () => {
      raf = 0;
      const vh = window.innerHeight;
      root.querySelectorAll('[data-parallax]').forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const k = parseFloat(el.dataset.parallax) || 0;
        el.style.transform = `translate3d(0,${((r.top + r.height / 2 - vh / 2) * -k).toFixed(1)}px,0) scale(1.18)`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(parallax); };
    parallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [rootRef, reduced, pathname]);
}

export default function StoreShell({ catalog, children }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const pathname = usePathname();
  const rootRef = useRef(null);
  const [searching, setSearching] = useState(false);
  const closeSearch = useCallback(() => setSearching(false), []);
  useScrollEffects(rootRef, reduced, pathname);

  return (
    <StoreProvider catalog={catalog}>
      <div className={`store${pathname === '/' ? '' : ' store--page'}`} ref={rootRef}>
        <Header onSearch={() => setSearching(true)} />
        <main>{children}</main>
        <Footer />
        <QuickView />
        <Bag />
        <Search open={searching} onClose={closeSearch} />
      </div>
    </StoreProvider>
  );
}
