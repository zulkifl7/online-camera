import type { NextConfig } from "next";

const isDevServer = process.argv.includes("dev");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.85"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

if (isDevServer) {
  nextConfig.rewrites = async () => [
    {
      source: "/api/:path*",
      destination: "http://127.0.0.1:8000/api/:path*",
    },
  ];
}

export default nextConfig;
