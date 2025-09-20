import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude Python virtual environment from being processed
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/agent/**', '**/node_modules/**']
    };
    return config;
  },
  // Also exclude from file watching
  experimental: {
    turbo: {
      rules: {
        '*.py': {
          loaders: [],
        },
      },
    },
  },
};

export default nextConfig;
