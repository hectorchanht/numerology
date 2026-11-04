let loaded = false;

/**
 * 解析單行 .env,支持:
 * - `export KEY=...` 前綴
 * - 大小寫 key([A-Za-z_][A-Za-z0-9_]*)
 * - 單/雙引號值(雙引號內支持 \ 轉義);未引用的值去掉行尾註釋(` # ...`)
 * - 空行與 `#` 註釋行
 * 返回 [key, value],非法行返回 null。
 */
export function parseDotEnvLine(line: string): [string, string] | null {
  const s = line.trim();
  if (!s || s.startsWith("#")) return null;
  const m = s.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) return null;
  const key = m[1]!;
  let v = m[2]!.trim();
  if (v.startsWith('"')) {
    const inner = v.match(/^"((?:[^"\\]|\\.)*)"/);
    v = inner ? inner[1]!.replace(/\\(.)/g, "$1") : v.replace(/^"|"$/g, "");
  } else if (v.startsWith("'")) {
    const inner = v.match(/^'([^']*)'/);
    v = inner ? inner[1]! : v.replace(/^'|'$/g, "");
  } else {
    // 未引用:行尾註釋從「空白 + #」開始。
    v = v.replace(/\s+#.*$/, "").trim();
  }
  return [key, v];
}

/**
 * 把倉庫根目錄 .env 裡的變量灌進 process.env(只灌尚未設置的)。
 * 多 provider:不同 provider 用不同 key(GLM_API_KEY / GEMINI_API_KEY / GROQ_API_KEY /
 * ANTHROPIC_API_KEY 等),所以這裡不針對單一 key 早退,統一加載即可;
 * 具體 provider 的 key 缺失會在解讀層(@numerology/ai)調用時給出明確報錯。
 * 僅服務端、請求時調用(非 import 時)。
 *
 * Edge 說明:node:fs / node:path 採用運行時動態 import(webpackIgnore 讓打包器
 * 原樣保留),Cloudflare Workers 等無文件系統的運行時會直接走 catch 靜默 no-op ——
 * key 必須走平台環境變量 / 請求級 BYOK。本函數因此是 async,調用方需 await。
 */
export async function ensureEnv(): Promise<void> {
  if (loaded) return;
  loaded = true;

  let readFileSync: (path: string, encoding: "utf-8") => string;
  let join: (...parts: string[]) => string;
  try {
    const fsMod = await import(/* webpackIgnore: true */ "node:fs");
    const pathMod = await import(/* webpackIgnore: true */ "node:path");
    readFileSync = fsMod.readFileSync;
    join = pathMod.join;
  } catch {
    return; // 無 node 內建模塊的運行時(Workers/edge):靜默跳過
  }

  const cwd =
    typeof process !== "undefined" && typeof process.cwd === "function"
      ? process.cwd()
      : null;
  if (!cwd) return;

  const candidates = [join(cwd, ".env"), join(cwd, "..", "..", ".env")];
  for (const path of candidates) {
    try {
      const raw = readFileSync(path, "utf-8");
      for (const line of raw.split("\n")) {
        const parsed = parseDotEnvLine(line);
        if (parsed && !process.env[parsed[0]]) {
          process.env[parsed[0]] = parsed[1];
        }
      }
    } catch {
      /* 該路徑無 .env,繼續嘗試下一個 */
    }
  }
}
