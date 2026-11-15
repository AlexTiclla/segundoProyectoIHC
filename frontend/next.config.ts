import type { NextConfig } from "next";

import { urlBackend } from "./lib/constantes";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${urlBackend}/:path*` }];
  },
};

export default nextConfig;
