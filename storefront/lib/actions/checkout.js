'use server';

/* Checkout: contact + delivery address → one delivery option per vendor → place the order.
   No account needed: a guest gives an email and phone; signed-in customers use their account.
   Payment is the backend's manual (test) provider for now; Razorpay replaces it later.
   Completing the cart splits it into one order per vendor under a single order group,
   and the backend records the platform commission on each order. */
import { medusa, getCartId, clearCartId, getAuthToken, setLastOrder } from '../medusa';
import { fetchCart, toBag, friendlyError } from '../bag';

const PAYMENT_PROVIDER = process.env.CHECKOUT_PAYMENT_PROVIDER || 'pp_system_default';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Shipping options come back grouped by vendor: [{ seller: {id, name}, options: [...] }] */
export async function getDeliveryOptions() {
  const cartId = await getCartId();
  if (!cartId) return [];
  try {
    const { shipping_options } = await medusa('/store/shipping-options', { query: { cart_id: cartId }, auth: true });
    const groups = Array.isArray(shipping_options) ? { all: shipping_options } : shipping_options || {};
    return Object.entries(groups).map(([sellerId, options]) => ({
      sellerId,
      sellerName: options?.[0]?.seller?.name || 'Vendor',
      options: (options || []).map((o) => ({
        id: o.id,
        name: o.name,
        label: o.type?.label || o.name,
        description: o.type?.description || '',
        amount: Number(o.amount ?? o.calculated_price?.calculated_amount ?? 0),
      })),
    }));
  } catch {
    return [];
  }
}

export async function saveDelivery(_prev, formData) {
  const cartId = await getCartId();
  if (!cartId) return { error: 'Your bag is empty.' };
  const get = (k) => String(formData.get(k) || '').trim();
  const address = {
    first_name: get('first_name'),
    last_name: get('last_name'),
    phone: get('phone'),
    address_1: get('address_1'),
    address_2: get('address_2'),
    city: get('city'),
    province: get('province'),
    postal_code: get('postal_code'),
    country_code: 'in',
  };
  const email = get('email').toLowerCase();
  const signedIn = !!(await getAuthToken());
  if (!signedIn && !EMAIL_RE.test(email)) return { error: 'Enter your email address so we can confirm your order.' };
  const missing = ['first_name', 'phone', 'address_1', 'city', 'province', 'postal_code'].filter((k) => !address[k]);
  if (missing.length) return { error: 'Please fill in every field marked *.' };
  if (!/^\d{6}$/.test(address.postal_code)) return { error: 'Enter a 6-digit PIN code.' };
  if (!/^[+\d][\d\s-]{9,14}$/.test(address.phone)) return { error: 'Enter a valid mobile number.' };
  try {
    await medusa(`/store/carts/${cartId}`, {
      method: 'POST',
      auth: true,
      body: { ...(email ? { email } : {}), shipping_address: address, billing_address: address },
    });
    const bag = toBag(await fetchCart(cartId));
    const groups = await getDeliveryOptions();
    // Pick the cheapest (usually free) option for any vendor that has none yet, so the order can be placed in one click.
    for (const g of groups) {
      const sellerItems = bag?.shippingMethods || [];
      const has = g.options.some((o) => sellerItems.some((m) => m.optionId === o.id));
      const cheapest = [...g.options].sort((a, b) => a.amount - b.amount)[0];
      if (!has && cheapest) {
        await medusa(`/store/carts/${cartId}/shipping-methods`, {
          method: 'POST', auth: true, body: { option_id: cheapest.id },
        });
      }
    }
    return { ok: true, bag: toBag(await fetchCart(cartId)), groups };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function chooseDelivery(optionId) {
  const cartId = await getCartId();
  if (!cartId) return { error: 'Your bag is empty.' };
  try {
    await medusa(`/store/carts/${cartId}/shipping-methods`, { method: 'POST', auth: true, body: { option_id: optionId } });
    return { bag: toBag(await fetchCart(cartId)) };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function placeOrder() {
  const cartId = await getCartId();
  if (!cartId) return { error: 'Your bag is empty.' };
  try {
    const cart = await fetchCart(cartId);
    if (!cart?.items?.length) return { error: 'Your bag is empty.' };
    if (!cart.email) return { error: 'Please add your email address.' };
    if (!cart.shipping_address?.address_1) return { error: 'Please add a delivery address.' };

    let collection = cart.payment_collection;
    if (!collection) {
      ({ payment_collection: collection } = await medusa('/store/payment-collections', {
        method: 'POST', auth: true, body: { cart_id: cartId },
      }));
    }
    const hasSession = (collection.payment_sessions || []).some((s) => s.provider_id === PAYMENT_PROVIDER);
    if (!hasSession) {
      await medusa(`/store/payment-collections/${collection.id}/payment-sessions`, {
        method: 'POST', auth: true, body: { provider_id: PAYMENT_PROVIDER },
      });
    }

    const result = await medusa(`/store/carts/${cartId}/complete`, { method: 'POST', auth: true, body: {} });
    if (result.type === 'cart' || !result.order_group) {
      return { error: result.error?.message || 'The order could not be placed. Please check your details.' };
    }
    await clearCartId();
    // remembered in this browser so the confirmation page works without an account
    await setLastOrder(result.order_group.id, cart.email);
    return { ok: true, orderGroupId: result.order_group.id };
  } catch (e) {
    return { error: friendlyError(e) };
  }
}
