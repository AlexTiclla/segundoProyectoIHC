import type { NextConfig } from "next";

import { urlBackend } from "./lib/constantes";

const nextConfig: NextConfig = {
  // La suite e2e compila en otra carpeta para no pisar la de "npm run dev"
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${urlBackend}/:path*` }];
  },
};

export default nextConfig;