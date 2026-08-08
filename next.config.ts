import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Every hero portrait, ability icon and item icon comes from this one host.
     * next/image refuses unlisted hosts by design — an allowlist rather than a
     * wildcard, so a future upstream change surfaces as a loud failure instead
     * of us silently proxying somebody else's images.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets-bucket.deadlock-api.com",
        pathname: "/assets-api-res/**",
      },
    ],
  },
};

export default nextConfig;
