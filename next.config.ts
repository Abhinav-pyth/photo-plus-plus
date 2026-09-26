import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // No API routes, no rewrites, no upload endpoints — by design.
  // PixelBoost serves the app shell only; every photo stays in the browser.
};

export default nextConfig;
