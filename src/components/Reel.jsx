import { useEffect, useRef, useState } from 'react';
import { FILMS } from '../lib/media';
import seated from '../assets/saree-seated.jpg';
import portrait from '../assets/saree-portrait.jpg';

/*
 * The zari-framed reel: it plays the film the background is NOT using (portrait film on wide screens,
 * landscape film on phones). On wide screens it also cycles through the two campaign photographs.
 * `frameRef` is tilted toward the pointer by the parent.
 */
const WIDE_ITEMS = ['video', 'photo1', 'photo2'];
const TALL_ITEMS = ['video'];

export default function Reel({ frameRef, isPortrait, reduced }) {
  const videoRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  const film = isPortrait ? FILMS.landscape : FILMS.portrait;
  const items = isPortrait ? TALL_ITEMS : WIDE_ITEMS;
  const loop = isPortrait || reduced;
  const current = items[index] ?? 'video';

  useEffect(() => { setIndex(0); }, [isPortrait]);

  // run the rotation: the film plays through, then each photograph holds for a moment
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    let timer = null;
    const next = () => setIndex((i) => (i + 1) % items.length);

    if (current === 'video') {
      v.muted = !soundOn;
      if (!reduced) {
        try { v.currentTime = 0; } catch { /* not seekable yet */ }
        v.play().catch(() => {});
      }
      if (!loop) {
        v.onended = next;
        timer = setTimeout(next, 11500); // fallback if `ended` never fires
      }
    } else {
      v.pause();
      timer = setTimeout(next, 4200);
    }

    const onVisibility = () => {
      if (reduced || current !== 'video') return;
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      v.onended = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, items, loop, reduced]);

  // sound toggle (browsers only allow audio after a click, which is what the button is)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !soundOn;
    if (soundOn && current === 'video') v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  return (
    <aside className={`reel reveal${isPortrait ? '' : ' reel--tall'}`} style={{ '--d': '.5s' }} aria-label="A first look at the collection">
      <div className="reel__frame" ref={frameRef}>
        <div className="reel__corners" aria-hidden="true" />
        <div className="reel__media">
          <video
            ref={videoRef}
            className={`reel__video${current === 'video' ? ' is-shown' : ''}`}
            src={film.src}
            poster={film.poster}
            muted
            playsInline
            loop={loop}
            preload="auto"
          />
          <img
            className={`reel__photo${current === 'photo1' ? ' is-shown' : ''}`}
            src={seated}
            alt="A woman in a red and gold Kanjeevaram silk saree, seated among brass lamps"
            width="1000"
            height="1500"
          />
          <img
            className={`reel__photo reel__photo--logo${current === 'photo2' ? ' is-shown' : ''}`}
            src={portrait}
            alt="A woman in a red Banarasi silk saree with gold zari work"
            width="1000"
            height="1500"
          />
          <button
            className={`reel__sound${soundOn ? ' is-on' : ''}`}
            type="button"
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
            onClick={() => setSoundOn((s) => !s)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4z" />
              <path className="wave" d="M16 9.5a3.6 3.6 0 0 1 0 5" />
              <path className="wave" d="M18.6 7a7.2 7.2 0 0 1 0 10" />
              <path className="cross" d="M16.5 9.5l4 5M20.5 9.5l-4 5" />
            </svg>
          </button>
        </div>
      </div>
      <p className="reel__caption">A first look at the collection.</p>
    </aside>
  );
}
