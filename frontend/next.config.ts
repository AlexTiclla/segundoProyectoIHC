import type { NextConfig } from "next";

import { urlBackend } from "./lib/constantes";

// Con E2E_COBERTURA=1 la compilación lleva source maps y sin minificar, para que
// la cobertura de las pruebas e2e se pueda mapear a los .ts/.tsx originales
const conCobertura = process.env.E2E_COBERTURA === "1";

const nextConfig: NextConfig = {
  output: "standalone",
  // La suite e2e compila en otra carpeta para no pisar la de "npm run dev"
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  productionBrowserSourceMaps: conCobertura,
  experimental: conCobertura
    ? { serverSourceMaps: true, turbopackMinify: false }
    : {},
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${urlBackend}/:path*` }];
  },
};

export default nextConfig;
