import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The hero is still the placeholder Unsplash photo from the canvas.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
