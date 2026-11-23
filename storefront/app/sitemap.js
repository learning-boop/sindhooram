import { listCatalog } from '@/lib/catalog';
import { CONFIG } from '@/lib/config';

export const revalidate = 3600;

export default async function sitemap() {
  const catalog = await listCatalog();
  const sellers = [...new Set(catalog.map((p) => p.seller?.handle).filter(Boolean))];
  const now = new Date();
  return [
    { url: `${CONFIG.siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${CONFIG.siteUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...catalog.map((p) => ({ url: `${CONFIG.siteUrl}/products/${p.handle}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 })),
    ...sellers.map((h) => ({ url: `${CONFIG.siteUrl}/sellers/${h}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 })),
  ];
}
