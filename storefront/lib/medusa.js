/* Server-side client for the Sindhooram backend (Mercur on Medusa).
   Every request carries the storefront's publishable key; customer requests also carry the
   customer's token from the httpOnly cookie. Only import this from server code. */
import { cookies } from 'next/headers';

export const BACKEND_URL = (process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000').replace(/\/$/, '');
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

export const CART_COOKIE = '_sh_cart';
export const AUTH_COOKIE = '_sh_jwt';
// The last order placed in this browser ({ id, email }), so a guest can see it again and save it to an account
export const ORDER_COOKIE = '_sh_order';

export class MedusaError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function buildUrl(path, query) {
  const url = new URL(`${BACKEND_URL}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(`${key}[]`, v));
    else url.searchParams.set(key, String(value));
  });
  return url;
}

/**
 * medusa('/store/products', { query, next: { revalidate, tags } })   cached catalogue read
 * medusa('/store/carts', { method: 'POST', body, auth: true })      customer write (no cache)
 */
export async function medusa(path, { method = 'GET', body, query, next, auth = false, token } = {}) {
  const headers = { accept: 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY };
  if (body !== undefined) headers['content-type'] = 'application/json';

  const bearer = token || (auth ? await getAuthToken() : null);
  if (bearer) headers.authorization = `Bearer ${bearer}`;

  const init = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (next && method === 'GET' && !bearer) init.next = next;
  else init.cache = 'no-store';

  let res;
  try {
    res = await fetch(buildUrl(path, query), init);
  } catch (e) {
    throw new MedusaError(`The shop is not reachable right now (${e.message}).`, 503);
  }
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!res.ok) throw new MedusaError(data.message || `Request failed (${res.status})`, res.status);
  return data;
}

export async function getAuthToken() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE)?.value || null;
}

export async function getCartId() {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value || null;
}

// Secure (HTTPS-only) cookies in production, except when the site itself runs on plain http
// (Docker on your Mac: http://localhost:3000), where Safari would drop them and the bag would stay empty.
const secureCookies =
  process.env.NODE_ENV === 'production' && !(process.env.NEXT_PUBLIC_SITE_URL || '').startsWith('http://');
const cookieBase = { httpOnly: true, sameSite: 'lax', secure: secureCookies, path: '/' };

export async function setCartId(id) {
  const jar = await cookies();
  jar.set(CART_COOKIE, id, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearCartId() {
  const jar = await cookies();
  jar.set(CART_COOKIE, '', { ...cookieBase, maxAge: -1 });
}

export async function setAuthToken(token) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearAuthToken() {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, '', { ...cookieBase, maxAge: -1 });
}

export async function setLastOrder(id, email) {
  const jar = await cookies();
  jar.set(ORDER_COOKIE, JSON.stringify({ id, email }), { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function getLastOrder() {
  const jar = await cookies();
  try {
    const value = JSON.parse(jar.get(ORDER_COOKIE)?.value || 'null');
    return value?.id && value?.email ? value : null;
  } catch {
    return null;
  }
}

/* The India region (INR). Cached for an hour. */
export async function getRegion() {
  const { regions = [] } = await medusa('/store/regions', { next: { revalidate: 3600, tags: ['regions'] } });
  return regions.find((r) => r.countries?.some((c) => c.iso_2 === 'in')) || regions[0] || null;
}
