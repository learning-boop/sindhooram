import { useEffect, useMemo, useState } from 'react';

/* Time left until `iso`, refreshed every second. `open` is true once the date has passed. */
export function useCountdown(iso) {
  const target = useMemo(() => new Date(iso).getTime(), [iso]);
  const [diff, setDiff] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!Number.isFinite(diff) || diff <= 0) {
    return { open: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    open: false,
    days: Math.floor(diff / 864e5),
    hours: Math.floor(diff / 36e5) % 24,
    minutes: Math.floor(diff / 6e4) % 60,
    seconds: Math.floor(diff / 1e3) % 60,
  };
}
