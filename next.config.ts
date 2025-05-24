import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 優化建置輸出
  experimental: {
    // 禁用 webpack 快取以避免大型檔案
    webpackBuildWorker: false,
  },
  // 配置 webpack
  webpack: (config, { isServer }) => {
    // 在生產環境中禁用快取
    if (process.env.NODE_ENV === 'production') {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
