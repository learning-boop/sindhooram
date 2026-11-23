/* Each film ships as MP4 (H.264) with a WebM (VP9) fallback; the browser plays the first one it supports. */
export const FILMS = {
  landscape: { mp4: '/assets/reel-landscape.mp4', webm: '/assets/reel-landscape.webm', poster: '/assets/reel-landscape-poster.jpg' },
  portrait: { mp4: '/assets/reel-portrait.mp4', webm: '/assets/reel-portrait.webm', poster: '/assets/reel-portrait-poster.jpg' },
};

export function FilmSources({ film }) {
  return (
    <>
      <source src={film.mp4} type="video/mp4" />
      <source src={film.webm} type="video/webm" />
    </>
  );
}
