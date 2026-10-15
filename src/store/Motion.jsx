import { useMemo } from 'react';

/* Echo title: the text rises in while a soft ghost copy trails just below it and fades,
   the doubled-title effect from the reference. Triggered by the nearest [data-reveal].is-in. */
export function Echo({ as: Tag = 'h2', className = '', children }) {
  return (
    <Tag className={`echo ${className}`}>
      <span className="echo__main">{children}</span>
      <span className="echo__ghost" aria-hidden="true">{children}</span>
    </Tag>
  );
}

/* Rise: each word slides up out of a mask, one after another. `lines` is an array of strings. */
export function Rise({ as: Tag = 'h1', className = '', lines, delay = 0 }) {
  let i = 0;
  return (
    <Tag className={`rise ${className}`} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span className="rise__line" key={li} aria-hidden="true">
          {line.split(' ').map((w, wi) => (
            <span className="rise__mask" key={wi}>
              <span className="rise__word" style={{ '--i': i++, '--d0': `${delay}s` }}>{w}</span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

/* Leaves: palm fronds drawn as SVG, blurred and swaying slowly, cast as shadows over a sunlit wall.
   Each frond is a curved stem with tapering leaflets on both sides. */
function frond(x, y, angle, len, count, seed) {
  const parts = [];
  const rad = (angle * Math.PI) / 180;
  const bend = 0.18 + (seed % 3) * 0.05;
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    // point along a gently bending stem
    const a = rad + bend * t;
    const px = x + Math.cos(a) * len * t;
    const py = y + Math.sin(a) * len * t;
    const leafLen = len * 0.34 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 8;
    const deg = (a * 180) / Math.PI;
    [-1, 1].forEach((side) => {
      const tilt = deg + side * (58 - t * 18);
      parts.push(
        <ellipse key={`${i}${side}`} cx={leafLen / 2} cy={0} rx={leafLen / 2} ry={Math.max(3, leafLen * 0.07)}
          transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${tilt.toFixed(1)})`} />,
      );
    });
  }
  return parts;
}

const FRONDS = [
  { x: -30, y: 60, angle: 22, len: 360, n: 20, d: 0 },
  { x: 1030, y: 30, angle: 158, len: 340, n: 18, d: 1.6 },
  { x: 990, y: 610, angle: 208, len: 300, n: 16, d: 0.8 },
  { x: 40, y: 630, angle: -30, len: 280, n: 15, d: 2.4 },
  { x: 560, y: -30, angle: 75, len: 220, n: 13, d: 3.1 },
];

export function Leaves({ className = '' }) {
  const fronds = useMemo(() => FRONDS.map((f, k) => ({ ...f, parts: frond(f.x, f.y, f.angle, f.len, f.n, k) })), []);
  return (
    <div className={`leaves ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        {fronds.map((f, k) => (
          <g key={k} className="leaves__frond" style={{ transformOrigin: `${f.x}px ${f.y}px`, animationDelay: `-${f.d}s` }}>
            <path d={`M${f.x} ${f.y} q ${Math.cos((f.angle * Math.PI) / 180) * f.len * 0.5} ${Math.sin((f.angle * Math.PI) / 180) * f.len * 0.5 + 30} ${Math.cos((f.angle * Math.PI) / 180) * f.len} ${Math.sin((f.angle * Math.PI) / 180) * f.len + 80}`}
              fill="none" stroke="currentColor" strokeWidth="5" />
            {f.parts}
          </g>
        ))}
      </svg>
      <span className="leaves__sun" />
    </div>
  );
}
