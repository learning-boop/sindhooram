import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from './config';
import './styles.css';
import { useMediaQuery } from './hooks/useMediaQuery';
import { usePointerParallax } from './hooks/usePointerParallax';
import Veil from './components/Veil';
import Stage from './components/Stage';
import Dust from './components/Dust';
import TopBar from './components/TopBar';
import Emblem from './components/Emblem';
import Countdown from './components/Countdown';
import NotifyForm from './components/NotifyForm';
import Links from './components/Links';
import Reel from './components/Reel';
import WeavesRibbon from './components/WeavesRibbon';

const INTRO_KEY = 'sindhooram-intro';
const seenIntro = () => { try { return !!sessionStorage.getItem(INTRO_KEY); } catch { return false; } };
const rememberIntro = () => { try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* storage blocked */ } };
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const YEAR = new Date().getFullYear();

/*
 * phase: 'intro'   — the veil covers the page, copy hidden, emblem hidden
 *        'leaving' — the veil fades and its lotus glides into place while the copy reveals
 *        'ready'   — veil gone, emblem shown, dust sprinkled; the page as it rests
 */
export default function ComingSoon() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const finePointer = useMediaQuery('(pointer: fine)');
  const [phase, setPhase] = useState(() => (prefersReduced() || seenIntro() ? 'ready' : 'intro'));
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const dustRef = useRef(null);
  const emblemRef = useRef(null);
  const markRef = useRef(null);
  const reelFrameRef = useRef(null);

  const handleLeaving = useCallback(() => setPhase((p) => (p === 'intro' ? 'leaving' : p)), []);
  const handleDone = useCallback(() => { rememberIntro(); setPhase('ready'); }, []);

  // no scrolling while the opening plays
  useEffect(() => {
    document.documentElement.style.overflow = phase === 'ready' ? '' : 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, [phase]);

  // sindoor dust from the emblem once the page is open
  useEffect(() => {
    if (phase !== 'ready' || reduced) return undefined;
    const id = setTimeout(() => {
      const m = markRef.current;
      if (!m) return;
      const b = m.getBoundingClientRect();
      dustRef.current?.burst(b.left + b.width / 2, b.top + b.height * 0.46);
    }, 80);
    return () => clearTimeout(id);
  }, [phase, reduced]);

  // the reel tilts toward the cursor; the dust and the emblem drift the other way
  usePointerParallax(finePointer && !reduced, (x, y) => {
    if (reelFrameRef.current) {
      reelFrameRef.current.style.transform =
        `perspective(1200px) rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)`;
    }
    if (emblemRef.current && phaseRef.current === 'ready') {
      emblemRef.current.style.transform = `translate(${(-x * 10).toFixed(1)}px,${(-y * 8).toFixed(1)}px)`;
    }
    dustRef.current?.parallax(-x, -y);
  });

  return (
    <>
      {phase !== 'ready' && <Veil targetRef={markRef} onLeaving={handleLeaving} onDone={handleDone} />}

      <div className={`stage${phase === 'intro' ? ' is-intro' : ''}`}>
        <Stage isPortrait={isPortrait} reduced={reduced} />
        <Dust ref={dustRef} reduced={reduced} />

        <TopBar />

        <main className="hero">
          <div className="hero__copy">
            <Emblem ref={emblemRef} markRef={markRef} hidden={phase !== 'ready'} />
            <h1 className="wordmark" style={{ '--d': '.1s' }}>Sindhooram</h1>
            <p className="tagline reveal" style={{ '--d': '.4s' }}>
              The color of tradition. <br />The power of womanhood.
            </p>
            <p className="lede reveal" style={{ '--d': '.55s' }}>
              Sindhooram means vermillion: the red of the sindoor, the first colour of every new beginning.
              We are building a saree house around that red, with handloom silks from Kanchipuram to Uppada.
              The doors open soon.
            </p>
            <Countdown launchDate={CONFIG.launchDate} />
            <NotifyForm endpoint={CONFIG.formEndpoint} />
            <Links whatsapp={CONFIG.whatsapp} instagram={CONFIG.instagram} />
          </div>

          <Reel frameRef={reelFrameRef} isPortrait={isPortrait} reduced={reduced} />
        </main>

        <footer className="foot reveal" style={{ '--d': '1.1s' }}>
          <WeavesRibbon weaves={CONFIG.weaves} />
          <p className="foot__line">© {YEAR} Sindhooram. Handloom sarees, online soon.</p>
        </footer>
      </div>
    </>
  );
}
