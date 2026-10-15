/* ======================= EDIT THESE ======================= */
export const CONFIG = {
  // Which page the site shows: 'store' (the full shop) or 'coming-soon' (the countdown page)
  mode: 'store',

  // Show the Dresses range (menu, tab, cards, products). Off until dress photos are ready.
  showDresses: false,

  // Orders above this amount (₹) ship free; the cart shows progress toward it
  freeShippingAbove: 2999,

  // Shown in the footer and used for the cart's "Order on WhatsApp" message
  email: 'hello@sindhooram.com',

  // Launch date & time (IST). Diwali 2026 is a placeholder — change it.
  launchDate: '2026-11-08T06:00:00+05:30',

  // Where "Notify me" posts JSON { email, source, page }.
  // Works with Formspree ('https://formspree.io/f/xxxxxxxx') or your own API.
  // Leave empty to only show the thank-you (nothing is stored).
  formEndpoint: '',

  // WhatsApp number with country code, no + or spaces, e.g. '919876543210'
  whatsapp: '',

  // Instagram handle only, e.g. 'sindhooram'
  instagram: '',

  // Weave names in the ribbon at the bottom of the page
  weaves: [
    'Kanjeevaram', 'Banarasi', 'Uppada', 'Dharmavaram', 'Gadwal', 'Pochampally',
    'Mangalagiri', 'Paithani', 'Venkatagiri', 'Chanderi', 'Mysore silk',
  ],
};
/* ========================================================== */
