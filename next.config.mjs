/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://educ-8mt8.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
