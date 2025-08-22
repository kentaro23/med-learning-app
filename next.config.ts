import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
  },
  distDir: '.next',
  pageExtensions: ['ts', 'tsx'],
  /* config options here */
};

export default nextConfig;
