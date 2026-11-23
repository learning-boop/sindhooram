import { Suspense } from 'react';
import ShopPage from '@/components/store/ShopPage';
import { CONFIG } from '@/lib/config';

// Rendered per request so the first page already shows the filtered pieces (the catalogue itself is cached).
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop all sarees',
  description: 'Every saree on Sindhooram: Kanjeevaram, Banarasi, Pattu, handloom and hand-painted Kalakaari, straight from the weavers. Filter by weave, price and weaver.',
  alternates: { canonical: `${CONFIG.siteUrl}/shop` },
};

export default function Page() {
  // the filters come from the address bar; the catalogue comes from the store layout
  return (
    <Suspense fallback={null}>
      <ShopPage />
    </Suspense>
  );
}
