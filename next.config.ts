import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Explicitly inline geo test override so Edge Runtime middleware can read it.
    // NEXT_PUBLIC_ alone isn't enough when the var is added after first build cache.
    GEO_TEST_COUNTRY: process.env.NEXT_PUBLIC_GEO_TEST_COUNTRY ?? process.env.GEO_TEST_COUNTRY,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  allowedDevOrigins: ['jeneva-cruder-repellantly.ngrok-free.dev'],
};

export default nextConfig;
