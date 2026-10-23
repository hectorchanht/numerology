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
}

/** 最后一次成功核验的时间(UTC)。 */
export const WORKERS_AI_VERIFIED_AT = "2026-10-22";

export const WORKERS_AI_MODELS: WorkersAiModelInfo[] = [
  {
    // 默认:实测中文补全干净(繁体)、response 字段直接可用、usage 带 neurons。
    id: "@cf/meta/llama-3.1-8b-instruct-fp8",
    label: "Llama 3.1 8B(預設·中文流暢)",
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
    id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
    label: "Mistral Small 3.1 24B(更強·128K)",
    contextWindow: 128000,
    priceInPerM: 0.351,
    priceOutPerM: 0.555,
  },
];

/** 默认模型 id(报告/对话共用)。 */
export const WORKERS_AI_DEFAULT_MODEL = WORKERS_AI_MODELS[0]!.id;
