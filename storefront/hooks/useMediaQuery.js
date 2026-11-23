'use client';
import { useCallback, useSyncExternalStore } from 'react';

/* Matches a CSS media query. Server render (and hydration) assume "no match"; the real value
   applies right after, so nothing mismatches between the server HTML and the first client render. */
export function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
