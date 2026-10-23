/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @dawn-studio/zh-convert has a node:module fallback for CJS envs;
      // browser bundle never hits it — stub it out.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:module": false,
      };
    }
    return config;
  },
  // 排盘/AI 包用到 fs、import.meta.url、iztro/lunar,只在服务端运行,
  // 标记为 external 避免被打进客户端 bundle 或破坏数据文件路径解析。
  experimental: {
    // 允许源码用 `./x.js` 风格引用 `./x.ts`(与 packages/* 一致;node ESM 与测试亦需显式扩展名)。
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    },
    serverComponentsExternalPackages: [
      "@numerology/engine",
      "@numerology/ai",
      "@numerology/knowledge",
      "iztro",
      "lunar-javascript",
      "openai",
      "@anthropic-ai/sdk",
    ],
  },
};

export default nextConfig;
