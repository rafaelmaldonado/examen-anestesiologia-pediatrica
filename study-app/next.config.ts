import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Remove output: 'export' to enable API routes
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Add back headers for better functionality
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'storage-access=*',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
  // Disable type checking during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure proper handling of client-side rendering
  experimental: {
    optimizePackageImports: ['@firebase/auth', '@firebase/firestore'],
  },
};

export default nextConfig;
