import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually reached, so the runtime image does not ship the
  // build toolchain. Required by the Dockerfile.
  output: "standalone",

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
