/* The catalogue, read from the backend and shaped the way the store's components expect:
   { id, handle, name, type, collection, red, price, compareAt, tag, tags, categories, images,
     description, details, seller, offerId, variants, stock, inStock }.
   Reads are cached for a minute, and refreshed straight away when the backend calls
   /api/revalidate after a product is approved or a price, stock or order changes. */
import { medusa, getRegion } from './medusa';
import { NO_PHOTO } from './config';

const PRODUCT_FIELDS = [
  'id', 'title', 'handle', 'description', 'thumbnail', 'material', 'metadata', 'created_at',
  '*images', '*collection', '*tags', '*categories', '*categories.parent_category',
  '*variants', '*variants.calculated_price', '+variants.offer_id', '*variants.options',
].join(',');

const OFFER_FIELDS = '+seller.name,+seller.handle,+calculated_price,+inventory_quantity,+product.handle';
// A minute at most: the backend refreshes the cache at once on every change; this is the safety net.
const CATALOG_TTL = 60;
const CACHE = { revalidate: CATALOG_TTL, tags: ['products', 'offers'] };

const unique = (list) => [...new Set(list.filter(Boolean))];
// a product without photos shows the "photo coming soon" card instead of a broken image
const withPhoto = (list) => (list.length ? list : [NO_PHOTO]);

/* Vendors write descriptions in the panel's text editor, which saves HTML ("<p>…</p>"). The shop
   shows plain text: tags removed, paragraphs kept as blank lines, list items as "• " lines. */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export function plainText(html = '') {
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<\/\s*li\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|h[1-6]|ul|ol|blockquote)\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    })
    .replace(/[ \t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\n(?=• )/g, '\n')
    .trim();
}

function typeOf(product) {
  const handles = (product.categories || []).flatMap((c) => [c.handle, c.parent_category?.handle]);
  return handles.includes('dresses') ? 'dress' : 'saree';
}

function collectionLabel(product) {
  if (product.collection?.title) return product.collection.title;
  const leaf = (product.categories || []).find((c) => c.parent_category_id);
  return leaf?.name || (product.categories || [])[0]?.name || (typeOf(product) === 'dress' ? 'Dresses' : 'Sarees');
}

function priceOf(variant) {
  const p = variant?.calculated_price;
  if (!p) return null;
  return { price: Number(p.calculated_amount), original: Number(p.original_amount ?? p.calculated_amount) };
}

/* Shape one backend product (+ its offers) for the store UI. */
export function toProduct(product, offers = []) {
  const variants = (product.variants || [])
    .map((v) => {
      const pr = priceOf(v);
      const offer = offers.find((o) => o.variant_id === v.id && (!v.offer_id || o.id === v.offer_id))
        || offers.find((o) => o.variant_id === v.id);
      return {
        id: v.id,
        title: v.title,
        offerId: v.offer_id || offer?.id || null,
        price: pr?.price ?? null,
        original: pr?.original ?? null,
        stock: offer ? Number(offer.inventory_quantity ?? 0) : null,
      };
    })
    .filter((v) => v.offerId && v.price !== null);

  if (!variants.length) return null; // no vendor is selling it yet

  const cheapest = [...variants].sort((a, b) => a.price - b.price)[0];
  const winner = offers.find((o) => o.id === cheapest.offerId) || offers[0];
  const meta = product.metadata || {};
  const compareMeta = Number(meta.compare_at) || 0;
  const compareAt = cheapest.original > cheapest.price
    ? cheapest.original
    : compareMeta > cheapest.price ? compareMeta : null;

  const details = Array.isArray(meta.details) && meta.details.length
    ? meta.details
    : unique([product.material, '6.3 m including blouse piece']);

  const stock = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  // the weave (sub-category, e.g. Banarasi under Sarees) and tags, for the shop filters
  const categories = (product.categories || [])
    .filter((c) => c.parent_category_id || c.parent_category)
    .map((c) => ({ handle: c.handle, name: c.name }));
  return {
    id: product.handle,
    productId: product.id,
    handle: product.handle,
    name: product.title,
    type: typeOf(product),
    collection: collectionLabel(product),
    red: product.collection?.handle === 'sindoor-edit',
    price: cheapest.price,
    compareAt,
    tag: product.tags?.[0]?.value || null,
    tags: (product.tags || []).map((t) => t.value),
    categories,
    images: withPhoto(unique([product.thumbnail, ...(product.images || []).map((i) => i.url)])),
    description: plainText(product.description || ''),
    details,
    offerId: cheapest.offerId,
    variants,
    stock,
    inStock: variants.some((v) => v.stock === null || v.stock > 0),
    seller: winner?.seller ? { name: winner.seller.name, handle: winner.seller.handle } : null,
    rank: Number.isFinite(Number(meta.rank)) ? Number(meta.rank) : 1000,
    createdAt: product.created_at,
  };
}

const byRank = (a, b) => a.rank - b.rank || new Date(b.createdAt) - new Date(a.createdAt);

async function fetchOffers(regionId, extra = {}) {
  const { offers = [] } = await medusa('/store/offers', {
    query: { region_id: regionId, limit: 500, fields: OFFER_FIELDS, ...extra },
    next: CACHE,
  });
  return offers;
}

function groupOffers(offers) {
  const map = new Map();
  offers.forEach((o) => {
    const id = o.product_id || o.product?.id;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(o);
  });
  return map;
}

/* Every product on sale. Returns [] (and logs) if the backend is unreachable, so pages still render. */
export async function listCatalog() {
  try {
    const region = await getRegion();
    if (!region) return [];
    const [{ products = [] }, offers] = await Promise.all([
      medusa('/store/products', {
        query: { region_id: region.id, limit: 200, fields: PRODUCT_FIELDS, order: '-created_at' },
        next: CACHE,
      }),
      fetchOffers(region.id),
    ]);
    const byProduct = groupOffers(offers);
    return products.map((p) => toProduct(p, byProduct.get(p.id) || [])).filter(Boolean).sort(byRank);
  } catch (e) {
    console.error('[catalog] could not load products:', e.message);
    return [];
  }
}

export async function getProduct(handle) {
  try {
    const region = await getRegion();
    if (!region) return null;
    const { products = [] } = await medusa('/store/products', {
      query: { region_id: region.id, handle, limit: 1, fields: PRODUCT_FIELDS },
      next: { revalidate: CATALOG_TTL, tags: ['products', `product-${handle}`] },
    });
    if (!products[0]) return null;
    const offers = await fetchOffers(region.id, { product_id: products[0].id });
    return toProduct(products[0], offers);
  } catch (e) {
    console.error('[catalog] could not load product:', e.message);
    return null;
  }
}

export async function getSeller(handle) {
  try {
    const { sellers = [] } = await medusa('/store/sellers', {
      query: { handle, limit: 1 },
      next: { revalidate: 600, tags: ['sellers'] },
    });
    return sellers[0] || null;
  } catch (e) {
    console.error('[catalog] could not load seller:', e.message);
    return null;
  }
}
