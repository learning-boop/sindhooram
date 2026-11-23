/* ======================= EDIT THESE =======================
   Site settings. Values that change per deployment (backend address, keys, WhatsApp number)
   come from environment variables; see .env.example.
   ========================================================== */
export const CONFIG = {
  // Which page "/" shows: 'store' (the shop) or 'coming-soon' (the countdown page)
  mode: process.env.NEXT_PUBLIC_SITE_MODE || 'store',

  // Show the Dresses range (menu, tab, cards). Off until dress photos are ready.
  showDresses: process.env.NEXT_PUBLIC_SHOW_DRESSES === 'true',

  // Orders above this amount (₹) ship free; the bag shows progress toward it
  // 0 = standard delivery is free on every order (as the vendors' Standard Delivery is). Set an
  // amount (e.g. 2999) only together with a matching rule on the vendors' delivery options.
  freeShippingAbove: 0,

  // Shown in the footer
  email: 'hello@sindhooram.com',

  // Launch date & time (IST) for the coming-soon countdown
  launchDate: '2026-11-08T06:00:00+05:30',

  // Where "Notify me" / newsletter posts JSON { email, source, page }. Formspree or your own API.
  formEndpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT || '',

  // WhatsApp number with country code, no + or spaces, e.g. '919876543210'
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '',

  // Instagram handle only, e.g. 'sindhooram'
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || '',

  // The vendor panel (sellers sign up and manage products there)
  vendorPanelUrl: (process.env.NEXT_PUBLIC_VENDOR_PANEL_URL || 'http://localhost:9000/seller').replace(/\/$/, ''),

  // Public address of this site, used for SEO tags and the sitemap
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),

  // Weave names in the ribbon at the bottom of the coming-soon page
  weaves: [
    'Kanjeevaram', 'Banarasi', 'Uppada', 'Dharmavaram', 'Gadwal', 'Pochampally',
    'Mangalagiri', 'Paithani', 'Venkatagiri', 'Chanderi', 'Mysore silk',
  ],
};
/* ========================================================== */

export const DRESS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

/* A variant's size/colour worth showing in the bag and orders. "Free size" and the vendor panel's
   placeholder names ("Default variant") say nothing, so they are hidden. */
export const sizeLabel = (title) =>
  title && !/^(free size|default( variant| option)?)$/i.test(String(title).trim()) ? title : null;

/* Shown for a product whose vendor has not added a photo yet. */
export const NO_PHOTO = '/assets/no-photo.svg';

/* Photos used by the page sections (served from /public/assets). */
export const IMG = {
  heroWoman: '/assets/site/hero-woman.jpg',
  archIvory: '/assets/site/arch-ivory.jpg',
  archIvoryDetail: '/assets/site/arch-ivory-detail.jpg',
  archBlush: '/assets/site/arch-blush.jpg',
  archBlushDetail: '/assets/site/arch-blush-detail.jpg',
  archBridal: '/assets/site/arch-bridal.jpg',
  archBridalDetail: '/assets/site/arch-bridal-detail.jpg',
  embroidered: '/assets/site/embroidered-window.jpg',
  embroideredDetail: '/assets/site/embroidered-window-detail.jpg',
  womenCard: '/assets/site/women-card.jpg',
  kalakaariWindow: '/assets/site/kalakaari-window.jpg',
  kalakaariSeated: '/assets/site/kalakaari-seated.jpg',
  kalamkariDrape: '/assets/site/kalamkari-drape.jpg',
  kalamkariDrapeDetail: '/assets/site/kalamkari-drape-detail.jpg',
  sindoorFullRiver: '/assets/site/red/sindoor-full-river.jpg',
  redSilkGaze: '/assets/site/red/red-silk-gaze.jpg',
  jasmineBack: '/assets/store/jasmine-back.jpg',
  mark160: '/assets/mark-160.png',
  mark560: '/assets/mark-560.png',
};

const withDresses = (list) => (CONFIG.showDresses ? list : list.filter((x) => x.filter !== 'dress'));

/* Main menu. Each link is [label, where]: a shop shortcut ('saree', 'red', 'new') or a shop
   filter query ('?weave=banarasi'); see lib/shop-filters.js. */
export const NAV = withDresses([
  {
    label: 'Sarees',
    filter: 'saree',
    columns: [
      { title: 'By weave', links: [['Kanjeevaram', '?weave=kanjeevaram'], ['Banarasi', '?weave=banarasi'], ['Pattu', '?weave=pattu'], ['Handloom', '?weave=handloom'], ['Embroidered', '?weave=embroidered']] },
      { title: 'By occasion', links: [['Sindoor Red', 'red'], ['Bridal', '?show=bridal'], ['Festive', '?weave=banarasi,kanjeevaram,pattu'], ['Temple wear', '?weave=kanjeevaram,pattu'], ['Everyday silk', '?weave=handloom,embroidered']] },
    ],
    feature: { image: IMG.redSilkGaze, title: 'The Sindoor Edit', line: 'Reds for every beginning', target: 'red' },
  },
  {
    label: 'Dresses',
    filter: 'dress',
    columns: [
      { title: 'Shop', links: [['Anarkalis', 'dress'], ['Kurta sets', 'dress'], ['Lehengas', 'dress']] },
      { title: 'By occasion', links: [['Wedding guest', 'dress'], ['Festive', 'dress'], ['Everyday', 'dress']] },
    ],
    feature: { image: IMG.jasmineBack, title: 'New for the season', line: 'Silk, zari and flare' },
  },
  {
    label: 'Kalakaari',
    filter: '?weave=kalakaari',
    columns: [
      { title: 'Kalakaari', links: [['Hand-painted sarees', '?weave=kalakaari'], ['Kalamkari silks', '?weave=kalakaari'], ['Heirloom drapes', '?weave=kalakaari']] },
      { title: 'Gifting', links: [['Under ₹10,000', '?price=under-10000'], ['Under ₹15,000', '?price=under-10000,10000-15000'], ['On sale', '?show=sale']] },
    ],
    feature: { image: IMG.kalakaariSeated, title: 'Kalakaari', line: 'Art that tells a story' },
  },
]);

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
