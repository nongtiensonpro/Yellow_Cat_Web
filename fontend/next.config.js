// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   env: {
//     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//     NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
//   },
//   experimental: {
//     scrollRestoration: true
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'res.cloudinary.com',
//       }
//     ],
//     formats: ['image/avif', 'image/webp'],
//     minimumCacheTTL: 60,
//   },
//   compress: true,
//   onDemandEntries: {
//     maxInactiveAge: 30 * 1000,
//     pagesBufferLength: 4,
//   },
//   turbopack: {
//     resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
//   },
//   staticPageGenerationTimeout: 120,
//   poweredByHeader: false,
// };
//
// module.exports = nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  },
  experimental: {
    scrollRestoration: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  compress: true,
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 4,
  },
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  staticPageGenerationTimeout: 120,
  poweredByHeader: false,

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  }
};

module.exports = nextConfig;
