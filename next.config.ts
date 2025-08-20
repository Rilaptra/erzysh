import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "smart.untidar.ac.id",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
