'use server';

/* Customer sign-in, sign-up and orders. The customer's token is kept in an httpOnly cookie. */
import { medusa, getAuthToken, setAuthToken, clearAuthToken, clearCartId, getCartId } from '../medusa';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function getCustomer() {
  if (!(await getAuthToken())) return null;
  try {
    const { customer } = await medusa('/store/customers/me', { auth: true, query: { fields: '*addresses' } });
    return customer || null;
  } catch {
    return null;
  }
}

async function claimCart() {
  const cartId = await getCartId();
  if (!cartId) return;
  try {
    await medusa(`/store/carts/${cartId}/customer`, { method: 'POST', auth: true });
  } catch {
    /* a bag that can't be claimed is simply left as is */
  }
}

export async function login(_prev, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!EMAIL_RE.test(email) || !password) return { error: 'Enter your email and password.' };
  try {
    const { token } = await medusa('/auth/customer/emailpass', { method: 'POST', body: { email, password } });
    await setAuthToken(token);
    await claimCart();
    return { ok: true };
  } catch (e) {
    return { error: e.status === 401 ? 'That email and password do not match.' : e.message };
  }
}

export async function register(_prev, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const first_name = String(formData.get('first_name') || '').trim();
  const last_name = String(formData.get('last_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  if (!first_name) return { error: 'Please enter your name.' };
  if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email address.' };
  if (password.length < 8) return { error: 'Use a password with at least 8 characters.' };
  try {
    const { token: regToken } = await medusa('/auth/customer/emailpass/register', {
      method: 'POST', body: { email, password },
    });
    await medusa('/store/customers', {
      method: 'POST', token: regToken, body: { email, first_name, last_name, ...(phone ? { phone } : {}) },
    });
    const { token } = await medusa('/auth/customer/emailpass', { method: 'POST', body: { email, password } });
    await setAuthToken(token);
    await claimCart();
    return { ok: true };
  } catch (e) {
    if (/exists/i.test(e.message)) return { error: 'An account with this email already exists. Please sign in.' };
    return { error: e.message };
  }
}

export async function logout() {
  await clearAuthToken();
  await clearCartId();
  return { ok: true };
}

/* The signed-in customer's orders, with each vendor's delivery progress and tracking number
   (backend: /store/my-order-groups, see src/lib/order-progress.ts). */
export async function listOrders() {
  if (!(await getAuthToken())) return [];
  try {
    const { order_groups = [] } = await medusa('/store/my-order-groups', { auth: true, query: { limit: 50 } });
    return order_groups;
  } catch {
    return [];
  }
}

export async function getOrderGroup(id) {
  if (!(await getAuthToken())) return null;
  try {
    const { order_group } = await medusa(`/store/my-order-groups/${encodeURIComponent(id)}`, { auth: true });
    return order_group || null;
  } catch {
    return null;
  }
}
