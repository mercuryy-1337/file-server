/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure image domains if needed
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // Add headers to allow the application to work behind a proxy
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Configure output for better compatibility
  output: 'standalone',
  
  
  // Increase the webpack buffer size for large files
  webpack: (config, { isServer }) => {
    // Increase the buffer size for webpack
    config.performance = {
      ...config.performance,
      maxAssetSize: 500 * 1024 * 1024, // 500MB
      maxEntrypointSize: 500 * 1024 * 1024, // 500MB
    }
    
    return config
  },
}

export default nextConfig
