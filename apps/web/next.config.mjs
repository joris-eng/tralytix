/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/v1";
    const origin = base.replace(/\/v1\/?$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/:path*`
      }
    ];
  }
};

export default nextConfig;
