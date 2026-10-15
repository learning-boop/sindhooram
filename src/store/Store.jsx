import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { StoreProvider } from './cart';
import Header from './Header';
import Hero from './Hero';
import { BestSellers, Explore, Feeling, Kalakaari, NewCollections, Promises, SindoorEdit, Story } from './Sections';
import Curtain, { curtainSeen } from './Curtain';
import Shop from './Shop';
import Footer from './Footer';
import { Bag, QuickView, Search } from './Overlays';
import './store.css';

/* Reveal: anything marked data-reveal fades up the first time it enters the viewport.
   A MutationObserver picks up cards added later (switching shop tabs).
   Parallax: elements marked data-parallax="0.12" drift against the scroll by that factor. */
function useScrollEffects(rootRef, reduced) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (reduced) {
      root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      return undefined;
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
  }, [rootRef, reduced]);
}

export default function Store() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [filter, setFilter] = useState('all');
  const [searching, setSearching] = useState(false);
  const rootRef = useRef(null);
  const [opened, setOpened] = useState(() => reduced || curtainSeen());
  const [curtain, setCurtain] = useState(() => !opened);
  const onOpen = useCallback(() => setOpened(true), []);
  const onCurtainDone = useCallback(() => setCurtain(false), []);
  useScrollEffects(rootRef, reduced);

  const shop = useCallback((f) => {
    setFilter(f);
    document.getElementById('shop')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [reduced]);
  const closeSearch = useCallback(() => setSearching(false), []);

  return (
    <StoreProvider>
      <div className="store" ref={rootRef}>
        <Header onShop={shop} onSearch={() => setSearching(true)} />
        {curtain && <Curtain onOpen={onOpen} onDone={onCurtainDone} />}
        <main>
          <Hero onShop={shop} ready={opened} reduced={reduced} />
          <NewCollections onShop={shop} />
          <Explore onShop={shop} />
          <Kalakaari onShop={shop} />
          <SindoorEdit onShop={shop} />
          <BestSellers onShop={shop} />
          <Promises />
          <Shop filter={filter} setFilter={setFilter} />
          <Story />
          <Feeling />
        </main>
        <Footer onShop={shop} />
        <QuickView />
        <Bag />
        <Search open={searching} onClose={closeSearch} />
      </div>
    </StoreProvider>
  );
}
