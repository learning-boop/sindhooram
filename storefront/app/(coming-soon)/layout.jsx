import '@/styles/coming-soon.css';
import { CONFIG } from '@/lib/config';

/* The coming-soon page has its own root layout (and its own stylesheet), like the separate page it was before. */
const INTRO_GUARD =
  "try{if(sessionStorage.getItem('sindhooram-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('intro-seen')}catch(e){}";

export const metadata = {
  metadataBase: new URL(CONFIG.siteUrl),
  title: 'Sindhooram — The color of tradition. The power of womanhood.',
  description: 'Sindhooram: handloom silk sarees and bridal reds. Kanjeevaram, Banarasi, Paithani and more, woven by master weavers.',
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    title: 'Sindhooram — The color of tradition. The power of womanhood.',
    description: 'Handloom silk sarees for every beginning. The color of tradition, the power of womanhood.',
    images: ['/og-image.jpg'],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = { themeColor: '#0f2b21', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function ComingSoonLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GUARD }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
