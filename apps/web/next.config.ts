import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@breakscope/shared", "@breakscope/validation", "@breakscope/database", "@breakscope/comparison-engine"],
};

export default nextConfig;
