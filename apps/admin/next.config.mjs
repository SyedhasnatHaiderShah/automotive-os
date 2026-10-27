/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/admin',
  transpilePackages: ['@automotive-os/ui', '@automotive-os/contracts'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
