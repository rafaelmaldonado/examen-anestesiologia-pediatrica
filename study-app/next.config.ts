import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Remove async headers for export
  // Ensure proper handling of client-side rendering
  experimental: {
    optimizePackageImports: ['@firebase/auth', '@firebase/firestore'],
  },
};

export default nextConfig;
