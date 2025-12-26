const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',

  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },

  eslint: {
    ignoredDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;