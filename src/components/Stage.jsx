import { useEffect, useRef } from 'react';
import { FILMS } from '../lib/media';

/* Full-bleed film behind the page: the one that matches the screen's orientation, darkened and grained. */
export default function Stage({ isPortrait, reduced }) {
  const videoRef = useRef(null);
  const film = isPortrait ? FILMS.portrait : FILMS.landscape;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    v.muted = true;
    if (!reduced) v.play().catch(() => {});

    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [film.src, reduced]);

  return (
    <div className="stage__media" aria-hidden="true">
      <video
        ref={videoRef}
        className="stage__video"
        src={film.src}
        poster={film.poster}
        muted
        playsInline
        loop
        preload="auto"
      />
      <div className="stage__shade" />
      <div className="stage__grain" />
    </div>
  );
}
