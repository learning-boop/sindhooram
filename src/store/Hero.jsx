import { useEffect, useRef } from 'react';
import { IMG } from './data';
import { Rise } from './Motion';
import { ArrowIcon } from './Icons';

/* The hero: the green room with crimson curtains. Copy rises in once the curtain opens;
   on scroll the photo drifts and the copy lifts away. */
export default function Hero({ onShop, ready, reduced }) {
  const media = useRef(null);
  const copy = useRef(null);

  useEffect(() => {
    if (reduced) return undefined;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = Math.min(window.scrollY, window.innerHeight);
      if (media.current) media.current.style.transform = `translate3d(0,${(y * 0.28).toFixed(1)}px,0) scale(${(1 + y / 4000).toFixed(4)})`;
      if (copy.current) {
        copy.current.style.transform = `translate3d(0,${(-y * 0.18).toFixed(1)}px,0)`;
        copy.current.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.7)));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [reduced]);

  return (
    <section className={`hero${ready ? ' is-ready' : ''}`} id="top">
      <div className="hero__media" ref={media}>
        <img src={IMG.hero} alt="A woman in an ivory silk saree seated in a green room framed by crimson curtains" />
      </div>
      <div className="hero__shade" />
      <div className="hero__copy" ref={copy}>
        <p className="eyebrow hero__eyebrow">Tradition meets tomorrow</p>
        <Rise className="hero__title" lines={['More Than', 'Fashion']} delay={0.35} />
        <p className="hero__line">A story in every drape.</p>
        <div className="hero__ctas">
          <button type="button" className="btn btn--cream" onClick={() => onShop('all')}>Explore Collections</button>
          <button type="button" className="btn btn--ghost" onClick={() => onShop('new')}>Shop New Arrivals <ArrowIcon size={15} /></button>
        </div>
      </div>
      <p className="hero__rail" aria-hidden="true">Handwoven <i>·</i> Heirloom <i>·</i> Heritage</p>
      <a className="scroll-cue" href="#new" aria-label="Scroll to new arrivals"><span /></a>
    </section>
  );
}
