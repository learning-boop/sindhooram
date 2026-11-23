'use server';

/* Orders without an account: look one up by email + order number, show the order this browser
   just placed, and (optionally) save a guest order into a new or existing account. */
import { medusa, getAuthToken, getLastOrder } from '../medusa';
import { login, register } from './account';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function lookup(email, order) {
  const { order_group } = await medusa('/store/order-lookup', { method: 'POST', body: { email, order } });
  return order_group || null;
}

/* Track order form: { email, order } → { group } or { error } */
export async function trackOrder(_prev, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const order = String(formData.get('order') || '').trim();
  if (!EMAIL_RE.test(email) || !order) return { error: 'Enter the email you ordered with and your order number.', email, order };
  try {
    return { group: await lookup(email, order), email, order };
  } catch (e) {
    return {
      error: e.status === 404 ? 'We could not find an order with that number and email. Please check both.' : e.message,
      email,
      order,
    };
  }
}

/* The order this browser placed last (a guest's confirmation page), or null. */
export async function getLastOrderGroup(id) {
  const last = await getLastOrder();
  if (!last || last.id !== id) return null;
  try {
    const group = await lookup(last.email, last.id);
    return group ? { group, email: last.email } : null;
  } catch {
    return null;
  }
}

/* Moves the guest order into the signed-in customer's account (same email only). */
async function claim(orderGroupId) {
  await medusa('/store/order-lookup/claim', { method: 'POST', auth: true, body: { order_group_id: orderGroupId } });
}

/* Confirmation page: "Save this order to an account". Creates the account (or signs in), then claims the order. */
export async function saveOrderToAccount(_prev, formData) {
  const mode = String(formData.get('mode') || 'register');
  const last = await getLastOrder();
  const orderGroupId = String(formData.get('order_group_id') || '');
  if (!last || last.id !== orderGroupId) return { error: 'This order can no longer be saved from this browser. Use Track order instead.' };

  if (mode === 'claim') {
    if (!(await getAuthToken())) return { error: 'Please sign in first.' };
  } else {
    const result = mode === 'login' ? await login(null, formData) : await register(null, formData);
    if (!result?.ok) return { error: result?.error || 'Something went wrong. Please try again.', mode };
  }
  try {
    await claim(orderGroupId);
    return { ok: true };
  } catch (e) {
    return { error: e.message || 'The order could not be added to your account.', signedIn: true };
  }
}
