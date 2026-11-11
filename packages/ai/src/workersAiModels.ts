/**
 * Workers AI 模型表(構建時核驗,見下)。
 *
 * Workers AI 的 binding(`env.AI`)沒有 list-models 接口,REST 的
 * `/ai/models/search` 又需要 API token(邊緣函數內無 token),
 * 故此處維護一份**人工核驗**的模型表,而非憑記憶硬編碼:
 *  - 每個 id 都經實時 `/ai/models/search` 確認存在;
 *  - 默認模型另經真實中文補全驗證(輸出乾淨、無推理過程外泄);
 *  - 明確排除推理外泄型模型(GLM-4.7-Flash、Qwen3-30b-a3b-fp8 等 reasoning 模型
 *    會把思考過程塞進 reasoning 字段而 content 為空,不適合直接做解讀)。
 * /api/models?provider=workers-ai 直接返回此表(source 標為 verified-static)。
 */

export interface WorkersAiModelInfo {
  id: string;
  /** 給用戶的短標籤(界面顯示,不含價格細節)。 */
  label: string;
  contextWindow: number;
  priceInPerM: number;
  priceOutPerM: number;
  /**
   * 實驗性:已確認存在且非 reasoning 外泄型,但繁體中文穩定性尚未真機驗證。
   * 默認模型保持 mistral-small(唯一驗證過繁穩);實驗模型由用戶在設置裡手動選。
   */
  experimental?: boolean;
}

/** 最後一次成功核驗的時間(UTC)。 */
export const WORKERS_AI_VERIFIED_AT = "2026-11-11";

export const WORKERS_AI_MODELS: WorkersAiModelInfo[] = [
  {
    // 默認(2026-10-23 起):唯一在「長簡體 prompt + 繁體指令」下穩定輸出繁體的模型。
    // 實測:Llama 3.1 8B 會被 prompt 中的簡體錨定、無視語言指令;Mistral Small 3.1
    // 嚴格遵循 localeDirective,輸出乾淨繁體,response 字段直接可用,
    // usage 帶 neurons。代價是 neurons/token 約為 Llama 8B 的 3 倍,$2 預算約
    // 75 次完整解讀/月(個人用仍綽綽有餘,預算守衛是硬上限)。
    id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
    label: "Mistral Small 3.1 24B(預設·繁體穩定)",
    contextWindow: 128000,
    priceInPerM: 0.351,
    priceOutPerM: 0.555,
  },
  {
    // 2026-10-23 新增:AI Singapore 的東南亞特化模型,27B,與 mistral-small 同價
    // (budget-neutral 升級候選),非 reasoning 型。中文(含繁體)是其強項,
    // 但"長簡體 prompt + 繁體指令"下的穩定性尚未真機驗證 → experimental。
    id: "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
    label: "Sea Lion 27B(中文特化·實驗)",
    contextWindow: 128000,
    priceInPerM: 0.351,
    priceOutPerM: 0.555,
    experimental: true,
  },
  {
    // 2026-10-23 新增:Workers AI 上最強的非 reasoning 指令模型(70B)。
    // 注意 output 價格約 mistral-small 的 4 倍,$2 預算下可跑的完整解讀數更少;
    // 24k context 對本應用(上下文 ~2k tokens + prompt)綽綽有餘。experimental。
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    label: "Llama 3.3 70B(最強·貴·實驗)",
    contextWindow: 24000,
    priceInPerM: 0.293,
    priceOutPerM: 2.253,
    experimental: true,
  },
];

/** 默認模型 id(報告/對話共用)。 */
export const WORKERS_AI_DEFAULT_MODEL = WORKERS_AI_MODELS[0]!.id;
