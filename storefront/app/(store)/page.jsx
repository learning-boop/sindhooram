import StoreHome from '@/components/store/StoreHome';
import { CONFIG } from '@/lib/config';

export const revalidate = 60; // the catalogue is cached for a minute (lib/catalog.js)

export default function HomePage() {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Sindhooram',
    url: CONFIG.siteUrl,
    logo: `${CONFIG.siteUrl}/logo-full.png`,
    description: 'Handloom silk sarees from India’s master weavers, sold directly by the weavers who make them.',
    ...(CONFIG.email ? { email: CONFIG.email } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, '\\u003c') }} />
      <StoreHome />
    </>
  );
}
