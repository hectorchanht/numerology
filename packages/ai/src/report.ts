import { castBirthLore, castCrossSystem, castEgyptian, castEphemeris, castJyotish, castMetonic, castNumberLore, castHeluo, castHuangji, castLiuren, castMaya, castPlanetaryHour, castTaixuan, type ChartResult, type FortuneAnalysis } from "@numerology/engine";
import { buildContextPack, crossSystemFacts, type FortuneScope } from "./context.js";
import {
  buildReportUserPrompt,
  buildFortuneReportPrompt,
  buildReportSectionPrompt,
  buildFortuneSectionPrompt,
  REPORT_SEGMENTS,
  FORTUNE_SEGMENTS,
  type ReportLens,
} from "./prompts.js";
import {
  MAX_TOKENS,
  buildCachedSystem,
  chatComplete,
  chatStream,
  type Usage,
  type ProviderOptions,
  type AiLocale,
  type TextStream,
} from "./client.js";
import { fixFortuneHeadings, makeFortuneLineFixer } from "./prompts.js";

/**
 * 行級小標題修復流(TextStream 包裝)。
 * 背景:弱模型即使 prompt 給了逐行照抄的清單,仍會輸出 `### 癸未運（–歲／–年）`
 * 這類佔位符(2026-10-22 live 實證)——純 prompt 手段不可靠,服務端必須兜底。
 * 按行緩衝轉發(小標題必為完整單行),其它內容逐行原樣通過;流式體驗不變。
 */
class HeadingFixStream implements TextStream {
  private textListeners: Array<(d: string) => void> = [];
  private errorListeners: Array<(e: unknown) => void> = [];
  private buf = "";

  constructor(
    private readonly inner: TextStream,
    private readonly fixLine: (line: string) => string,
  ) {
    // 構造時即訂閱 inner:inner 是懶啟動(首個 finalMessage() 才真正請求),
    // 提前訂閱不觸發請求,只註冊監聽。
    inner.on("text", (delta: string) => this.onDelta(delta));
    inner.on("error", (err: unknown) => this.errorListeners.forEach((l) => l(err)));
  }

  private onDelta(delta: string): void {
    this.buf += delta;
    let idx: number;
    while ((idx = this.buf.indexOf("\n")) >= 0) {
      const line = this.buf.slice(0, idx);
      this.buf = this.buf.slice(idx + 1);
      const fixed = this.fixLine(line);
      this.textListeners.forEach((l) => l(fixed + "\n"));
    }
  }

  on(event: "text", listener: (d: string) => void): unknown;
  on(event: "error", listener: (e: unknown) => void): unknown;
  on(event: "text" | "error", listener: (arg: never) => void): unknown {
    if (event === "text") this.textListeners.push(listener as (d: string) => void);
    else this.errorListeners.push(listener as (e: unknown) => void);
    return undefined;
  }

  async finalMessage(): Promise<unknown> {
    const msg = await this.inner.finalMessage();
    if (this.buf) {
      const fixed = this.fixLine(this.buf);
      this.buf = "";
      this.textListeners.forEach((l) => l(fixed));
    }
    return msg;
  }

  abort(): void {
    this.inner.abort();
  }
}

/** 給大運流年流套上小標題修復;無 fortune 數據時原樣返回。 */
function withFortuneHeadingFix(stream: TextStream, fortune: FortuneAnalysis | undefined, locale: AiLocale): TextStream {
  if (!fortune) return stream;
  // 有狀態修復器:小標題形狀無關修復 + 紫微大限"無"/錯配修復,按行順序喂。
  return new HeadingFixStream(stream, makeFortuneLineFixer(fortune, locale));
}

export interface ReportResult {
  markdown: string;
  usage: Usage;
}

export interface ReportOptions {
  /** 動態運勢分析(強烈建議傳入,報告才能做動靜結合) */
  fortune?: FortuneAnalysis;
  maxTokens?: number;
  /** BYOK:用戶自帶 provider/key */
  ai?: ProviderOptions;
  /** 解讀視角:純八字 / 純紫微 / 合參(默認合參)。僅分段流式接口生效。 */
  lens?: ReportLens;
  /** AI 輸出語言(默認 zht 繁體)。 */
  locale?: AiLocale;
}

/** 生成命盤解讀報告(非流式)。需要當前 provider 的 API key。 */
export async function generateReport(
  chart: ChartResult,
  opts: ReportOptions = {},
): Promise<ReportResult> {
  const { caveats } = buildContextPack(chart, opts.fortune);
  const { text, usage } = await chatComplete({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune, opts.locale ?? "zht"),
    messages: [{ role: "user", content: buildReportUserPrompt(caveats, opts.locale ?? "zht") }],
  }, opts.ai);
  return { markdown: text, usage };
}

/** 生成報告(流式),返回文本事件流,供 Web 端逐字渲染。 */
export function streamReport(chart: ChartResult, opts: ReportOptions = {}) {
  const { caveats } = buildContextPack(chart, opts.fortune);
  return chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune, opts.locale ?? "zht"),
    messages: [{ role: "user", content: buildReportUserPrompt(caveats, opts.locale ?? "zht") }],
  }, opts.ai);
}

/** 《大運流年深析》(非流式):八字 × 紫微合參,逐步逐年。 */
export async function generateFortuneReport(
  chart: ChartResult,
  opts: ReportOptions = {},
): Promise<ReportResult> {
  const { caveats } = buildContextPack(chart, opts.fortune);
  const { text, usage } = await chatComplete({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune, opts.locale ?? "zht"),
    messages: [{ role: "user", content: buildFortuneReportPrompt(caveats, opts.locale ?? "zht", opts.fortune) }],
  }, opts.ai);
  const markdown = opts.fortune ? fixFortuneHeadings(text, opts.fortune, opts.locale ?? "zht") : text;
  return { markdown, usage };
}

/** 《大運流年深析》(流式)。 */
export function streamFortuneReport(chart: ChartResult, opts: ReportOptions = {}) {
  const { caveats } = buildContextPack(chart, opts.fortune);
  const locale = opts.locale ?? "zht";
  const stream = chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune, locale),
    messages: [{ role: "user", content: buildFortuneReportPrompt(caveats, locale, opts.fortune) }],
  }, opts.ai);
  return withFortuneHeadingFix(stream, opts.fortune, locale);
}

/**
 * 每節輸出上限,設約 1800 token —— 純"安全網",須明顯高於實際自然篇幅。
 * 控篇幅靠 prompt 硬性字數(~900–1100 字);實測最慢的 Opus 即便如此仍會寫到 ~1300–1400 字,
 * 故上限留到 1800,使其自然篇幅(~1400 字)在撞頂前就以句號收尾,不被 max_tokens 切半句;
 * 而 ~1400 字在 Opus ~32 字/秒下約 ~48s,仍穩在 Vercel 60s 內。上限須高於自然篇幅,切勿壓到其下。
 */
/**
 * 每節輸出上限。2026-11-02 由 1800 提高到 6000:report/fortune 路徑開啟
 * captureThinking 後,同一個 budget 要同時裝思考 + 完整正文——實測
 * qwen3:30b 單係規劃/思考已超過 1800 tokens(舊 suppression 時代佢將規劃
 * 寫入正文,2323 字仍未寫完就撞頂截斷)。Hector 準則 Accuracy >>> Speed:
 * 俾足 budget 唔好餓死正文;呢個只係天花板,實際篇幅由 prompt 決定,
 * 模型自然收尾唔會寫滿。chat 路徑(CHAT_MAX_TOKENS)唔跟,不受影響。
 */
const SECTION_MAX_TOKENS = 6000;

/**
 * 分節生成時動態運勢的作用域映射(2026-10-23 context-trim):
 * 每節只餵它需要的數據,整份 fortune 不再每節重倒——結構輸入,不加指令。
 */
const FORTUNE_SECTION_SCOPE: Record<string, FortuneScope> = {
  overview: "current",
  dayun: "dayun",
  review: "review",
  future: "future",
  rhythm: "dayun",
  action: "current",
};

/** 《命盤格局解讀》——單節流式(分段模式)。sectionKey ∈ REPORT_SEGMENTS[].key。 */
export function streamReportSection(chart: ChartResult, sectionKey: string, opts: ReportOptions = {}) {
  const seg = REPORT_SEGMENTS.find((s) => s.key === sectionKey);
  if (!seg) throw new Error(`未知报告章节:${sectionKey}`);
  // 靜態報告各節:當前運一行(動靜結合一瞥),不要整份 fortune。
  const scope: FortuneScope = "current";
  const { caveats } = buildContextPack(chart, opts.fortune, { fortuneScope: scope });
  const locale = opts.locale ?? "zht";
  // 多體系事實只進本節 user prompt,system 不變(prompt cache 照常命中)。
  const sky = seg.key === "crosssystem" ? castEphemeris(chart.input) : undefined;
  const facts = sky
    ? crossSystemFacts(castCrossSystem(chart), locale, {
        taixuan: castTaixuan(chart.input),
        maya: castMaya(chart.input.year, chart.input.month, chart.input.day),
        huangji: castHuangji(chart.input),
        planetaryHour: castPlanetaryHour(chart.input),
        ephemeris: sky,
        heluo: castHeluo(chart.input),
        lore: { numbers: castNumberLore(chart), birth: castBirthLore(chart, sky) },
        calendars: { jyotish: castJyotish(sky), egyptian: castEgyptian(chart.input, sky), metonic: castMetonic(chart.input) },
        liuren: castLiuren(chart.input),
      })
    : undefined;
  return chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? SECTION_MAX_TOKENS,
    system: buildCachedSystem(chart, opts.fortune, locale, { fortuneScope: scope }),
    messages: [{ role: "user", content: buildReportSectionPrompt(caveats, seg, opts.lens ?? "both", locale, facts) }],
  }, opts.ai);
}

/** 《大運流年深析》——單節流式(分段模式)。sectionKey ∈ FORTUNE_SEGMENTS[].key。 */
export function streamFortuneSection(chart: ChartResult, sectionKey: string, opts: ReportOptions = {}) {
  const seg = FORTUNE_SEGMENTS.find((s) => s.key === sectionKey);
  if (!seg) throw new Error(`未知大运流年章节:${sectionKey}`);
  const scope: FortuneScope = FORTUNE_SECTION_SCOPE[seg.key] ?? "full";
  const { caveats } = buildContextPack(chart, opts.fortune, { fortuneScope: scope });
  const locale = opts.locale ?? "zht";
  const stream = chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? SECTION_MAX_TOKENS,
    system: buildCachedSystem(chart, opts.fortune, locale, { fortuneScope: scope }),
    messages: [{ role: "user", content: buildFortuneSectionPrompt(caveats, seg, opts.lens ?? "both", locale, opts.fortune) }],
  }, opts.ai);
  return withFortuneHeadingFix(stream, opts.fortune, locale);
}
