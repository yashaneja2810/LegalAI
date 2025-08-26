/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for pino-pretty and other optional dependencies
    // Don't disable crypto, http, https for Supabase to work
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      // crypto: false, // Keep crypto enabled for Supabase
      stream: false,
      // url: false, // Keep url enabled for Supabase
      zlib: false,
      // http: false, // Keep http enabled for Supabase
      // https: false, // Keep https enabled for Supabase
      assert: false,
      os: false,
      path: false,
    }

    // Ignore optional dependencies that cause warnings
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      'lokijs': false,
      'pino-abstract-transport': false,
      'thread-stream': false,
      'real-require': false,
    }

    // Fix for WalletConnect and other web3 libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },
}

export default nextConfig
