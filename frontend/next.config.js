/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  // Static export for Firebase Hosting
  output: isProd ? "export" : undefined,
  // Rewrites only work in dev (Next.js server mode)
  ...(isProd
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://127.0.0.1:8000/api/:path*",
            },
          ];
        },
      }),
};

module.exports = nextConfig;
