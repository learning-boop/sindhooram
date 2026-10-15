import { forwardRef, useEffect, useRef } from 'react';
import mark from '../assets/mark-560.png';

/* The ring behind the emblem: a japa mala of 108 beads with 12 markers, drawn once and rotated by CSS. */
function drawRing(c) {
  if (!c) return;
  const size = c.clientWidth;
  if (!size) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = c.height = Math.round(size * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = size / 2;
  const R = size / 2 - 4;
  const TAU = Math.PI * 2;
  for (let i = 0; i < 108; i++) {
    const a = (i / 108) * TAU;
    const big = i % 9 === 0;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R, cx + Math.sin(a) * R, big ? 2 : 1.05, 0, TAU);
    ctx.fillStyle = big ? 'rgba(243,216,146,.95)' : 'rgba(214,169,79,.62)';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cx, R * 0.9, 0, TAU);
  ctx.strokeStyle = 'rgba(214,169,79,.32)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.moveTo(cx + Math.cos(a) * R * 0.9, cx + Math.sin(a) * R * 0.9);
    ctx.lineTo(cx + Math.cos(a) * R * 0.83, cx + Math.sin(a) * R * 0.83);
  }
  ctx.strokeStyle = 'rgba(214,169,79,.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/* `ref` is the outer block (moved by the pointer parallax); `markRef` is the lotus image (the veil glides onto it). */
const Emblem = forwardRef(function Emblem({ markRef, hidden }, ref) {
  const ringRef = useRef(null);

  useEffect(() => {
    const c = ringRef.current;
    const draw = () => drawRing(c);
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="emblem" ref={ref}>
      <div className="emblem__glow" aria-hidden="true" />
      <canvas className="emblem__ring" ref={ringRef} aria-hidden="true" />
      <img
        ref={markRef}
        className={`emblem__mark${hidden ? ' is-hidden' : ''}`}
        src={mark}
        alt="Sindhooram emblem: a vermillion sun rising behind a lotus"
        width="876"
        height="943"
      />
    </div>
  );
});

export default Emblem;
