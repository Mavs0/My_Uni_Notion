import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Otimizações de performance
  reactStrictMode: true,
  swcMinify: true,
  
  // Compressão e otimização de imagens
  compress: true,
  
  // Otimizações de build
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-slider",
    ],
  },
  
  // Headers de performance
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
