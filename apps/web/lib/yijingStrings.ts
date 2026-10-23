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
  "nav.academy": S("易經學院", "易经学院", "Yi Jing Academy"),
  "nav.liuyao": S("六爻納甲", "六爻纳甲", "Six Lines"),
  "nav.yijingHistory": S("占卦歷史", "占卦历史", "Cast history"),

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
  "yijing.sendQuestion": S("AI 解卦時參考此問題", "AI 解卦时参考此问题", "Let AI consider this question"),

  /* —— 占卦歷史 —— */
  "yijing.hist.title": S("占卦歷史", "占卦历史", "Divination history"),
  "yijing.hist.sub": S("銅錢、梅花、六爻的起卦記錄,只儲存於本機", "铜钱、梅花、六爻的起卦记录,只储存于本机", "Coin, plum-blossom and liuyao casts — stored on this device only"),
  "yijing.hist.empty": S("還沒有占卦記錄", "还没有占卦记录", "No casts yet"),
  "yijing.hist.loading": S("載入中…", "载入中…", "Loading…"),
  "yijing.hist.emptyHint": S("起卦後會自動保存於此,隨時回來看", "起卦后会自动保存于此,随时回来查看", "Casts are saved here automatically — review them anytime"),
  "yijing.hist.kind.coin": S("銅錢占卦", "铜钱占卦", "Coin toss"),
  "yijing.hist.kind.meihua": S("梅花易數", "梅花易数", "Plum blossom"),
  "yijing.hist.kind.liuyao": S("六爻納甲", "六爻纳甲", "Six lines"),
  "yijing.hist.review": S("查看", "查看", "Review"),
  "yijing.hist.delete": S("刪除", "删除", "Delete"),
  "yijing.hist.confirmDelete": S("確定刪除", "确定删除", "Confirm delete"),
  "yijing.hist.reviewing": S("歷史回顧", "历史回顾", "Reviewing history"),
  "yijing.hist.backToHistory": S("返回歷史", "返回历史", "Back to history"),
  "yijing.judgment": S("卦辭", "卦辞", "Judgment"),
  "yijing.changing": S("動爻", "动爻", "Moving lines"),
  "yijing.noChange": S("無動爻:此卦不變,看本卦卦辭即可。", "无动爻:此卦不变,看本卦卦辞即可。", "No moving lines: the hexagram stands as cast — read the primary judgment."),
  "yijing.lineText": S("爻辭", "爻辞", "Line text"),
  "yijing.aiSoon": S("AI 解卦即將推出(目前保護預算,暫不調用 AI)。", "AI 解卦即将推出(目前保护预算,暂不调用 AI)。", "AI interpretation is coming soon (AI calls are disabled for now to protect the budget)."),

  /* —— 易經學院 —— */
  "academy.title": S("易經學院", "易经学院", "Yi Jing Academy"),
  "academy.sub": S("從零學懂易經 · 四課入門", "从零学懂易经 · 四课入门", "Learn the Yi Jing from zero · 4 lessons"),
  "academy.intro": S(
    "四課帶你由陰陽五行八卦,讀到點問卦、點解卦。全部白話講解,每課附自我檢測,學完可以直接去占卦頁實戰。",
    "四课带你由阴阳五行八卦,读到点问卦、点解卦。全部白话讲解,每课附自我检测,学完可以直接去占卦页实战。",
    "Four lessons from yin-yang and the trigrams to asking and interpreting. Plain-language guides with quizzes — then try the divination tool.",
  ),
  "academy.progress": S("已完成 {d} / {t} 課", "已完成 {d} / {t} 课", "{d} of {t} lessons done"),
  "academy.minutes": S("約 {n} 分鐘", "约 {n} 分钟", "~{n} min"),
  "academy.best": S("最佳 {s}/{t}", "最佳 {s}/{t}", "best {s}/{t}"),
  "academy.localNote": S("進度只保存在此裝置,不會上傳。", "进度只保存在此装置,不会上传。", "Progress stays on this device only."),
  "academy.lessonNo": S("第 {n} 課", "第 {n} 课", "Lesson {n}"),
  "academy.back": S("← 返回學院首頁", "← 返回学院首页", "← Back to Academy"),
  "academy.notFound": S("找不到這一課。", "找不到这一课。", "Lesson not found."),
  "academy.goDivine": S("去占一卦實戰", "去占一卦实战", "Cast a hexagram"),
  "academy.sources": S("延伸出處", "延伸出处", "Further sources"),
  "academy.sourcesNote": S("以下為公有領域原文,課文引文皆可於此稽考:", "以下为公有领域原文,课文引文皆可于此稽考:", "Public-domain originals — every quotation in the lesson can be checked here:"),
  "academy.quiz": S("自我檢測", "自我检测", "Self-check"),
  "academy.quizCheck": S("對答案", "对答案", "Check answers"),
  "academy.quizRetry": S("再測一次", "再测一次", "Retry"),
  "academy.quizScore": S("得分 {s} / {t}", "得分 {s} / {t}", "Score {s} / {t}"),
  "academy.quizRight": S("正確", "正确", "Correct"),
  "academy.quizWrong": S("再想想", "再想想", "Review"),

  /* —— 六爻納甲 —— */
  "liuyao.title": S("六爻納甲", "六爻纳甲", "Six Lines Najia"),
  "liuyao.sub": S("裝卦排盤 · 干支六親世應六獸", "装卦排盘 · 干支六亲世应六兽", "Full najia chart · stems, kinship, gen/ying, beasts"),
  "liuyao.dateLabel": S("占問日期(取日辰月建,預設今日)", "占问日期(取日辰月建,预设今日)", "Divination date (day & month pillars, default today)"),
  "liuyao.dateHint": S("日辰、月建、旬空、六獸皆按此日起,月建按節氣定。", "日辰、月建、旬空、六兽皆按此日起,月建按节气定。", "Day stem-branch, month branch, voids and beasts derive from this date; month follows solar terms."),
  "liuyao.modeCoin": S("搖錢起卦", "摇钱起卦", "Coin toss"),
  "liuyao.modeManual": S("手動裝卦", "手动装卦", "Manual lines"),
  "liuyao.toss": S("搖一爻", "摇一爻", "Toss a line"),
  "liuyao.rolling": S("搖卦中…", "摇卦中…", "Tossing…"),
  "liuyao.cast": S("裝卦", "装卦", "Cast chart"),
  "liuyao.yaoTop": S("上爻", "上爻", "Top"),
  "liuyao.yaoBottom": S("初爻", "初爻", "Bottom"),
  "liuyao.result": S("裝卦結果", "装卦结果", "Chart"),
  "liuyao.moving": S("動", "动", "moving"),
  "liuyao.static": S("靜", "静", "still"),
  "liuyao.kong": S("旬空", "旬空", "void"),
  "liuyao.yuePo": S("月破", "月破", "month-break"),
  "liuyao.riPo": S("日破", "日破", "day-break"),
  "liuyao.note": S("世為我方、應為對方;旬空月破日破之爻力量受損,須結合動變參看。用神選取因事而異,此處只作客觀排盤。", "世为我方、应为对方;旬空月破日破之爻力量受损,须结合动变参看。用神选取因事而异,此处只作客观排盘。", "Gen = self, ying = other; void/broken lines are weakened. Reference only — the useful god depends on the question."),

  /* —— AI 解卦 —— */
  "ai.interpret": S("AI 解卦", "AI 解卦", "AI interpretation"),
  "ai.interpretTitle": S("AI 解卦", "AI 解卦", "AI interpretation"),
  "ai.loading": S("解卦中…", "解卦中…", "Interpreting…"),
  "ai.retry": S("再解一次", "再解一次", "Retry"),
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
  "poster.sub": S("水墨命盤 · 下載圖片分享", "水墨命盘 · 下载图片分享", "Ink-wash chart · download & share"),
  "poster.brand": S("易經學院", "易经学院", "YI JING ACADEMY"),
  "poster.download": S("下載圖片", "下载图片", "Download image"),
  "poster.exporting": S("生成圖片中…", "生成图片中…", "Creating image…"),
  "poster.exportFail": S("生成圖片失敗,請再試一次。", "生成图片失败,请再试一次。", "Couldn't create the image — please try again."),
  "poster.exportNote": S("下載的圖片不含生辰資料,可放心分享。", "下载的图片不含生辰资料,可放心分享。", "The downloaded image leaves out your birth details — safe to share."),
  "poster.nameLabel": S("姓名", "姓名", "Name"),
  "poster.namePlaceholder": S("輸入你的名字（選填）", "输入你的名字（选填）", "Your name (optional)"),
  "poster.nameHint": S("只會儲存於你的裝置，不會上傳", "只会储存于你的设备，不会上传", "Stored only on this device, never uploaded"),
  "poster.ageRange": S("{a}–{b} 歲", "{a}–{b} 岁", "ages {a}–{b}"),
  "poster.male": S("男", "男", "Male"),
  "poster.female": S("女", "女", "Female"),
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
  "poster.cta": S("到 numerology.dawnstudio.app 起你嘅命盤", "到 numerology.dawnstudio.app 起你的命盘", "Get your own chart at numerology.dawnstudio.app"),
  "poster.generatedAt": S("生成於 {date}", "生成于 {date}", "Generated {date}"),
  "poster.mainStars": S("主星", "主星", "Major stars"),
  "poster.yearPillar": S("年", "年", "Year"),
  "poster.monthPillar": S("月", "月", "Month"),
  "poster.dayPillar": S("日", "日", "Day"),
  "poster.hourPillar": S("時", "时", "Hour"),

  /* —— 梅花易數 —— */
  "nav.meihua": S("梅花易數", "梅花易数", "Plum Blossom"),
  "meihua.title": S("梅花易數", "梅花易数", "Plum Blossom Divination"),
  "meihua.sub": S("時間起卦 · 以年月日時數取卦", "时间起卦 · 以年月日时数取卦", "Time-based casting · derive the hexagram from date & time"),
  "meihua.datetime": S("起卦時間(預設此刻)", "起卦时间(预设此刻)", "Casting time (default now)"),
  "meihua.cast": S("時間起卦", "时间起卦", "Cast by time"),
  "meihua.numbers": S("四數", "四数", "Numbers"),
  "meihua.yearNum": S("年", "年", "Year"),
  "meihua.monthNum": S("月", "月", "Month"),
  "meihua.dayNum": S("日", "日", "Day"),
  "meihua.hourNum": S("時", "时", "Hour"),
  "meihua.upper": S("上卦", "上卦", "Upper"),
  "meihua.lower": S("下卦", "下卦", "Lower"),
  "meihua.moving": S("動爻", "动爻", "Moving line"),
  "meihua.ti": S("體", "体", "Ti (self)"),
  "meihua.yong": S("用", "用", "Yong (other)"),
  "meihua.verdict": S("體用斷", "体用断", "Ti-Yong verdict"),
  "meihua.method": S("起卦法", "起卦法", "Method"),
  "meihua.methodText": S(
    "年數取年支(子1…亥12),月取農曆月,日取農曆日,時取時支;上卦=(年+月+日)%8,下卦=(年+月+日+時)%8(餘0取8),動爻=(年+月+日+時)%6(餘0取6)。動爻所在之卦為用,另一卦為體,以五行生剋斷吉凶。",
    "年数取年支(子1…亥12),月取农历月,日取农历日,时取时支;上卦=(年+月+日)%8,下卦=(年+月+日+时)%8(余0取8),动爻=(年+月+日+时)%6(余0取6)。动爻所在之卦为用,另一卦为体,以五行生克断吉凶。",
    "Year = earthly-branch number (Zi 1…Hai 12), month = lunar month, day = lunar day, hour = hour-branch number; upper = (y+m+d)%8, lower = (y+m+d+h)%8 (0→8), moving line = (y+m+d+h)%6 (0→6). The trigram holding the moving line is Yong, the other is Ti; judge by five-element relations.",
  ),

  /* —— 占例庫 —— */
  "nav.cases": S("占例庫", "占例库", "Cases"),
  "cases.title": S("易經占例庫", "易经占例库", "Yijing Case Library"),
  "cases.sub": S("《左傳》真實占例 · 占辭原文 · 歷史應驗", "《左传》真实占例 · 占辞原文 · 历史应验", "Real divinations from the Zuo Zhuan · original texts · historical outcomes"),
  "cases.intro": S(
    "以下六例皆出自《左傳》,占辭原文逐字核實自公有領域文本,並附歷史應驗。收錄原則:只收有明確占辭原文、應驗可稽考的案例,寧缺勿濫——史料未載之處,不寫。",
    "以下六例皆出自《左传》,占辞原文逐字核实自公有领域文本,并附历史应验。收录原则:只收有明确占辞原文、应验可稽考的案例,宁缺勿滥——史料未载之处,不写。",
    "These six cases all come from the Zuo Zhuan. Each divination text is verified character-by-character against public-domain sources, with its historical outcome attached. Inclusion rule: only cases with a clear original text and a traceable outcome — fewer verified beats more invented; where the record is silent, nothing is written.",
  ),
  "cases.background": S("背景", "背景", "Background"),
  "cases.analysis": S("占斷", "占断", "Reading"),
  "cases.outcome": S("應驗", "应验", "Outcome"),
  "cases.diviner": S("占者", "占者", "Diviner"),
  "cases.source": S("出處", "出处", "Source"),
  "cases.moving": S("動爻", "动爻", "Moving"),
  "cases.verdict.fulfilled": S("應驗", "应验", "Fulfilled"),
  "cases.verdict.partial": S("部分應驗", "部分应验", "Partially fulfilled"),
  "cases.verdict.unrecorded": S("史料未載", "史料未载", "Unrecorded"),
  "cases.original": S("原文", "原文", "Original text"),
  "cases.baihua": S("本站白話解說", "本站白话解说", "Vernacular explanation"),
  "cases.history": S("歷史應驗", "历史应验", "Historical outcome"),
  "cases.method": S("占法", "占法", "Method"),
  "cases.ben": S("本卦", "本卦", "Base"),
  "cases.bian": S("之卦", "之卦", "Changed to"),
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
