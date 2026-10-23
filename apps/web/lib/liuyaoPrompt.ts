import type { LiuyaoResult } from "@numerology/engine";
import type { YijingLocale } from "./yijingStrings.js";

/**
 * 六爻納甲 AI 解讀的 user prompt(純函數,無 engine runtime 依賴,方便測試)。
 * 輸入係 server 用引擎重算出嚟嘅 paigua 結果(唔信 client)。
 * 術語:引擎 liuyao 輸出已經係繁體(六親/六獸/陰陽),直接用。
 */
export interface LiuyaoPromptInput {
  /** 本卦,如 "䷧ 解" */
  benName: string;
  /** 本卦卦序 */
  benNumber: number;
  /** 變卦,如 "䷏ 豫";無動爻則 undefined */
  bianName?: string;
  r: LiuyaoResult;
  locale: YijingLocale;
}

const SYS_ZHT = `你是六爻納甲解卦助手。只根據下面給出的納甲盤解讀,不編造,不預言具體事件。
輸出繁體中文,400字以內,分兩段:第一段第一句先給結論(此卦總定性,直接敢斷),
再講啟示;第二段給一條可執行的建議。
斷卦只用下面嘅分析框架,不另作吉凶斷言:
- 世為己、應為他(事);看世應生剋定主客強弱。
- 動爻為事之機:動必有因,看動爻與世爻嘅生剋沖合。
- 日辰月建定旺衰:得日月生扶者旺,受剋者衰;旺衰決定爻嘅力量。
- 旬空、月破、日破者無力:空破之爻縱動亦難成事。
- 無動爻看旺衰與世應;多動爻先看交重之爻,再看動爻之間生剋。
嚴格區分「卦象顯示的傾向」(可肯定)與「具體事件」(不可編造)。`;

export function liuyaoSystemPrompt(): string {
  return SYS_ZHT;
}

function yaoLine(y: LiuyaoResult["yaos"][number]): string {
  const tags: string[] = [];
  if (y.shiYing) tags.push(y.shiYing);
  if (y.moving) tags.push("動");
  if (y.xunKong) tags.push("旬空");
  if (y.yuePo) tags.push("月破");
  if (y.riPo) tags.push("日破");
  const tag = tags.length > 0 ? `(${tags.join("·")})` : "";
  return `${y.position}爻:${y.ganzhi}${y.qin}·${y.beast}${tag}`;
}

export function buildLiuyaoUserText(input: LiuyaoPromptInput): string {
  const { benName, benNumber, bianName, r, locale } = input;
  const moving = r.yaos.filter((y) => y.moving).map((y) => y.position);
  const parts = [
    `本卦:${benName}(第${benNumber}卦)`,
    `卦型:${r.shape} 卦宮:${r.palace}(${r.palaceWuxing})`,
    `日辰:${r.dayGanzhi} 月建:${r.monthBranch} 旬空:${r.kong.join("")}`,
    `納甲:${r.yaos.map(yaoLine).join(" ")}`,
  ];
  if (moving.length > 0) {
    parts.push(`動爻:${moving.join("、")}爻動${bianName ? `,變卦:${bianName}` : ""}`);
  } else {
    parts.push("無動爻。");
  }
  parts.push(
    locale === "en"
      ? "Interpret this Six-Yao (Najia) casting in English, within 400 words."
      : "請解讀此六爻納甲盤,400字以內。",
  );
  return parts.join("\n");
}
