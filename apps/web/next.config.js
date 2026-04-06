/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['tile.openstreetmap.org', 'placehold.co'],
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'tile.openstreetmap.org' },
    ],
  },
};

module.exports = nextConfig;
