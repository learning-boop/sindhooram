# Sindhooram — store + coming soon (React + Vite)

`CONFIG.mode` in `src/config.js` picks the page: `'store'` (the shop) or `'coming-soon'` (the countdown).

## The store — `src/store/`
- `data.js`     — **products, prices, photos and menu.** Edit this to change the catalogue.
- `Store.jsx`   — page order + scroll reveal / parallax
- `Curtain.jsx` — the opening: velvet curtains with the emblem, parting to reveal the page (once per tab)
- `Motion.jsx`  — echo titles, word-by-word rise, swaying leaf shadows
- `Header.jsx`  — nav with mega menus, mobile menu
- `Hero.jsx`    — "More Than Fashion" hero with scroll drift
- `Sections.jsx`— New Collections (arches), Explore, Kalakaari, Best Sellers, promises, Our Story, A Feeling
- `Shop.jsx`    — filter tabs + product cards
- `Overlays.jsx`— quick view, bag drawer (orders go to WhatsApp), search
- `Footer.jsx`  — footer + newsletter
- `cart.jsx`    — bag & wishlist state (saved in the browser)
- `store.css`   — all store styling; colours at the top

Photos are in `src/assets/site/` (generated in the style of the reference design; swap in real product shots any time).
`showDresses` in config.js turns the Dresses range on once dress photos exist.
Set `whatsapp` in config.js to turn on "Order on WhatsApp" in the bag.

## Settings — `src/config.js`
- `launchDate`   — launch date & time in IST. Placeholder is Diwali, 8 Nov 2026 06:00.
- `formEndpoint` — where "Notify me" posts JSON `{ email, source, page }`. Works with Formspree
                   (`https://formspree.io/f/xxxx`) or your own API. Empty = thank-you only, nothing stored.
- `whatsapp`     — number with country code, e.g. `919876543210`.
- `instagram`    — handle, e.g. `sindhooram`.
- `weaves`       — names in the ribbon at the bottom.

## Structure
```
src/
  App.jsx                 page composition + the opening sequence (intro → leaving → ready)
  config.js               the settings above
  styles.css              all styling (design tokens at the top)
  lib/media.js            picks MP4 (H.264) or WebM (VP9) per browser
  hooks/useMediaQuery     orientation / reduced-motion / pointer type
  hooks/useCountdown      time left until launchDate
  hooks/usePointerParallax eased pointer offset for the tilt and dust
  components/
    Veil        preloader: lotus on a dark veil, gold thread, glide into place
    Stage       full-bleed background film (matches screen orientation) + shade + grain
    Dust        canvas particles: ambient drift + the sprinkle from the emblem
    Emblem      lotus mark, glow, and the 108-bead ring
    Countdown   days / hours / minutes / seconds
    NotifyForm  email capture with validation and thank-you state
    Links       WhatsApp / Instagram
    Reel        the gold-framed film (+ photos on wide screens) with a sound button
    WeavesRibbon the scrolling ribbon of weave names
  assets/                 films, posters, photos, logo mark (imported through Vite)
public/                   favicon, apple-touch-icon, og-image.jpg, logo-full.png
```

## Notes
- The opening plays once per browser tab (`sessionStorage`); open a new tab to see it again.
- Sound starts only from the speaker button (browsers block autoplay with audio).
- Deploying under a sub-path? Set `base` in `vite.config.js`.
- Set the absolute `og:image` URL in `index.html` once the domain is live.
- Fonts (Cinzel, Cormorant Garamond) load from Google Fonts; no other runtime dependencies.
