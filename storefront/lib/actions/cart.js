'use server';

/* The bag lives on the backend as a Medusa cart; its id is kept in an httpOnly cookie.
   One bag can hold pieces from several vendors — at checkout it becomes one order per vendor. */
import { medusa, getRegion, getCartId, setCartId } from '../medusa';
import { fetchCart, toBag, friendlyError } from '../bag';

async function ensureCart() {
  const existing = await fetchCart();
  if (existing) return existing;
  const region = await getRegion();
  if (!region) throw new Error('The shop is not set up yet (no region).');
  const { cart } = await medusa('/store/carts', { method: 'POST', body: { region_id: region.id }, auth: true });
  await setCartId(cart.id);
  return cart;
}

export async function getBag() {
  try {
    return toBag(await fetchCart());
  } catch {
    return null;
  }
}

export async function addToBag(offerId, qty = 1) {
  if (!offerId) return { error: 'This piece is not available right now.' };
  try {
    const cart = await ensureCart();
    const line = (cart.items || []).find((i) => i.metadata?.offer_id === offerId);
    if (line) {
      await medusa(`/store/carts/${cart.id}/line-items/${line.id}`, {
        method: 'POST', body: { quantity: line.quantity + qty }, auth: true,
      });
    } else {
      await medusa(`/store/carts/${cart.id}/line-items`, {
        method: 'POST', body: { offer_id: offerId, quantity: qty }, auth: true,
      });
    }
    return { bag: toBag(await fetchCart(cart.id)) };
  } catch (e) {
    return { error: friendlyError(e), bag: toBag(await fetchCart()) };
  }
}

export async function setLineQty(lineId, qty) {
  const cartId = await getCartId();
  if (!cartId) return { bag: null };
  try {
    if (qty <= 0) {
      await medusa(`/store/carts/${cartId}/line-items/${lineId}`, { method: 'DELETE', auth: true });
    } else {
      await medusa(`/store/carts/${cartId}/line-items/${lineId}`, {
        method: 'POST', body: { quantity: qty }, auth: true,
      });
    }
    return { bag: toBag(await fetchCart(cartId)) };
  } catch (e) {
    return { error: friendlyError(e), bag: toBag(await fetchCart(cartId)) };
  }
}
