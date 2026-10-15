/** @type {import('next').NextConfig} */
const nextConfig = {
  // Defaults to .next. Set NEXT_DIST_DIR (e.g. .next-build) to run a production
  // build without touching the folder a running `next dev` server is using.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
