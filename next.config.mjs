/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
    // Only mock-generated placeholder creatives are SVG; real providers return raster images.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // bullmq/ioredis are Node-only and pull in optional native-adjacent
    // clients (e.g. valkey-glide) that don't need to be webpack-bundled.
    serverComponentsExternalPackages: ["bullmq", "ioredis"],
  },
};

export default nextConfig;
