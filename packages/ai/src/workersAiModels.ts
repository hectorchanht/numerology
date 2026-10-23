/**
 * Workers AI 模型表(构建时核验,见下)。
 *
 * Workers AI 的 binding(`env.AI`)没有 list-models 接口,REST 的
 * `/ai/models/search` 又需要 API token(边缘函数内无 token),
 * 故此处维护一份**人工核验**的模型表,而非凭记忆硬编码:
 *  - 每个 id 都经实时 `/ai/models/search` 确认存在;
 *  - 默认模型另经真实中文补全验证(输出干净、无推理过程外泄);
 *  - 明确排除推理外泄型模型(GLM-4.7-Flash、Qwen3-30b-a3b-fp8 等 reasoning 模型
 *    会把思考过程塞进 reasoning 字段而 content 为空,不适合直接做解读)。
 * /api/models?provider=workers-ai 直接返回此表(source 标为 verified-static)。
 */

export interface WorkersAiModelInfo {
  id: string;
  /** 给用户的短标签(界面显示,不含价格细节)。 */
  label: string;
  contextWindow: number;
  priceInPerM: number;
  priceOutPerM: number;
  /**
   * 实验性:已确认存在且非 reasoning 外泄型,但繁体中文稳定性尚未真机验证。
   * 默认模型保持 mistral-small(唯一验证过繁稳);实验模型由用户在设置里手动选。
   */
  experimental?: boolean;
}

/** 最后一次成功核验的时间(UTC)。 */
export const WORKERS_AI_VERIFIED_AT = "2026-10-22";

export const WORKERS_AI_MODELS: WorkersAiModelInfo[] = [
  {
    // 默认(2026-10-23 起):唯一在「长简体 prompt + 繁体指令」下稳定输出繁体的模型。
    // 实测:Llama 3.1 8B 会被 prompt 中的简体锚定、无视语言指令;Mistral Small 3.1
    // 严格遵循 localeDirective,输出干净繁体(香港用语),response 字段直接可用,
    // usage 带 neurons。代价是 neurons/token 约为 Llama 8B 的 3 倍,$2 预算约
    // 75 次完整解读/月(个人用仍绰绰有余,预算守卫是硬上限)。
    id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
    label: "Mistral Small 3.1 24B(預設·繁體穩定)",
    contextWindow: 128000,
    priceInPerM: 0.351,
    priceOutPerM: 0.555,
  },
  {
    // 备选:中文流畅、便宜,但长简体 prompt 下会无视繁体指令出简体。
    id: "@cf/meta/llama-3.1-8b-instruct-fp8",
    label: "Llama 3.1 8B(便宜·繁體不穩)",
    contextWindow: 32000,
    priceInPerM: 0.152,
    priceOutPerM: 0.287,
  },
  {
    id: "@cf/meta/llama-3.2-3b-instruct",
    label: "Llama 3.2 3B(最快·最便宜)",
    contextWindow: 80000,
    priceInPerM: 0.0509,
    priceOutPerM: 0.335,
  },
  {
    // 2026-10-23 新增:AI Singapore 的东南亚特化模型,27B,与 mistral-small 同价
    // (budget-neutral 升级候选),非 reasoning 型。中文(含繁体)是其强项,
    // 但"长简体 prompt + 繁体指令"下的稳定性尚未真机验证 → experimental。
    id: "@cf/aisingapore/gemma-sea-lion-v4-27b-it",
    label: "Sea Lion 27B(中文特化·實驗)",
    contextWindow: 128000,
    priceInPerM: 0.351,
    priceOutPerM: 0.555,
    experimental: true,
  },
  {
    // 2026-10-23 新增:Workers AI 上最强的非 reasoning 指令模型(70B)。
    // 注意 output 价格约 mistral-small 的 4 倍,$2 预算下可跑的完整解读数更少;
    // 24k context 对本应用(上下文 ~2k tokens + prompt)绰绰有余。experimental。
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    label: "Llama 3.3 70B(最強·貴·實驗)",
    contextWindow: 24000,
    priceInPerM: 0.293,
    priceOutPerM: 2.253,
    experimental: true,
  },
];

/** 默认模型 id(报告/对话共用)。 */
export const WORKERS_AI_DEFAULT_MODEL = WORKERS_AI_MODELS[0]!.id;
