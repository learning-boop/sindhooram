import landscapeMp4 from '../assets/reel-landscape.mp4';
import landscapeWebm from '../assets/reel-landscape.webm';
import portraitMp4 from '../assets/reel-portrait.mp4';
import portraitWebm from '../assets/reel-portrait.webm';
import landscapePoster from '../assets/reel-landscape-poster.jpg';
import portraitPoster from '../assets/reel-portrait-poster.jpg';

/* Each film ships as MP4 (H.264) with a WebM (VP9) fallback for browsers without the H.264 codec. */
function pick(mp4, webm) {
  if (typeof document === 'undefined') return mp4;
  const v = document.createElement('video');
  if (v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) return mp4;
  if (v.canPlayType('video/webm; codecs="vp9"')) return webm;
  return mp4;
}

export const FILMS = {
  landscape: { src: pick(landscapeMp4, landscapeWebm), poster: landscapePoster },
  portrait: { src: pick(portraitMp4, portraitWebm), poster: portraitPoster },
};
