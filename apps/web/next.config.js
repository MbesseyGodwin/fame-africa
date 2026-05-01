/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['recharts', 'victory-vendor', '@reduxjs/toolkit'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'], // specifically exclude recharts here if it was auto-included
  },
  images: {
    domains: ['res.cloudinary.com', 'votenaija.ng', 'fameafrica-api.onrender.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_PAYSTACK_KEY: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
  },
}

module.exports = nextConfig
