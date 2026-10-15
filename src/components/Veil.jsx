import { useEffect, useRef } from 'react';
import mark from '../assets/mark-560.png';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/*
 * The opening: the lotus waits on a dark veil while a gold thread is drawn under it,
 * then glides to the emblem's place in the layout (a FLIP animation against `targetRef`).
 * `onLeaving` fires as the veil starts to fade (the page copy begins to reveal);
 * `onDone` fires when the mark has arrived (the parent then unmounts this component).
 */
export default function Veil({ targetRef, onLeaving, onDone }) {
  const veilRef = useRef(null);
  const markRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let glide = null;
    const timers = [];

    (async () => {
      await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(1500)]);
      await wait(1350);
      if (cancelled) return;

      const veil = veilRef.current;
      const vm = markRef.current;
      const target = targetRef.current;
      if (!veil || !vm || !target) { onDone(); return; }

      const a = vm.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      const s = b.width / a.width;

      veil.classList.add('is-leaving');
      timers.push(setTimeout(() => { if (!cancelled) onLeaving(); }, 380));

      try {
        glide = vm.animate(
          [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }],
          { duration: 1000, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'forwards' },
        );
        await glide.finished;
      } catch {
        /* no Web Animations support: skip the glide */
      }
      if (!cancelled) onDone();
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (glide) glide.cancel();
    };
  }, [targetRef, onLeaving, onDone]);

  return (
    <div className="veil" ref={veilRef} aria-hidden="true">
      <div className="veil__bg">
        <div className="veil__word">Sindhooram</div>
        <div className="veil__thread" />
      </div>
      <img className="veil__mark" ref={markRef} src={mark} alt="" width="876" height="943" />
    </div>
  );
}
