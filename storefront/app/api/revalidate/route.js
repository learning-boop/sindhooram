import { revalidateTag } from 'next/cache';

/* The backend calls this when a vendor publishes or changes a product, price or stock,
   so the shop shows the change straight away instead of after the 5-minute cache.
   Header x-revalidate-secret must match REVALIDATE_SECRET. Body: { tags: ['products', 'product-<handle>', ...] } */
export async function POST(request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  let tags = [];
  try { ({ tags = [] } = await request.json()); } catch { /* empty body */ }
  const all = new Set([...tags, 'products', 'offers']);
  all.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  return Response.json({ ok: true, revalidated: [...all] });
}
