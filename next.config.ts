import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

if (basePath) {
  nextConfig.basePath = basePath.replace(/\/$/, "");
  nextConfig.assetPrefix = `${nextConfig.basePath}/`;
}

export default nextConfig;
