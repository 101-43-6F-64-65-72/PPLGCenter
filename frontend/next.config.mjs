/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    turbo: {
      // Pin turbopack project root to frontend directory to avoid
      // "Resource path needs to be on project filesystem" HMR crash
      // when multiple package-lock.json files exist in parent workspace.
      root: process.cwd(),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
