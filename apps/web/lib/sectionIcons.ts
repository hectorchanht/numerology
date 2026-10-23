/**
 * 报告章节 key → emoji(纯展示层,渲染时注入,与语言无关)。
 * 不进 prompt、不靠模型:同一 key 永远同一图标,三地语言一致。
 * 正文内不撒 emoji,每个章节标题仅一个。
 */
export const SECTION_ICONS: Record<string, string> = {
  // 《命盘格局解读》
  personality: "🪞", // 性格特質:照见自己
  career: "💼", // 事业方向
  wealth: "💰", // 财富特点
  relationship: "❤️", // 感情婚姻
  health: "🌿", // 健康提示
  luck: "🌠", // 大运流年概览
  advice: "💡", // 总体建议 · 开运参考
  // 《大运流年深析》
  overview: "🧭", // 当前总览:定盘定位
  dayun: "🕰️", // 大运逐步精讲:时间之轮
  review: "🔍", // 回看校准
  future: "🔮", // 未来流年走向
  rhythm: "🌊", // 节奏与转折
  action: "🎯", // 行动建议
};

/** 取某章节的图标(未知 key 回落为 ✦,永不抛错)。 */
export function sectionIcon(key: string): string {
  return SECTION_ICONS[key] ?? "✦";
}

/**
 * 渲染时注入图标:把 markdown 首个 `## ` 标题行替换为带图标的确定性标题
 * (`## <icon> <label>`);若正文没有标题行则补一个。正文其余部分原样不动。
 * 历史记录里存的仍是无图标原文,图标只在渲染这一层出现。
 */
export function withIconHeading(segKey: string, label: string, markdown: string): string {
  return `## ${sectionIcon(segKey)} ${label}\n\n${stripLeadingHeading(markdown)}`;
}

/** 去掉 AI 文本自帶的首個 `## ` 標題行(章節卡已有確定性標題,正文其餘部分原樣不動)。 */
export function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^\s*##[^\n]*\n*/, "");
}
