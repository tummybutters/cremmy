import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence turbopack root warning when an additional lockfile exists outside the repo.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
