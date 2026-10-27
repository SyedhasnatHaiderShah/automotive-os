/** @type {import('next').NextConfig} */
const dealerServiceUrl = process.env.DEALER_SERVICE_URL || 'http://localhost:3001';
const adminServiceUrl = process.env.ADMIN_SERVICE_URL || 'http://localhost:3002';
const apiServiceUrl = process.env.API_SERVICE_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@automotive-os/ui', '@automotive-os/contracts'],
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/dealer/:path*',
        destination: `${dealerServiceUrl}/dealer/:path*`,
      },
      {
        source: '/admin/:path*',
        destination: `${adminServiceUrl}/admin/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiServiceUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
