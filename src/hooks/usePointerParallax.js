import { useEffect, useRef } from 'react';

/* Tracks the pointer as a -0.5..0.5 offset from the viewport centre, eased, and hands it to `onFrame(x, y)`. */
export function usePointerParallax(enabled, onFrame) {
  const cb = useRef(onFrame);
  useEffect(() => { cb.current = onFrame; });

  useEffect(() => {
    if (!enabled) return undefined;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = null;

    const settle = () => {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      cb.current(cur.x, cur.y);
      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) {
        raf = requestAnimationFrame(settle);
      } else {
        raf = null;
      }
    };
    const onMove = (e) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(settle);
    };

    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);
}
