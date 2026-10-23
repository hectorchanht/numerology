/**
 * 易經學院(Phase 1)UI 文案:占卦 / 六十四卦 / 命盤海報。
 * 三地字典,与 apps/web/lib/i18n.ts 同模式,但獨立存放(不動 i18n.ts)。
 * 通過 useLocale() 的 locale 取值: YIJING_STRINGS[id][locale]。
 */
export type YijingLocale = "zht" | "zhs" | "en";
export const YIJING_LOCALES: readonly YijingLocale[] = ["zht", "zhs", "en"];

type Dict = Record<YijingLocale, string>;

const S = (zht: string, zhs: string, en: string): Dict => ({ zht, zhs, en });

export const YIJING_STRINGS: Record<string, Dict> = {
  /* —— 頂部導航 —— */
  "nav.home": S("首頁", "首页", "Home"),
  "nav.yijing": S("易經占卦", "易经占卦", "Yi Jing Divination"),
  "nav.gua": S("六十四卦", "六十四卦", "64 Hexagrams"),
  "nav.poster": S("命盤海報", "命盘海报", "Chart Poster"),

  /* —— 占卦頁 —— */
  "yijing.title": S("易經占卦", "易经占卦", "Yi Jing Divination"),
  "yijing.sub": S("三錢起卦 · 一事一占", "三钱起卦 · 一事一占", "Three-coin casting · one question per casting"),
  "yijing.question.label": S("所問何事(選填,僅存於本頁,不會上傳)", "所问何事(选填,仅存于本页,不会上传)", "Your question (optional, stays on this page, never uploaded)"),
  "yijing.question.ph": S("例如:這份工作該不該換?", "例如:这份工作该不该换?", "e.g. Should I take this job offer?"),
  "yijing.toss": S("擲第 {n} 爻", "掷第 {n} 爻", "Cast line {n}"),
  "yijing.auto": S("全部自動", "全部自动", "Cast all"),
  "yijing.reset": S("再占一卦", "再占一卦", "Cast again"),
  "yijing.coin.heads": S("字", "字", "H"),
  "yijing.coin.tails": S("花", "花", "T"),
  "yijing.line.oldYang": S("老陽", "老阳", "Old Yang"),
  "yijing.line.youngYang": S("少陽", "少阳", "Young Yang"),
  "yijing.line.youngYin": S("少陰", "少阴", "Young Yin"),
  "yijing.line.oldYin": S("老陰", "老阴", "Old Yin"),
  "yijing.result": S("起卦結果", "起卦结果", "Casting result"),
  "yijing.benGua": S("本卦", "本卦", "Primary"),
  "yijing.bianGua": S("變卦", "变卦", "Changed"),
  "yijing.huGua": S("互卦", "互卦", "Nuclear"),
  "yijing.judgment": S("卦辭", "卦辞", "Judgment"),
  "yijing.changing": S("動爻", "动爻", "Moving lines"),
  "yijing.noChange": S("無動爻:此卦不變,看本卦卦辭即可。", "无动爻:此卦不变,看本卦卦辞即可。", "No moving lines: the hexagram stands as cast — read the primary judgment."),
  "yijing.lineText": S("爻辭", "爻辞", "Line text"),
  "yijing.aiSoon": S("AI 解卦即將推出(目前保護預算,暫不調用 AI)。", "AI 解卦即将推出(目前保护预算,暂不调用 AI)。", "AI interpretation is coming soon (AI calls are disabled for now to protect the budget)."),
  "yijing.askHonest": S("傳統講究:一事一占、心誠則靈,不義之問不占。", "传统讲究:一事一占、心诚则灵,不义之问不占。", "Tradition: one question per casting, asked with sincerity."),

  /* —— 六十四卦庫 —— */
  "gua.title": S("六十四卦", "六十四卦", "The 64 Hexagrams"),
  "gua.sub": S("文王卦序 · 卦辭爻辭大象全覽", "文王卦序 · 卦辞爻辞大象全览", "King Wen sequence · judgments, line texts and images"),
  "gua.searchPh": S("搜卦名 / 拼音 / 英文 / 卦序號…", "搜卦名 / 拼音 / 英文 / 卦序号…", "Search name / pinyin / English / number…"),
  "gua.upper": S("上卦", "上卦", "Upper trigram"),
  "gua.lower": S("下卦", "下卦", "Lower trigram"),
  "gua.element": S("五行", "五行", "Element"),
  "gua.yinyang": S("陰陽", "阴阳", "Yin/Yang"),
  "gua.judgment": S("卦辭", "卦辞", "Judgment"),
  "gua.image": S("大象", "大象", "Great Image"),
  "gua.lines": S("爻辭", "爻辞", "Line texts"),
  "gua.interp": S("今解", "今解", "Modern reading"),
  "gua.empty": S("沒有符合的卦,換個關鍵詞試試。", "没有符合的卦,换个关键词试试。", "No hexagram matched — try another keyword."),
  "gua.interp.core": S("核心", "核心", "Core"),
  "gua.interp.career": S("事業", "事业", "Career"),
  "gua.interp.love": S("感情", "感情", "Love"),
  "gua.interp.wealth": S("財運", "财运", "Wealth"),
  "gua.interp.health": S("健康", "健康", "Health"),
  "gua.interp.advice": S("建議", "建议", "Advice"),
  "gua.detail.back": S("← 返回卦庫", "← 返回卦库", "← Back to all"),

  /* —— 命盤海報 —— */
  "poster.title": S("命盤海報", "命盘海报", "Chart Poster"),
  "poster.sub": S("水墨命盤 · 截圖分享", "水墨命盘 · 截图分享", "Ink-wash chart · share a screenshot"),
  "poster.empty": S("還沒有命盤記錄。", "还没有命盘记录。", "No chart records yet."),
  "poster.emptyHint": S("先去首頁排一次盤,回來就能生成海報。", "先去首页排一次盘,回来就能生成海报。", "Cast a chart on the home page first, then come back for the poster."),
  "poster.goHome": S("去排盤", "去排盘", "Cast a chart"),
  "poster.birth": S("生辰", "生辰", "Birth"),
  "poster.lunar": S("農曆", "农历", "Lunar"),
  "poster.bazi": S("八字四柱", "八字四柱", "Four Pillars"),
  "poster.daymaster": S("日主", "日主", "Day Master"),
  "poster.ziwei": S("紫微", "紫微", "Zi Wei"),
  "poster.soulPalace": S("命宮", "命宫", "Life Palace"),
  "poster.bodyPalace": S("身宮", "身宫", "Body Palace"),
  "poster.dayun": S("當前大運", "当前大运", "Current Luck Cycle"),
  "poster.disclaimer": S("傳統文化與自我反思工具,非宿命預測,僅供參考。", "传统文化与自我反思工具,非宿命预测,仅供参考。", "A cultural self-reflection tool, not fate prediction. For reference only."),
  "poster.generatedAt": S("生成於 {date}", "生成于 {date}", "Generated {date}"),
  "poster.mainStars": S("主星", "主星", "Major stars"),
  "poster.yearPillar": S("年", "年", "Year"),
  "poster.monthPillar": S("月", "月", "Month"),
  "poster.dayPillar": S("日", "日", "Day"),
  "poster.hourPillar": S("時", "时", "Hour"),
};

/** 取文案;缺 key 時回落 zht,再回落 key 本身。 */
export function yjT(id: string, locale: YijingLocale): string {
  const d = YIJING_STRINGS[id];
  if (!d) return id;
  return d[locale] ?? d.zht;
}

/** 簡單佔位符填充:{name} 形式。 */
export function yjFmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
