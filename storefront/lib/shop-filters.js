/* Shop page filters, kept in the address bar so a filtered view can be shared or bookmarked:
     /shop?weave=banarasi,pattu&vendor=kanchi-silk-house&price=10000-15000&show=sindoor-red&stock=1&sort=price-asc&q=red
   Within one filter the choices add up (Banarasi OR Pattu); different filters narrow down (AND). */
import { CONFIG } from './config';

export const PRICE_BUCKETS = [
  { id: 'under-10000', label: 'Under ₹10,000', min: 0, max: 10000 },
  { id: '10000-15000', label: '₹10,000 – ₹15,000', min: 10000, max: 15000 },
  { id: '15000-20000', label: '₹15,000 – ₹20,000', min: 15000, max: 20000 },
  { id: 'over-20000', label: 'Above ₹20,000', min: 20000, max: Infinity },
];

export const HIGHLIGHTS = [
  { id: 'sindoor-red', label: 'Sindoor Red', test: (p) => p.red },
  { id: 'new', label: 'New arrivals', test: (p) => p.tags.includes('New') },
  { id: 'bridal', label: 'Bridal', test: (p) => p.tags.includes('Bridal') || p.categories.some((c) => c.handle === 'bridal') },
  { id: 'bestseller', label: 'Best sellers', test: (p) => p.tags.includes('Bestseller') },
  { id: 'handmade', label: 'Handmade', test: (p) => p.tags.includes('Handmade') },
  { id: 'sale', label: 'On sale', test: (p) => !!p.compareAt },
];

export const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest first' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
];

// Weaves listed in this order; any new sub-category a vendor uses follows, A to Z.
const WEAVE_ORDER = ['kanjeevaram', 'banarasi', 'pattu', 'handloom', 'embroidered', 'kalakaari', 'bridal'];

const LIST_KEYS = ['weave', 'vendor', 'price', 'show'];

/* URLSearchParams → { weave: Set, vendor: Set, price: Set, show: Set, stock, sort, q, type } */
export function readFilters(params) {
  const f = {};
  LIST_KEYS.forEach((k) => { f[k] = new Set((params.get(k) || '').split(',').map((v) => v.trim()).filter(Boolean)); });
  f.stock = params.get('stock') === '1';
  f.sort = SORTS.some((s) => s.id === params.get('sort')) ? params.get('sort') : 'featured';
  f.q = (params.get('q') || '').trim();
  f.type = params.get('type') || '';
  return f;
}

export function writeFilters(f) {
  const p = new URLSearchParams();
  LIST_KEYS.forEach((k) => { if (f[k]?.size) p.set(k, [...f[k]].join(',')); });
  if (f.stock) p.set('stock', '1');
  if (f.type) p.set('type', f.type);
  if (f.q) p.set('q', f.q);
  if (f.sort && f.sort !== 'featured') p.set('sort', f.sort);
  return p.toString();
}

export const activeCount = (f) => LIST_KEYS.reduce((n, k) => n + f[k].size, 0) + (f.stock ? 1 : 0) + (f.q ? 1 : 0);

const norm = (s) => String(s || '').toLowerCase();

/* Each filter as a test; `skip` leaves one filter out (to count that filter's own choices). */
function passes(p, f, wishlist, skip) {
  if (f.type && p.type !== f.type) return false;
  if (skip !== 'weave' && f.weave.size && !p.categories.some((c) => f.weave.has(c.handle))) return false;
  if (skip !== 'vendor' && f.vendor.size && !(p.seller && f.vendor.has(p.seller.handle))) return false;
  if (skip !== 'price' && f.price.size && !PRICE_BUCKETS.some((b) => f.price.has(b.id) && p.price >= b.min && p.price < b.max)) return false;
  if (skip !== 'show' && f.show.size && ![...f.show].some((id) => (id === 'wishlist'
    ? wishlist.includes(p.id)
    : HIGHLIGHTS.find((h) => h.id === id)?.test(p)))) return false;
  if (skip !== 'stock' && f.stock && !p.inStock) return false;
  if (f.q) {
    const hay = norm([p.name, p.collection, p.seller?.name, ...p.categories.map((c) => c.name), ...p.tags].join(' '));
    if (!norm(f.q).split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

const SORTERS = {
  featured: (a, b) => a.rank - b.rank || new Date(b.createdAt) - new Date(a.createdAt),
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

export function applyFilters(list, f, wishlist = []) {
  return list.filter((p) => passes(p, f, wishlist)).sort(SORTERS[f.sort] || SORTERS.featured);
}

/* The choices for each filter with how many pieces each would show. */
export function facetOptions(list, f, wishlist = []) {
  const count = (facet, test) => list.filter((p) => passes(p, f, wishlist, facet) && test(p)).length;

  const weaves = new Map();
  const vendors = new Map();
  list.forEach((p) => {
    p.categories.forEach((c) => weaves.set(c.handle, c.name));
    if (p.seller) vendors.set(p.seller.handle, p.seller.name);
  });
  const rank = (h) => (WEAVE_ORDER.includes(h) ? WEAVE_ORDER.indexOf(h) : 100);

  return {
    weave: [...weaves.entries()]
      .sort(([a, an], [b, bn]) => rank(a) - rank(b) || an.localeCompare(bn))
      .map(([id, label]) => ({ id, label, count: count('weave', (p) => p.categories.some((c) => c.handle === id)) })),
    price: PRICE_BUCKETS
      .map((b) => ({ id: b.id, label: b.label, count: count('price', (p) => p.price >= b.min && p.price < b.max) })),
    vendor: [...vendors.entries()]
      .sort(([, a], [, b]) => a.localeCompare(b))
      .map(([id, label]) => ({ id, label, count: count('vendor', (p) => p.seller?.handle === id) })),
    show: [
      ...HIGHLIGHTS.filter((h) => list.some(h.test)).map((h) => ({ id: h.id, label: h.label, count: count('show', h.test) })),
      ...(wishlist.length || f.show.has('wishlist')
        ? [{ id: 'wishlist', label: 'My wishlist', count: count('show', (p) => wishlist.includes(p.id)) }]
        : []),
    ],
    stock: count('stock', (p) => p.inStock),
  };
}

/* Older one-word shortcuts used around the site → shop address. */
export function shopHref(target = 'all') {
  if (typeof target === 'string' && target.startsWith('?')) return `/shop${target}`;
  const map = {
    all: '',
    saree: CONFIG.showDresses ? '?type=saree' : '',
    dress: '?type=dress',
    red: '?show=sindoor-red',
    new: '?show=new',
    wishlist: '?show=wishlist',
  };
  return `/shop${map[target] ?? ''}`;
}
