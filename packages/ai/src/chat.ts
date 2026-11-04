import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import {
  buildCachedSystem,
  chatComplete,
  chatStream,
  type Usage,
  type ProviderOptions,
  type AiLocale,
} from "./client.js";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAnswer {
  text: string;
  usage: Usage;
}

export interface ChatOptions {
  /** 動態運勢分析(與報告傳同一份,保證口徑一致) */
  fortune?: FortuneAnalysis;
  maxTokens?: number;
  /** BYOK:用戶自帶 provider/key */
  ai?: ProviderOptions;
  /** AI 輸出語言(默認 zht 繁體)。 */
  locale?: AiLocale;
}

/**
 * 單次追問回答上限。設 1800 token —— 純安全網。
 * 自由問答無法像報告那樣預切維度,故靠下方【作答規矩】的硬性字數讓模型在篇幅內自然收尾,
 * 即便最慢的 Opus 也能 <60s 答完,繞開 Vercel maxDuration=60 對長回答的截斷。
 */
const CHAT_MAX_TOKENS = 1800;

/** 對話作答規矩:就事論事、白話、硬性篇幅自然收尾——避免長答被 Vercel 60s 截斷。 */
const CHAT_DIRECTIVE = `【对话作答规矩】
- 直接回答用户这一个问题,**不要重述整张命盘**,就事论事、有针对性。
- 【说人话】用大白话讲清楚,术语(十神、四化、调候、三方四正等)第一次出现就在括号里当场翻成人话,不堆砌行话,让完全不懂命理的人也看得懂。
- 【结构·结论先行】第一句先给这一个问题的直接答案/定性,再展开依据和推理;不把结论藏在段尾;不写术语清单式段落。
- 【篇幅·硬性】把这个问题答透即可,约 700–1100 字;**务必在篇幅内把话说完、自然收尾(以句号结束),宁可少写一点,也绝不写到一半被切断。** 还想深入,就请用户接着追问。
- 严格区分"命盘能给的领域与吉凶倾向(可肯定)"和"具体事件(不可编造)";涉及年份按"倾向应期、可能±1 年"对待。`;

/**
 * 就命盤進行對話追問("我適合創業嗎""和父母怎麼相處")。
 * 複用與報告相同的命盤 system 塊(含動態運勢),確保回答與報告基於同一命盤事實。
 */
export async function answerFollowUp(
  chart: ChartResult,
  history: ChatTurn[],
  question: string,
  opts: ChatOptions = {},
): Promise<ChatAnswer> {
  const { text, usage } = await chatComplete({
    kind: "chat",
    maxTokens: opts.maxTokens ?? CHAT_MAX_TOKENS,
    system: [...buildCachedSystem(chart, opts.fortune, opts.locale ?? "zht"), { text: CHAT_DIRECTIVE }],
    messages: [...history, { role: "user", content: question }],
  }, opts.ai);
  return { text, usage };
}

/** 對話追問(流式),供 Web 端逐字渲染。 */
export function streamFollowUp(
  chart: ChartResult,
  history: ChatTurn[],
  question: string,
  opts: ChatOptions = {},
) {
  return chatStream({
    kind: "chat",
    maxTokens: opts.maxTokens ?? CHAT_MAX_TOKENS,
    system: [...buildCachedSystem(chart, opts.fortune, opts.locale ?? "zht"), { text: CHAT_DIRECTIVE }],
    messages: [...history, { role: "user", content: question }],
  }, opts.ai);
}
