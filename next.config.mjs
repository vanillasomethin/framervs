/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/": ["./index.html"],
    "/contact": ["./contact/index.html"],
    "/estimator": ["./estimator/index.html"],
    "/page-1": ["./page(1).html"],
    "/project-showcase": ["./project-showcase/index.html"],
  },
};

export default nextConfig;
