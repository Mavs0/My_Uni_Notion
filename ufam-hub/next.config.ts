import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  eslint: { ignoreDuringBuilds: true },

  /**
   * Em dev: cache em memória por defeito — com `cache: false` vimos muitos
   * Cannot find module './NNNN.js', 404 em /_next/static e runtime partido após HMR.
   * `NEXT_WEBPACK_DEV_CACHE=0` ou `false` força sem cache (mais lento, para depuração).
   */
  webpack: (config, { dev }) => {
    if (dev) {
      const noCache =
        process.env.NEXT_WEBPACK_DEV_CACHE === "0" ||
        process.env.NEXT_WEBPACK_DEV_CACHE === "false";
      config.cache = noCache ? false : { type: "memory" };
    }
    return config;
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-slider",
    ],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
