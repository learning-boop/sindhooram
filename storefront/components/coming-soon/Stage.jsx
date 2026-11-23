'use client';

import { useEffect, useRef } from 'react';
import { FILMS, FilmSources } from './media';

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
  }, [film.mp4, reduced]);

  return (
    <div className="stage__media" aria-hidden="true">
      <video
        ref={videoRef}
        className="stage__video"
        key={film.mp4}
        poster={film.poster}
        muted
        playsInline
        loop
        preload="auto"
      >
        <FilmSources film={film} />
      </video>
      <div className="stage__shade" />
      <div className="stage__grain" />
    </div>
  );
}
