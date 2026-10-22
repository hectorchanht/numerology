let loaded = false;

/**
 * 解析单行 .env,支持:
 * - `export KEY=...` 前缀
 * - 大小写 key([A-Za-z_][A-Za-z0-9_]*)
 * - 单/双引号值(双引号内支持 \ 转义);未引用的值去掉行尾注释(` # ...`)
 * - 空行与 `#` 注释行
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
    // 未引用:行尾注释从「空白 + #」开始。
    v = v.replace(/\s+#.*$/, "").trim();
  }
  return [key, v];
}

/**
 * 把仓库根目录 .env 里的变量灌进 process.env(只灌尚未设置的)。
 * 多 provider:不同 provider 用不同 key(GLM_API_KEY / GEMINI_API_KEY / GROQ_API_KEY /
 * ANTHROPIC_API_KEY 等),所以这里不针对单一 key 早退,统一加载即可;
 * 具体 provider 的 key 缺失会在解读层(@numerology/ai)调用时给出明确报错。
 * 仅服务端、请求时调用(非 import 时)。
 *
 * Edge 说明:node:fs / node:path 采用运行时动态 import(webpackIgnore 让打包器
 * 原样保留),Cloudflare Workers 等无文件系统的运行时会直接走 catch 静默 no-op ——
 * key 必须走平台环境变量 / 请求级 BYOK。本函数因此是 async,调用方需 await。
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
    return; // 无 node 内建模块的运行时(Workers/edge):静默跳过
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
      /* 该路径无 .env,继续尝试下一个 */
    }
  }
}
