/* ======================= THE CATALOGUE =======================
   Add, remove or edit products here. Every product needs a unique `id`.
   `type` is 'saree' or 'dress' (drives the filter tabs and the size picker).
   `images` = [main, hover]. Photos live in src/assets/site/; import new ones below.
   Dresses stay hidden until CONFIG.showDresses is true (see config.js).
   ============================================================= */
import { CONFIG } from '../config';
import hero from '../assets/site/hero.jpg';
import heroWoman from '../assets/site/hero-woman.jpg';
import exploreWall from '../assets/site/explore-wall.jpg';
import archIvory from '../assets/site/arch-ivory.jpg';
import archIvoryDetail from '../assets/site/arch-ivory-detail.jpg';
import archBlush from '../assets/site/arch-blush.jpg';
import archBlushDetail from '../assets/site/arch-blush-detail.jpg';
import archBridal from '../assets/site/arch-bridal.jpg';
import archBridalDetail from '../assets/site/arch-bridal-detail.jpg';
import embroidered from '../assets/site/embroidered-window.jpg';
import embroideredDetail from '../assets/site/embroidered-window-detail.jpg';
import womenCard from '../assets/site/women-card.jpg';
import womenCardWoman from '../assets/site/women-card-woman.jpg';
import kalakaariWindow from '../assets/site/kalakaari-window.jpg';
import kalakaariWindowWoman from '../assets/site/kalakaari-window-woman.jpg';
import kalakaariSeated from '../assets/site/kalakaari-seated.jpg';
import kalakaariSeatedDetail from '../assets/site/kalakaari-seated-detail.jpg';
import kalamkariDrape from '../assets/site/kalamkari-drape.jpg';
import kalamkariDrapeDetail from '../assets/site/kalamkari-drape-detail.jpg';
import redJasmine from '../assets/site/red/red-jasmine.jpg';
import redJasmineGarland from '../assets/site/red/red-jasmine-garland.jpg';
import redJasmineEvening from '../assets/site/red/red-jasmine-evening.jpg';
import redSilkGaze from '../assets/site/red/red-silk-gaze.jpg';
import redSilkPortrait from '../assets/site/red/red-silk-portrait.jpg';
import redRiverDusk from '../assets/site/red/red-river-dusk.jpg';
import redLamps from '../assets/site/red/red-lamps.jpg';
import redIvoryTemple from '../assets/site/red/red-ivory-temple.jpg';
import redIvoryGold from '../assets/site/red/red-ivory-gold.jpg';
import maroonLamps from '../assets/site/red/maroon-lamps.jpg';
import templePond from '../assets/store/temple-pond.jpg';
import overShoulder from '../assets/store/over-shoulder.jpg';
import jasmineBack from '../assets/store/jasmine-back.jpg';
import portraitSmile from '../assets/store/portrait-smile.jpg';

export const IMG = {
  hero, heroWoman, exploreWall, archIvory, archBlush, archBridal, embroidered, embroideredDetail,
  womenCard, kalakaariWindow, kalakaariSeated, kalamkariDrape, kalamkariDrapeDetail,
  archBlushDetail, archBridalDetail, archIvoryDetail, redJasmine, redSilkGaze,
};

/* CONFIG.showDresses: false hides every dress product, menu, tab and card until dress photos are ready. */
export const SHOW_DRESSES = !!CONFIG.showDresses;
const withDresses = (list) => (SHOW_DRESSES ? list : list.filter((x) => x.type !== 'dress' && x.filter !== 'dress'));

export const DRESS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ALL_PRODUCTS = [
  /* The Sindoor Edit: red sarees modelled by the Sindhooram face (`red: true` puts them in that section and tab) */
  {
    id: 'sindoor-jasmine-silk',
    name: 'Sindoor Jasmine Silk',
    type: 'saree',
    collection: 'Sindoor Edit',
    red: true,
    price: 13900,
    tag: 'Bestseller',
    images: [redJasmine, redJasmineGarland],
    description: 'Vermillion silk with a fine gold border, made for evenings with jasmine in your hair.',
    details: ['Pure silk · zari border', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'rajamahal-red-banarasi',
    name: 'Rajamahal Red Banarasi',
    type: 'saree',
    collection: 'Sindoor Edit',
    red: true,
    price: 16500,
    compareAt: 18900,
    images: [redSilkGaze, redSilkPortrait],
    description: 'Deep red katan silk with a woven gold pallu, rich enough for a wedding and light enough to dance in.',
    details: ['Katan silk · zari pallu', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'temple-lamp-kanjeevaram',
    name: 'Temple Lamp Kanjeevaram',
    type: 'saree',
    collection: 'Sindoor Edit',
    red: true,
    price: 21800,
    tag: 'Bridal',
    images: [redRiverDusk, redLamps],
    description: 'Red Kanjeevaram silk with gold buttis and a broad temple border, woven for the brightest days.',
    details: ['Pure silk · real zari', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'ivory-red-pattu',
    name: 'Ivory & Red Pattu Silk',
    type: 'saree',
    collection: 'Sindoor Edit',
    red: true,
    price: 15400,
    tag: 'New',
    images: [redIvoryTemple, redIvoryGold],
    description: 'An ivory body with a vermillion and gold pallu, the classic pairing for a temple morning.',
    details: ['Pattu silk · zari border', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'evening-maroon-silk',
    name: 'Evening Maroon Silk',
    type: 'saree',
    collection: 'Sindoor Edit',
    red: true,
    price: 11900,
    images: [redJasmineEvening, maroonLamps],
    description: 'Wine-red soft silk with a quiet gold edge, for lamp-lit evenings.',
    details: ['Soft silk', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'ivory-zari-kasavu',
    name: 'Ivory Zari Kasavu Silk',
    type: 'saree',
    collection: 'Handloom',
    price: 12900,
    tag: 'Bestseller',
    images: [archIvory, heroWoman],
    description: 'Ivory handloom silk with a fine gold zari border, light enough for a morning puja and quiet enough for every day after.',
    details: ['Handloom silk · zari border', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'blush-rose-banarasi',
    name: 'Blush Rose Banarasi',
    type: 'saree',
    collection: 'Banarasi',
    price: 14500,
    compareAt: 16900,
    images: [archBlush, archBlushDetail],
    description: 'Blush-pink katan silk scattered with gold floral buttis and finished with a woven brocade pallu.',
    details: ['Katan silk', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'vermillion-bridal-kanjeevaram',
    name: 'Vermillion Bridal Kanjeevaram',
    type: 'saree',
    collection: 'Bridal',
    price: 24500,
    tag: 'Bridal',
    images: [archBridal, archBridalDetail],
    description: 'Sindoor-red Kanjeevaram silk with a broad gold korvai border, woven for the wedding morning.',
    details: ['Pure silk · real zari', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'pearl-embroidered-silk',
    name: 'Pearl Embroidered Silk',
    type: 'saree',
    collection: 'Embroidered',
    price: 11800,
    tag: 'New',
    images: [embroidered, embroideredDetail],
    description: 'Cream silk with tone-on-tone and blush thread embroidery that catches the light as you move.',
    details: ['Silk · hand embroidery', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'kalakaari-hand-painted',
    name: 'Kalakaari Hand-painted Silk',
    type: 'saree',
    collection: 'Kalakaari',
    price: 9800,
    tag: 'Handmade',
    images: [kalakaariSeated, kalakaariSeatedDetail],
    description: 'Kalamkari florals painted by hand on soft silk, in madder red, rust and cream.',
    details: ['Silk · hand painted', '6.3 m including blouse piece', 'Gentle hand wash'],
  },
  {
    id: 'kalakaari-rust-silk',
    name: 'Kalakaari Rust Silk',
    type: 'saree',
    collection: 'Kalakaari',
    price: 8900,
    images: [kalakaariWindowWoman, kalamkariDrapeDetail],
    description: 'A rust-bordered Kalamkari silk with dense floral jaal, made for slow afternoons.',
    details: ['Silk · hand painted', '6.3 m including blouse piece', 'Gentle hand wash'],
  },
  {
    id: 'heirloom-kalamkari-drape',
    name: 'Heirloom Kalamkari Drape',
    type: 'saree',
    collection: 'Kalakaari',
    price: 10400,
    compareAt: 11900,
    images: [kalamkariDrape, kalamkariDrapeDetail],
    description: 'Indigo, madder and cream paisleys painted across the whole drape, edged with a woven border.',
    details: ['Silk · hand painted', '6.3 m including blouse piece', 'Gentle hand wash'],
  },
  {
    id: 'candlelight-banarasi',
    name: 'Candlelight Ivory Banarasi',
    type: 'saree',
    collection: 'Banarasi',
    price: 15200,
    tag: 'New',
    images: [womenCardWoman, archIvoryDetail],
    description: 'Ivory Banarasi with soft blush and gold floral weaving, made for evenings lit by diyas.',
    details: ['Banarasi silk', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'temple-pond-pattu',
    name: 'Temple Pond Pattu',
    type: 'saree',
    collection: 'Kanjeevaram',
    price: 12400,
    images: [overShoulder, templePond],
    description: 'Navy and rust pattu silk with a contrast korvai border, made for mornings at the temple.',
    details: ['Pattu silk', '6.3 m including blouse piece', 'Dry clean only'],
  },
  {
    id: 'zari-anarkali',
    name: 'Zari Anarkali Gown',
    type: 'dress',
    collection: 'Festive',
    price: 8900,
    tag: 'New',
    images: [jasmineBack, overShoulder],
    description: 'A floor-length anarkali in silk with a zari-woven yoke and a full flare. Includes dupatta.',
    details: ['Silk blend · lined', 'Gown + dupatta', 'Dry clean only'],
  },
  {
    id: 'mulberry-kurta-set',
    name: 'Mulberry Silk Kurta Set',
    type: 'dress',
    collection: 'Kurta Sets',
    price: 4800,
    images: [portraitSmile, templePond],
    description: 'Straight kurta with zari buttis, matching pants and a sheer organza dupatta.',
    details: ['Silk blend', 'Kurta + pants + dupatta', 'Dry clean only'],
  },
];

export const PRODUCTS = withDresses(ALL_PRODUCTS);
export const RED_EDIT = PRODUCTS.filter((p) => p.red);

export const NAV = withDresses([
  {
    label: 'Sarees',
    filter: 'saree',
    columns: [
      { title: 'By weave', links: ['Kanjeevaram', 'Banarasi', 'Handloom', 'Embroidered'] },
      { title: 'By occasion', links: ['Sindoor Red', 'Bridal', 'Festive', 'Temple wear', 'Everyday silk'] },
    ],
    feature: { image: redSilkGaze, title: 'The Sindoor Edit', line: 'Reds for every beginning' },
  },
  {
    label: 'Dresses',
    filter: 'dress',
    columns: [
      { title: 'Shop', links: ['Anarkalis', 'Kurta sets', 'Lehengas'] },
      { title: 'By occasion', links: ['Wedding guest', 'Festive', 'Everyday'] },
    ],
    feature: { image: jasmineBack, title: 'New for the season', line: 'Silk, zari and flare' },
  },
  {
    label: 'Kalakaari',
    filter: 'all',
    columns: [
      { title: 'Kalakaari', links: ['Hand-painted sarees', 'Kalamkari silks', 'Heirloom drapes'] },
      { title: 'Gifting', links: ['Under ₹10,000', 'Under ₹15,000', 'Gift cards'] },
    ],
    feature: { image: kalakaariSeated, title: 'Kalakaari', line: 'Art that tells a story' },
  },
]);

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
