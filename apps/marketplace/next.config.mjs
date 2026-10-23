/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@automotive-os/ui', '@automotive-os/contracts'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
