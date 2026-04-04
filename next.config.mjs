import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */ 
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
