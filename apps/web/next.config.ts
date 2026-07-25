import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: [
    "@synaptria/auth",
    "@synaptria/config",
    "@synaptria/database",
    "@synaptria/types",
    "@synaptria/ui",
    "@synaptria/validation",
  ],
};

export default nextConfig;
