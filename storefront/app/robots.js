import { CONFIG } from '@/lib/config';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/checkout', '/account', '/order/', '/track-order', '/api/'] }],
    sitemap: `${CONFIG.siteUrl}/sitemap.xml`,
  };
}
