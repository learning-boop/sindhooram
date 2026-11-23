'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Hero from './Hero';
import Curtain, { curtainSeen } from './Curtain';
import Shop from './Shop';
import { BestSellers, Explore, Feeling, Kalakaari, NewCollections, Promises, SindoorEdit, Story } from './Sections';

/* The home page, in the same order as before: the curtain opens on the hero film,
   then the collections, the Sindoor Edit, best sellers, the shop and our story. */
export default function StoreHome() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [opened, setOpened] = useState(false);
  const [curtain, setCurtain] = useState(true);
  const onOpen = useCallback(() => setOpened(true), []);
  const onCurtainDone = useCallback(() => setCurtain(false), []);

  // Already seen in this tab (or reduced motion): skip straight to the opened page.
  useEffect(() => {
    if (curtainSeen() || window.location.hash || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('curtain-seen');
      setOpened(true);
      setCurtain(false);
    }
  }, []);

  // Arriving from another page with #shop (or another anchor): scroll there once the page is laid out.
  useEffect(() => {
    if (!window.location.hash) return undefined;
    const id = setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' }), 120);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {curtain && <Curtain onOpen={onOpen} onDone={onCurtainDone} />}
      <Hero ready={opened} reduced={reduced} />
      <NewCollections />
      <Explore />
      <Kalakaari />
      <SindoorEdit />
      <BestSellers />
      <Promises />
      <Shop />
      <Story />
      <Feeling />
    </>
  );
}
