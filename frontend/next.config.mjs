/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@careerpilot/shared"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
