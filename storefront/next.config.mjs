/** @type {import('next').NextConfig} */
const mode = process.env.NEXT_PUBLIC_SITE_MODE || 'store';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // NEXT_PUBLIC_SITE_MODE=coming-soon shows the countdown page at "/" (the shop stays at its other addresses).
  async rewrites() {
    if (mode !== 'coming-soon') return [];
    return { beforeFiles: [{ source: '/', destination: '/coming-soon' }] };
  },
};

export default nextConfig;
