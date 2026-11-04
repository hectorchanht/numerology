/**
 * 報告章節 key → emoji(純展示層,渲染時注入,與語言無關)。
 * 不進 prompt、不靠模型:同一 key 永遠同一圖標,三地語言一致。
 * 正文內不撒 emoji,每個章節標題僅一個。
 */
export const SECTION_ICONS: Record<string, string> = {
  // 《命盤格局解讀》
  personality: "🪞", // 性格特質:照見自己
  career: "💼", // 事業方向
  wealth: "💰", // 財富特點
  relationship: "❤️", // 感情婚姻
  health: "🌿", // 健康提示
  luck: "🌠", // 大運流年概覽
  crosssystem: "🔗", // 多體系交叉
  advice: "💡", // 總體建議 · 開運參考
  // 《大運流年深析》
  overview: "🧭", // 當前總覽:定盤定位
  dayun: "🕰️", // 大運逐步精講:時間之輪
  review: "🔍", // 回看校准
  future: "🔮", // 未來流年走向
  rhythm: "🌊", // 節奏與轉折
  action: "🎯", // 行動建議
};

/** 取某章節的圖標(未知 key 回落為 ✦,永不拋錯)。 */
export function sectionIcon(key: string): string {
  return SECTION_ICONS[key] ?? "✦";
}

/**
 * 渲染時注入圖標:把 markdown 首個 `## ` 標題行替換為帶圖標的確定性標題
 * (`## <icon> <label>`);若正文沒有標題行則補一個。正文其餘部分原樣不動。
 * 歷史記錄裡存的仍是無圖標原文,圖標只在渲染這一層出現。
 */
export function withIconHeading(segKey: string, label: string, markdown: string): string {
  return `## ${sectionIcon(segKey)} ${label}\n\n${stripLeadingHeading(markdown)}`;
}

/** 去掉 AI 文本自帶的首個 `## ` 標題行(章節卡已有確定性標題,正文其餘部分原樣不動)。 */
export function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^\s*##[^\n]*\n*/, "");
}
