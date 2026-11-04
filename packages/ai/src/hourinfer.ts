import type { HourCandidate } from "@numerology/engine";
import {
  chatComplete,
  chatStream,
  type SystemBlock,
  type Usage,
  type ProviderOptions,
  type AiLocale,
} from "./client.js";
import { HOUR_INFER_PERSONA, localeDirective } from "./prompts.js";
import type { ChatTurn } from "./chat.js";

/** 把 12 時辰候選壓成緊湊對照表餵給模型。 */
function candidatesTable(cands: HourCandidate[]): string {
  return cands
    .map(
      (c) =>
        `- ${c.shichen}(${c.range}):时柱 ${c.baziHour.ganZhi}${c.baziHour.shiShenGan ? `(时干${c.baziHour.shiShenGan})` : ""};` +
        `命宫 ${c.soulBranch}·${c.soulMajorStars.join("") || "空宫"};${c.fiveElementsClass};命主${c.soul}/身主${c.body};身宫${c.bodyPalaceName};` +
        `命格三方四正主星:${c.sanFangStars.join("、")}`,
    )
    .join("\n");
}

/** 時辰推斷的 system 塊(人設 + 12 候選對照表 + 輸出語言);第二塊標記 cache(僅 Anthropic 生效)。 */
export function buildHourInferSystem(cands: HourCandidate[], locale: AiLocale = "zht"): SystemBlock[] {
  return [
    { text: HOUR_INFER_PERSONA },
    { text: `## 该日 12 时辰候选命盘(用于比对反推)\n\n${candidatesTable(cands)}`, cache: true },
    { text: localeDirective(locale) },
  ];
}

export interface HourInferTurn extends ChatTurn {}

// 設 1800 token(安全網):時辰推斷每輪以提問爲主、本就簡短,壓到 1800 確保最慢模型單輪也 <60s,
// 不被 Vercel maxDuration=60 截斷(人設已要求每輪只問 3-5 個問題)。
const HOUR_INFER_MAX_TOKENS = 1800;
const HOUR_INFER_OPENING = "(开始)请简短说明原理,并向我提出第一轮用于区分时辰的问题。";

/** 時辰推斷對話(流式)。message 爲空表示開場(模型應自我介紹併發起首輪提問)。 */
export function streamHourInference(
  cands: HourCandidate[],
  history: HourInferTurn[],
  message: string,
  opts: { maxTokens?: number; ai?: ProviderOptions; locale?: AiLocale } = {},
) {
  const userMsg = message.trim() || HOUR_INFER_OPENING;
  return chatStream({
    kind: "chat",
    maxTokens: opts.maxTokens ?? HOUR_INFER_MAX_TOKENS,
    system: buildHourInferSystem(cands, opts.locale ?? "zht"),
    messages: [...history, { role: "user", content: userMsg }],
  }, opts.ai);
}

/** 非流式版本(測試/批處理用)。 */
export async function inferHour(
  cands: HourCandidate[],
  history: HourInferTurn[],
  message: string,
  opts: { maxTokens?: number; locale?: AiLocale } = {},
): Promise<{ text: string; usage: Usage }> {
  const userMsg = message.trim() || HOUR_INFER_OPENING;
  const { text, usage } = await chatComplete({
    kind: "chat",
    maxTokens: opts.maxTokens ?? HOUR_INFER_MAX_TOKENS,
    system: buildHourInferSystem(cands, opts.locale ?? "zht"),
    messages: [...history, { role: "user", content: userMsg }],
  });
  return { text, usage };
}
