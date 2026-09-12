import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: Next 16 blocks cross-origin requests to /_next/hmr by default,
  // which breaks hot reload when you open the dev server from another device
  // on the LAN (a phone, a second laptop). Has no effect on a production build.
  allowedDevOrigins: ["10.0.0.122"],

  images: {
    // The hero is still the placeholder Unsplash photo from the canvas.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
