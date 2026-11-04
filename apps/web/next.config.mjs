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
  // 排盤/AI 包用到 fs、import.meta.url、iztro/lunar,只在服務端運行,
  // 標記爲 external 避免被打進客戶端 bundle 或破壞數據文件路徑解析。
  experimental: {
    // 允許源碼用 `./x.js` 風格引用 `./x.ts`(與 packages/* 一致;node ESM 與測試亦需顯式擴展名)。
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
