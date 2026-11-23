/* Runs before the page paints (inline in the store layout's <head>): a visitor who already saw the
   opening curtain in this tab, or who prefers reduced motion, never sees it flash before React loads. */
export const CURTAIN_GUARD =
  "try{if(sessionStorage.getItem('sindhooram-curtain')||location.hash||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('curtain-seen')}catch(e){}";
