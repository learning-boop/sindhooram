import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/*
 * Sindoor dust: an ambient drift of vermillion and gold specks across the page,
 * plus one sprinkle (`burst`) from the emblem when the page opens.
 * Exposes { burst(x, y), parallax(x, y) } through the ref.
 */
const COLORS = ['217,52,28', '242,163,58', '214,169,79', '243,216,146'];
const TAU = Math.PI * 2;

function makeSprites() {
  return COLORS.map((c) => {
    const s = document.createElement('canvas');
    s.width = s.height = 48;
    const g = s.getContext('2d');
    const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, `rgba(${c},1)`);
    grad.addColorStop(0.3, `rgba(${c},.55)`);
    grad.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 48, 48);
    return s;
  });
}

const Dust = forwardRef(function Dust({ reduced }, ref) {
  const canvasRef = useRef(null);
  const state = useRef(null);

  useEffect(() => {
    if (reduced) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const s = { W: 0, H: 0, ambient: [], burst: [], running: false, last: 0, t: 0, par: { x: 0, y: 0 }, sprites: makeSprites() };
    state.current = s;

    const spawn = (anywhere) => ({
      x: Math.random() * s.W,
      y: anywhere ? Math.random() * s.H : s.H + 10,
      r: 1 + Math.random() * 2.4,
      vy: 0.12 + Math.random() * 0.3,
      sway: Math.random() * TAU,
      swayAmp: 0.1 + Math.random() * 0.25,
      a: 0.25 + Math.random() * 0.55,
      tw: Math.random() * TAU,
      depth: 0.3 + Math.random() * 0.7,
      c: (Math.random() * 4) | 0,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.W = window.innerWidth;
      s.H = window.innerHeight;
      canvas.width = Math.round(s.W * dpr);
      canvas.height = Math.round(s.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, Math.max(30, (s.W * s.H) / 18000)));
      while (s.ambient.length < n) s.ambient.push(spawn(true));
      s.ambient.length = n;
    };

    const frame = (now) => {
      if (!s.running) return;
      const dt = Math.min(48, now - (s.last || now)) / 16.67;
      s.last = now;
      s.t += dt * 0.016;
      ctx.clearRect(0, 0, s.W, s.H);
      ctx.globalCompositeOperation = 'lighter';
      let p;
      let size;
      for (let i = 0; i < s.ambient.length; i++) {
        p = s.ambient[i];
        p.y -= p.vy * dt;
        p.x += Math.sin(s.t * 1.3 + p.sway) * p.swayAmp * dt;
        if (p.y < -12) { s.ambient[i] = p = spawn(false); }
        size = p.r * 5;
        ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(s.t * 2.2 + p.tw));
        ctx.drawImage(s.sprites[p.c], p.x + s.par.x * p.depth * 18 - size / 2, p.y + s.par.y * p.depth * 12 - size / 2, size, size);
      }
      for (let i = s.burst.length - 1; i >= 0; i--) {
        p = s.burst[i];
        p.age += dt * 16.67;
        if (p.age >= p.life) { s.burst.splice(i, 1); continue; }
        p.vx *= Math.pow(0.955, dt);
        p.vy = p.vy * Math.pow(0.955, dt) + 0.035 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = 1 - p.age / p.life;
        size = p.r * 6 * (0.5 + k * 0.5);
        ctx.globalAlpha = Math.min(1, k * 1.4) * 0.95;
        ctx.drawImage(s.sprites[p.c], p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    };

    s.start = () => { if (!s.running) { s.running = true; s.last = 0; requestAnimationFrame(frame); } };
    s.stop = () => { s.running = false; };
    const onVisibility = () => { if (document.hidden) s.stop(); else s.start(); };

    resize();
    s.start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      s.stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      state.current = null;
    };
  }, [reduced]);

  useImperativeHandle(ref, () => ({
    burst(x, y) {
      const s = state.current;
      if (!s) return;
      for (let i = 0; i < 170; i++) {
        const a = Math.random() * TAU;
        const sp = 0.8 + Math.random() * 6.5;
        s.burst.push({
          x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
          r: 0.8 + Math.random() * 2.6, life: 1100 + Math.random() * 1700, age: 0, c: (Math.random() * 4) | 0,
        });
      }
      s.start();
    },
    parallax(x, y) {
      const s = state.current;
      if (s) { s.par.x = x; s.par.y = y; }
    },
  }), []);

  return <canvas ref={canvasRef} className="dust" aria-hidden="true" />;
});

export default Dust;
