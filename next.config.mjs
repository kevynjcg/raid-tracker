/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports if needed
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Base path configuration for subdirectory deployment
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Asset prefix for CDN or subdirectory
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/',
        destination: '/raid-tracker',
        permanent: true,
      },
    ]
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
