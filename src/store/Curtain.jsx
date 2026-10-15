import { useEffect, useState } from 'react';
import mark from '../assets/mark-560.png';

const KEY = 'sindhooram-curtain';
// eslint-disable-next-line react/only-export-components
export const curtainSeen = () => { try { return !!sessionStorage.getItem(KEY); } catch { return false; } };
const remember = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* storage blocked */ } };

/* Opening: crimson velvet curtains with the emblem in gold. After a beat the crest fades,
   the curtains gather toward the edges and the page behind is revealed. Once per tab.
   onOpen fires as the curtains start to part (the hero copy starts rising), onDone once they are gone. */
export default function Curtain({ onOpen, onDone }) {
  const [phase, setPhase] = useState('closed'); // closed → opening

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    const t1 = setTimeout(() => {
      setPhase('opening');
      document.documentElement.style.overflow = '';
      remember();
      onOpen();
    }, 1700);
    const t2 = setTimeout(onDone, 3700);
    return () => { clearTimeout(t1); clearTimeout(t2); document.documentElement.style.overflow = ''; };
  }, [onOpen, onDone]);

  return (
    <div className={`curtain is-${phase}`} aria-hidden="true">
      <div className="curtain__panel curtain__panel--l" />
      <div className="curtain__panel curtain__panel--r" />
      <div className="curtain__crest">
        <span className="curtain__ring" />
        <img src={mark} alt="" width="560" height="603" />
        <p className="curtain__name">Sindhooram</p>
        <p className="curtain__line">The color of tradition</p>
      </div>
    </div>
  );
}
