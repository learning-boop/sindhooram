import { notFound } from 'next/navigation';
import ProductView from '@/components/store/ProductView';
import { getProduct } from '@/lib/catalog';
import { CONFIG } from '@/lib/config';

export const revalidate = 60; // the catalogue is cached for a minute (lib/catalog.js)

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) return { title: 'Not found' };
  const description = `${p.description.replace(/\s+/g, ' ')} ${p.seller ? `Sold by ${p.seller.name}.` : ''}`.trim();
  return {
    title: p.name,
    description,
    alternates: { canonical: `/products/${p.handle}` },
    openGraph: { title: `${p.name} · Sindhooram`, description, images: p.images.slice(0, 1), type: 'website' },
  };
}

export default async function ProductPage({ params }) {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description.replace(/\s+/g, ' '),
    image: p.images.map((src) => (src.startsWith('/') ? `${CONFIG.siteUrl}${src}` : src)),
    sku: p.handle,
    category: p.type === 'dress' ? 'Dresses' : 'Sarees',
    ...(p.seller ? { brand: { '@type': 'Brand', name: p.seller.name } } : {}),
    offers: {
      '@type': 'Offer',
      url: `${CONFIG.siteUrl}/products/${p.handle}`,
      priceCurrency: 'INR',
      price: p.price,
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      ...(p.seller ? { seller: { '@type': 'Organization', name: p.seller.name } } : {}),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ProductView product={p} />
    </>
  );
}
