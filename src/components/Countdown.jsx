import { useCountdown } from '../hooks/useCountdown';

/* A changing value remounts the number (new key), which restarts the tick animation. */
function Unit({ value, name }) {
  const text = String(value).padStart(2, '0');
  return (
    <div className="count__unit">
      <span key={text} className="count__num is-tick">{text}</span>
      <span className="count__name">{name}</span>
    </div>
  );
}

export default function Countdown({ launchDate }) {
  const t = useCountdown(launchDate);
  return (
    <section className="count reveal" style={{ '--d': '.7s' }} aria-label="Countdown to launch">
      {t.open ? (
        <p className="count__open">The doors are open</p>
      ) : (
        <>
          <p className="count__label">The doors open in</p>
          <div className="count__grid">
            <Unit value={t.days} name="days" />
            <Unit value={t.hours} name="hours" />
            <Unit value={t.minutes} name="minutes" />
            <Unit value={t.seconds} name="seconds" />
          </div>
        </>
      )}
    </section>
  );
}
