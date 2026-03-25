const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://educ-8mt8.onrender.com/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/student",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/headmaster",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/teacher",
        destination: "/admin",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
