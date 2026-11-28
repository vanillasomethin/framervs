import type { NextConfig } from "next";

// Static HTML only: scripts/build-site.mjs copies `out/` into ../public at deploy time,
// next to the CMS pages, the estimator and the Netlify functions.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
