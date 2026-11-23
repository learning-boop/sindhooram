import '@/styles/store.css';
import '@/styles/marketplace.css';
import StoreShell from '@/components/store/StoreShell';
import { listCatalog } from '@/lib/catalog';
import { CONFIG } from '@/lib/config';
import { CURTAIN_GUARD } from '@/lib/curtain-guard';

const DESCRIPTION =
  'Sindhooram: handloom silk sarees and bridal reds from India’s master weavers. Kanjeevaram, Banarasi, Kalamkari and more, sold directly by the weavers who make them.';

export const metadata = {
  metadataBase: new URL(CONFIG.siteUrl),
  title: { default: 'Sindhooram — The color of tradition. The power of womanhood.', template: '%s · Sindhooram' },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    siteName: 'Sindhooram',
    title: 'Sindhooram — The color of tradition. The power of womanhood.',
    description: 'Handloom silk sarees for every beginning. The color of tradition, the power of womanhood.',
    images: ['/og-image.jpg'],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  themeColor: '#0f2b21',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function StoreLayout({ children }) {
  const catalog = await listCatalog();
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CURTAIN_GUARD }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@400;500;600&family=Pinyon+Script&display=swap"
        />
      </head>
      <body>
        <StoreShell catalog={catalog}>{children}</StoreShell>
      </body>
    </html>
  );
}
