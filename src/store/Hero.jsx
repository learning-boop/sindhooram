import { useEffect, useRef } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import heroLandscape from '../assets/hero-landscape.mp4';
import heroPortrait from '../assets/hero-portrait.mp4';
import landscapePoster from '../assets/hero-landscape-poster.jpg';
import portraitPoster from '../assets/hero-portrait-poster.jpg';
import { Rise } from './Motion';
import { ArrowIcon } from './Icons';

/* The hero: the Sindhooram film plays full-bleed (the wide cut on desktop, the tall cut on phones).
   Copy rises in once the curtain opens; on scroll the film drifts and the copy lifts away. */
const LOOP_END = 7.6; // seconds

export default function Hero({ onShop, ready, reduced }) {
  const isPortrait = useMediaQuery('(max-aspect-ratio: 4/5)');
  const film = isPortrait ? { src: heroPortrait, poster: portraitPoster } : { src: heroLandscape, poster: landscapePoster };
  const media = useRef(null);
  // Both films end on the logo card, which would sit under the hero title, so only the saree footage loops.
  const trimLoop = (e) => { if (e.currentTarget.currentTime > LOOP_END) e.currentTarget.currentTime = 0; };
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
        <video key={film.src} src={film.src} poster={film.poster} autoPlay={!reduced} muted loop playsInline preload="auto" onTimeUpdate={trimLoop}
          aria-label="A woman in a red Banarasi saree on a carved balcony over the river at sunset" />
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
