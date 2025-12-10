import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "smart.untidar.ac.id",
      },
      {
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
