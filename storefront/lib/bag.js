/* Shared helpers for the bag (server only). The server actions in lib/actions use these. */
import { medusa, getCartId, clearCartId } from './medusa';
import { NO_PHOTO, sizeLabel } from './config';

export const CART_FIELDS =
  '+items.metadata,*items.offer,*items.offer.seller,*items.product,*shipping_methods,*shipping_address,*payment_collection,*payment_collection.payment_sessions';

/* Bag shape used by the UI */
export function toBag(cart) {
  if (!cart) return null;
  const items = (cart.items || [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((i) => ({
      key: i.id,
      lineId: i.id,
      offerId: i.metadata?.offer_id || i.offer?.id || null,
      handle: i.product_handle || i.product?.handle,
      name: i.product_title || i.title,
      variant: sizeLabel(i.variant_title),
      image: i.thumbnail || NO_PHOTO,
      qty: i.quantity,
      unitPrice: Number(i.unit_price),
      total: Number(i.unit_price) * i.quantity,
      seller: i.offer?.seller
        ? { id: i.offer.seller.id, name: i.offer.seller.name, handle: i.offer.seller.handle }
        : null,
    }));
  return {
    id: cart.id,
    email: cart.email || '',
    customerId: cart.customer_id || null,
    items,
    count: items.reduce((s, l) => s + l.qty, 0),
    subtotal: Number(cart.item_subtotal ?? cart.subtotal ?? 0),
    shippingTotal: Number(cart.shipping_total ?? 0),
    total: Number(cart.total ?? 0),
    // Medusa pre-fills a country-only address for single-country regions; it only counts once the street is set.
    shippingAddress: cart.shipping_address?.address_1 ? cart.shipping_address : null,
    shippingMethods: (cart.shipping_methods || []).map((m) => ({
      id: m.id,
      optionId: m.shipping_option_id,
      amount: Number(m.amount),
    })),
  };
}

/* The open cart, or null. A completed cart is forgotten. */
export async function fetchCart(id) {
  const cartId = id || (await getCartId());
  if (!cartId) return null;
  try {
    const { cart } = await medusa(`/store/carts/${cartId}`, { query: { fields: CART_FIELDS }, auth: true });
    if (cart?.completed_at) {
      await clearCartId().catch(() => {});
      return null;
    }
    return cart;
  } catch {
    return null;
  }
}

export function friendlyError(e) {
  const m = e?.message || '';
  if (/inventory|stock|quantity/i.test(m)) return 'Sorry, there are not enough pieces in stock.';
  if (/not reachable/i.test(m)) return 'The shop is not reachable right now. Please try again in a minute.';
  return m || 'Something went wrong. Please try again.';
}
