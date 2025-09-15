import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts'); 
// path opsiyonel; default ta zaten src/i18n/request.ts aranır ama burada netleştiriyoruz

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: { styledComponents: true },
  async rewrites() {
    const origin = process.env.BACKEND_ORIGIN || 'http://localhost:5035';
    return [{ source: '/api/:path*', destination: `${origin}/api/:path*` }];
  }
};

export default withNextIntl(nextConfig);
