import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@uirift/shared", "@uirift/validation", "@uirift/database", "@uirift/comparison-engine"],
};

export default nextConfig;
