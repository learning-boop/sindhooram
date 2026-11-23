import { notFound } from 'next/navigation';
import SellerView from '@/components/store/SellerView';
import { getSeller, listCatalog } from '@/lib/catalog';

export const revalidate = 60; // the catalogue is cached for a minute (lib/catalog.js)

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const seller = await getSeller(handle);
  if (!seller) return { title: 'Not found' };
  return {
    title: `${seller.name} — weaver on Sindhooram`,
    description: seller.description || `Sarees from ${seller.name}, sold on Sindhooram.`,
    alternates: { canonical: `/sellers/${handle}` },
  };
}

export default async function SellerPage({ params }) {
  const { handle } = await params;
  const [seller, catalog] = await Promise.all([getSeller(handle), listCatalog()]);
  if (!seller) notFound();
  const products = catalog.filter((p) => p.seller?.handle === handle);
  return <SellerView seller={seller} products={products} />;
}
