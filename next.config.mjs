/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Framer assets (the unframer components reference these directly).
    remotePatterns: [
      { protocol: "https", hostname: "framerusercontent.com" },
    ],
  },
};

export default nextConfig;
