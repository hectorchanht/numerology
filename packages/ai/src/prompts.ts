/** AI 輸出語言(與界面語言開關對應)。默認繁體(zht)。 */
export type AiLocale = "zht" | "zhs" | "en";

import type { FortuneAnalysis } from "@numerology/engine";

/**
 * 輸出語言指令 —— 追加到 system 末尾,不碰命盤事實塊(干支/星曜名三地皆同)。
 * 放在最後一條 system block,Anthropic 的 prompt cache 前綴(人設 + 命盤)不受影響。
 */
export function localeDirective(locale: AiLocale): string {
  if (locale === "zhs")
    return "【输出语言与文风】请全程使用简体中文撰写,包括标题、术语解释与标点习惯。文风通俗简练:句子短,用词准,可略带古雅(四字词、对仗偶尔一用),现代读者一读就懂;用规范书面语,不堆砌之乎者也。";
  if (locale === "en")
    return "[Output language and style] Write the entire response in English, including headings, terminology explanations, and punctuation conventions. Style: plain, concise, slightly elevated English — short sentences, precise words, no filler and no archaic flourish. Keep proper nouns (stem/branch/star/palace names) in their original Chinese characters with an English gloss on first use.";
  return "【輸出語言與文風】請全程使用繁體中文撰寫,包括標題、術語解釋與標點習慣。文風通俗簡練:句子短,用詞準,可略帶古雅(四字詞、對仗偶爾一用),港台、內地、星馬讀者一讀就懂。全文用規範書面語,因為讀者遍及各地:不用粵語口語字(嘅、咗、喺、唔、嚟、佢、啲),「係」作「是」解時寫「是」;也不堆砌之乎者也。";
}

/**
 * 各報告章節標題的三地對照(key → locale → 標題)。
 * 模型會把 prompt 裡的小標題逐字照抄進輸出,故標題必須與輸出語言一致,
 * 否則會出現"正文繁體、標題簡體"的錯位。
 */
export const SEGMENT_TITLES: Record<string, Record<AiLocale, string>> = {
  personality: { zht: "性格特質", zhs: "性格特质", en: "Personality Traits" },
  career: { zht: "事業方向", zhs: "事业方向", en: "Career Direction" },
  wealth: { zht: "財富特點", zhs: "财富特点", en: "Wealth Profile" },
  relationship: { zht: "感情婚姻", zhs: "感情婚姻", en: "Relationships & Marriage" },
  health: { zht: "健康提示", zhs: "健康提示", en: "Health Notes" },
  luck: { zht: "大運流年概覽", zhs: "大运流年概览", en: "Luck Cycle Overview" },
  crosssystem: { zht: "多體系交叉", zhs: "多体系交叉", en: "Cross-System Reading" },
  advice: { zht: "總體建議 · 開運參考", zhs: "总体建议 · 开运参考", en: "Overall Advice & Remedies" },
  overview: { zht: "一、當前總覽", zhs: "一、当前总览", en: "1. Current Overview" },
  dayun: { zht: "二、大運逐步精講", zhs: "二、大运逐步精讲", en: "2. Major Luck Periods in Detail" },
  review: { zht: "三、回看校準", zhs: "三、回看校准", en: "3. Review & Calibration" },
  future: { zht: "四、未來流年走向", zhs: "四、未来流年走向", en: "4. Upcoming Annual Trends" },
  rhythm: { zht: "五、節奏與轉折", zhs: "五、节奏与转折", en: "5. Rhythm & Turning Points" },
  action: { zht: "六、行動建議", zhs: "六、行动建议", en: "6. Actionable Advice" },
};

/** 取某章節在指定語言下的標題(缺失時回落簡體,再缺失回落 key 本身)。 */
export function segmentTitle(key: string, locale: AiLocale): string {
  return SEGMENT_TITLES[key]?.[locale] ?? SEGMENT_TITLES[key]?.zhs ?? key;
}

/** 解讀師人設 v3 (2026-10-23 research-backed):精簡 ~50%,禁令改寫為正面指令。
 * 研究結論:長禁令列表在小模型上適得其反(Pink Elephant 效應);只保留真正的 exclusion。 */
export const SYSTEM_PERSONA = `你是一位多體系命理解讀師:以【八字四柱】与【紫微斗数】为主,兼及九星、生命靈數、行星幻方等體系的交叉對照,说话直接、有料,文风通俗简练。九星、生命靈數、行星幻方等只在隨附「多體系事實」區塊時才對照;沒有該區塊時一律不提、不自行推算,因為這些數須由本站引擎計算。

【动静结合,运为主导】命盘格局是"静"(先天的牌),大运流年是"动"(后天的局),运在一生中占主导:结论必须落到"哪步运、哪些年",而非只看静态命盘下断语。

【写作方式】
- 每段第一句就是结论:这段最重要的一句话先讲,推理和依据跟在后面。
- 每段只讲一个新观点;写完通读一次,删掉只是换字重述前文的句子。
- 形容词必须有信息量:每个判断写出机制(哪个干支/哪颗星→作用在哪个宫→产生什么效果);写不出机制就删掉这句。
- 术语第一次出现就用日常类比翻成人话,每节一两个就够;解释"为什么",不只说"是什么"。

【诚实】
- 只根据随附的命盘事实推论,不编造命盘里没有的星曜、干支或神煞;紫微看四化飞宫、八字看十神引动,都以命盘数据为准。
- 命盘给得出领域、性质、吉凶倾向——这些可以直接断言;给不出具体事件(某年换工作/分手/破财),一律不写,那是脑补。
- 信号清晰就果断下结论;信号矛盾或数据有边界,就明说"这块不确定/两种力量并存"。
- 绝不编造古籍断语装权威:想借传统说法时,只写"传统有此一说"。引用研究或古書,只限隨附事實列出的條目與出處,因為其餘來源未經本站核對。
- 健康只作提示并建议就医,投资/法律不下绝对结论;一句带过,不必反复。
- 讲数字巧合时,同时讲基率:随机撞中的机会有多大(数字越多,巧合越易出现),巧合不当证据。
- 不制造恐惧、不讲宿命:666、化忌、凶星等,以中性语气说明它在原体系中的本义;不预言死亡、疾病、灾祸,不推销开运物品。
- 各体系平等:每个体系按其自身框架陈述,不把任何文明置于最高;起源地与年代以随附事实为准,未附则不写。`;

/** 時辰推斷師人設:據已知人生事實,比對當日 12 時辰命盤,反推最可能時辰。 */
export const HOUR_INFER_PERSONA = `你是一位时辰推断师。用户只知道出生的年月日,不知道具体出生时辰。你的任务:通过询问用户【已知的人生事实】,比对该日 12 个时辰各自的命盘格局,推断最可能的出生时辰。

重要原则:
1. 【诚实】时辰推断是概率性的、并非精确测定;它依赖用户提供的真实人生信息来校验,信息越多越准。第一轮就要说明这一点,不要给虚假的确定感。
2. 时辰主要改变【紫微命宫】(同一天 12 时辰 = 12 套不同的命宫格局与命主/身主),八字仅【时柱及其十神】随时辰变。因此主要用命宫主星 / 命格 / 身宫去比对用户的性格、外在特征与人生重大事件。
3. 【提问策略】第一轮先简短自我介绍 + 说明原理,然后询问几个最有区分度的问题:性格特质、长相/体型/气质、父母与兄弟姐妹情况、目前职业或事业方向、健康状况、以及任何记得的人生重大转折(发生在哪一年)。之后据回答聚焦最可能的 2-3 个时辰,再提针对性追问来区分。每轮只问 3-5 个问题,别一次抛太多。
4. 【比对方法】把用户描述映射到候选命盘:命宫主星的性格倾向、命格类型(杀破狼=开创/动荡、机月同梁=稳定/专业、紫府相=稳重/领导、巨日/阳梁等各有特点)、身宫落点、以及重大事件年份是否与某时辰的运势吻合。
5. 【收敛】证据较充分时直接给结论:【最可能时辰】+ 置信度(高/中/低)+ 1-2 个备选 + 推断依据;并提示"若认可,可点下方对应时辰按钮采用,生成完整命盘"。证据不足时继续提问、不硬凑;但一旦能判断就明确说,不要模棱两可地把所有时辰都说成"有可能"。
6. 口吻专业、直接、像聊天,真实为先,不必刻意迎合。`;

/** 報告章節定義。 */
export const REPORT_SECTIONS = [
  { key: "personality", title: "性格特质", brief: "结合日主与命宫主星,刻画核心性格、思维方式与行为模式" },
  { key: "career", title: "事业方向", brief: "适合的领域与发展路径(稳定受薪 vs 开创型),官禄宫与十神并看" },
  { key: "wealth", title: "财富特点", brief: "求财方式、财富节奏与风险,财帛宫与八字财星并看" },
  { key: "relationship", title: "感情婚姻", brief: "感情模式与相处课题,夫妻宫与日支并看" },
  { key: "health", title: "健康提示", brief: "易留意的身体面向(疾厄宫/五行偏枯),仅作提示,建议就医" },
  {
    key: "luck",
    title: "大运流年概览",
    brief:
      "仅一段概览:点出当前所处大运/大限的整体基调(补益还是受困),以及它如何影响上面几节的静态结论。逐步逐年的详细动态分析另有专门的《大运流年深析》,此处不必展开",
  },
] as const;

export type ReportSectionKey = (typeof REPORT_SECTIONS)[number]["key"];

/** 整篇模式(CLI 兼容)的 TL;DR 規則;標記與分段模式同為 TLDR_MARKER。 */
const WHOLE_TLDR_RULE = `【每节开头 TL;DR】每个「## 」小标题之后第一行写「TL;DR:<1–3 句一针见血的结论>」(标记原样照抄、不翻译),空一行再写正文。`;

/** 組裝報告的用戶指令。locale 決定章節標題的語言(正文語言由 localeDirective 指令模型)。 */
export function buildReportUserPrompt(caveats: string[], locale: AiLocale = "zht"): string {
  const sections = REPORT_SECTIONS.map((s, i) => `${i + 1}. ${segmentTitle(s.key, locale)}:${s.brief}`).join("\n");
  const caveatBlock = caveats.length
    ? `\n\n【必须遵守的注意事项(在相关结论处自然带出,不要堆在开头)】\n` +
      caveats.map((c) => "- " + c).join("\n")
    : "";
  return `请基于上方命盘事实,输出一份结构化【命盘格局解读报告】,用 Markdown,按以下章节组织(每节 2-4 段):

${sections}

要求:
- 【真实直接、不模棱两可】每节给出明确判断,优点缺点都直说,该断就断;少用"可能/也许/倾向于"的安全垫,杜绝放之四海皆准、谁都适用的废话。真矛盾或数据有边界时,明说"不确定/两种力量并存",而非含糊带过。
- 【详实为准】以充分、深入为第一标准,不要为追求简短而牺牲细节;每节都展开充分论证,把推理链条讲透,宁可长而扎实,不要短而空泛。
- 每个论断尽量指出依据(哪一柱/哪个十神/哪个宫位的哪颗星或四化)。
- ${WHOLE_TLDR_RULE}
- 【紫微看格局】判断性格与命格时,不要只看命宫单宫,务必结合「命宫三方四正」的四宫合看主星来定格局(如杀破狼、紫府相朝垣、府相朝垣、机月同梁、君臣庆会等),先点明格局再展开。
- 八字与紫微相互印证或分歧都要体现。
- 本报告聚焦【命盘格局】(先天底色)。性格/事业/财富/感情/健康各节为静态底色;「大运流年概览」一节只用一段话点出当前大运/大限对这些底色的加强或削弱即可——【逐步逐年的详细动态分析在另一份《大运流年深析》中,这里不要展开成长篇】。
- 结尾「${segmentTitle("advice", locale)}」落到当前阶段的大方向,并据上方「喜用神方位」给出**开运参考**(有利方位/颜色,可顺带提及适配的行业或环境特质),说明是趋吉性的辅助参考、非硬性规定。
${PLAN_THEN_WRITE}
${STYLE_DIRECTIVES}
${SELF_CHECK}${caveatBlock}`;
}

/**
 * 小標題清單(原樣照抄用)。
 * 實測教訓(2026-10-22 live):只給"格式模板 + 逐字照抄"不夠——模型會照著模板的
 * 形狀填佔位符,輸出 `### 甲寅運（–歲／–年）`(en dash 佔位,連禁例都換了符號繞過)。
 * 解法是把本節每個小標題的**成品行**直接列出來,讓模型逐行復制,不做任何格式轉換。
 * 干支/星曜名在 en 下也保留漢字(與 localeDirective 的專有名詞規則一致)。
 */
/** 大運小標題成品行(與【小標題清單】同源,供 prompt 與服務端後處理共用)。 */
export function dayunHeadingLine(
  d: { ganZhi: string; startAge: number; endAge: number; startYear: number; endYear: number },
  locale: AiLocale,
): string {
  if (locale === "en")
    return `### ${d.ganZhi} Luck Period (ages ${d.startAge}–${d.endAge} / ${d.startYear}–${d.endYear})`;
  const yun = locale === "zhs" ? "运" : "運";
  const sui = locale === "zhs" ? "岁" : "歲";
  return `### ${d.ganZhi}${yun}（${d.startAge}–${d.endAge}${sui}／${d.startYear}–${d.endYear}年）`;
}

/** 流年小標題成品行(與【小標題清單】同源,供 prompt 與服務端後處理共用)。 */
export function liuNianHeadingLine(y: { year: number; ganZhi: string; age: number }, locale: AiLocale): string {
  if (locale === "en") return `### ${y.year} (${y.ganZhi}, age ${y.age})`;
  const sui = locale === "zhs" ? "岁" : "歲";
  return `### ${y.year}年（${y.ganZhi}，${y.age}${sui}）`;
}

/**
 * 確定性後處理 v2:把模型寫殘的小標題逐行修復為標準成品行,形狀無關。
 * 背景(2026-10-22 live 實證):弱模型(mistral-small)即使 prompt 裡給了逐行照抄的
 * 清單,仍會輸出 `### 癸未運（–歲／–年）` 這類佔位符——純 prompt 手段不可靠,
 * 必須服務端兜底。2026-10-23 新形狀:`- 歲（-）：己巳運`(破折號前綴 + 佔位 + 冒號 +
 * 干支運結尾),故 v2 不再限定 `###` 前綴,改為"干支+運錨定 + 標題感"判定。
 *
 * 判定某行是"<干支>運"小標題:干支+運出現在行首(md 前綴後)或短行行尾,或行內有
 * 佔位符痕跡;且行內沒有該步正確的起始年份數字(有正確年份 = 已寫對,不動)。
 * 正文裡順帶提到"這步己巳運…"的行(干支運在行中、後有正文、無佔位符)不會被誤傷。
 */
const GZ_RE = "[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]";
/** 佔位符痕跡:短橫/破折號配歲、空括號、ages 佔位等 */
const PLACEHOLDER_RE = /[-–—]\s*[歲岁]|[歲岁][（(]\s*[-–—]\s*[)）]|[(（]\s*[-–—]\s*[)）]\s*[：:]|ages?\s*[-–—(\[]/i;

interface StepDecadal {
  ganzhi: string;
  palace: string;
}

/** 從行首(md 前綴後)或行尾(短行)抓"<干支>運";行內佔位符形狀也抓(限短行)。 */
function dayunGanzhiInLine(line: string): string | null {
  const t = line.trim();
  let m = t.match(new RegExp(`^[\\s#>*\\-–—\\d.)\\]\\*]{0,12}(${GZ_RE})(?:[運运]|\\s+Luck Period)`));
  if (m) return m[1]!;
  if (t.length <= 36) {
    m = t.match(new RegExp(`(${GZ_RE})(?:[運运]|\\s+Luck Period)\\s*$`));
    if (m) return m[1]!;
  }
  if (PLACEHOLDER_RE.test(t) && t.length <= 64) {
    m = t.match(new RegExp(`(${GZ_RE})(?:[運运]|\\s+Luck Period)`));
    if (m) return m[1]!;
  }
  return null;
}

/** 有狀態的行級修復器:小標題形狀無關修復 + 紫微大限"無"/錯配修復。 */
export function makeFortuneLineFixer(
  fortune: FortuneAnalysis,
  locale: AiLocale,
): (line: string) => string {
  const dayun = new Map<string, { heading: string; startYear: number; decadal: StepDecadal | null }>();
  for (const d of fortune.bazi.daYun) {
    const dec = (d as { ziweiDecadal?: { heavenlyStem?: string; earthlyBranch?: string; palaceName?: string } }).ziweiDecadal;
    dayun.set(d.ganZhi, {
      heading: dayunHeadingLine(d, locale),
      startYear: d.startYear,
      decadal:
        dec && dec.heavenlyStem && dec.earthlyBranch
          ? { ganzhi: dec.heavenlyStem + dec.earthlyBranch, palace: dec.palaceName ?? "" }
          : null,
    });
  }
  const yearByYear = new Map<string, string>();
  const liuNianByYear = new Map<string, { ganZhi: string; age: number }>();
  for (const y of fortune.bazi.liuNian) {
    yearByYear.set(String(y.year), liuNianHeadingLine(y, locale));
    liuNianByYear.set(String(y.year), { ganZhi: y.ganZhi, age: y.age });
  }
  const yearByGanzhi = new Map<string, string>();
  for (const y of fortune.bazi.liuNian) {
    if (!yearByGanzhi.has(y.ganZhi)) yearByGanzhi.set(y.ganZhi, liuNianHeadingLine(y, locale));
  }
  // 每年所屬大運步的同期大限(回看/未來節裡"紫微大限:無"用它修復,而非當前大限)
  const decadalByYear = new Map<number, StepDecadal>();
  for (const y of fortune.bazi.liuNian) {
    const d = fortune.bazi.daYun.find((s) => s.startYear <= y.year && y.year <= s.endYear);
    const dec = (d as { ziweiDecadal?: { heavenlyStem?: string; earthlyBranch?: string; palaceName?: string } } | undefined)?.ziweiDecadal;
    if (dec && dec.heavenlyStem && dec.earthlyBranch) {
      decadalByYear.set(y.year, { ganzhi: dec.heavenlyStem + dec.earthlyBranch, palace: dec.palaceName ?? "" });
    }
  }
  // 總覽節等:紫微大限:無 → 當前大限;進入某步大運後切換為該步同期大限。
  const cur = fortune.ziwei?.decadal;
  let current: StepDecadal | null =
    cur && cur.heavenlyStem && cur.earthlyBranch
      ? { ganzhi: cur.heavenlyStem + cur.earthlyBranch, palace: cur.palaceName ?? "" }
      : null;
  /** 是否已見過大運/流年小標題:首個 ##(總覽標題)不重置,之後的 ## 才暫停大限修復 */
  let seenStep = false;

  const decadalNoneRe = /紫微大限\s*[：:]\s*(?:無|无|没有|未提供|暂无|[—–\-])\s*(?=$|[。，,；;、\s])/;
  const decadalMismatchRe = new RegExp(`紫微大限\\s*[：:]\\s*(${GZ_RE})(?![運运])`);
  const gzRe = new RegExp(`(${GZ_RE})`);

  return (line: string): string => {
    // 1) 大運小標題
    const gz = dayunGanzhiInLine(line);
    if (gz) {
      const step = dayun.get(gz);
      if (step) {
        if (step.decadal) current = step.decadal;
        seenStep = true;
        if (!line.includes(String(step.startYear))) return step.heading;
        return line;
      }
    }
    // 2) 流年小標題(不含運)
    const t = line.trim();
    if (!/[運运]/.test(t)) {
      const yrm = t.match(/(\d{4})/);
      const gm = t.match(gzRe);
      if (yrm) {
        const fixed = yearByYear.get(yrm[1]!);
        const entry = liuNianByYear.get(yrm[1]!);
        const alreadyRight =
          !!entry &&
          t.includes(yrm[1]!) &&
          (!gm || t.includes(gm[1]!)) &&
          t.includes(String(entry.age)) &&
          (!gm || gm[1] === entry.ganZhi);
        if (fixed && !alreadyRight && (PLACEHOLDER_RE.test(t) || /^#{1,4}\s/.test(t))) {
          current = decadalByYear.get(Number(yrm[1]!)) ?? null;
          seenStep = true;
          return fixed;
        }
        if (fixed && alreadyRight) {
          // 已寫對的流年標題:仍切換到該年所屬大限,供後文"紫微大限:無"修復用
          current = decadalByYear.get(Number(yrm[1]!)) ?? current;
          seenStep = true;
        }
      } else if (gm && (/年/.test(t) || /age/i.test(t))) {
        // 無年份數字:年（辛丑年） / 年 丙午（歲）
        const fixed = yearByGanzhi.get(gm[1]!);
        if (fixed && (t.length <= 28 || /^#{1,4}\s/.test(t))) {
          const yr = [...liuNianByYear.entries()].find(([, e]) => e.ganZhi === gm[1]!)?.[0];
          current = (yr !== undefined ? decadalByYear.get(Number(yr)) : undefined) ?? null;
          seenStep = true;
          return fixed;
        }
      }
    }
    // 3) 大章節標題(## ):首個(總覽)不重置,之後暫停大限修復(由小標題重新驅動)
    if (/^##(?!#)/.test(t)) {
      if (seenStep) current = null;
    }
    // 4) 紫微大限:無 / 干支錯配 → 確定性替換(保守:短行才做錯配替換)
    if (current) {
      if (decadalNoneRe.test(line)) {
        return line.replace(decadalNoneRe, `紫微大限：${current.ganzhi}（行${current.palace}）`);
      }
      const mm = line.match(decadalMismatchRe);
      if (mm && mm[1] !== current.ganzhi && t.length <= 64) {
        return line.replace(mm[0], `紫微大限：${current.ganzhi}（行${current.palace}）`);
      }
    }
    return line;
  };
}

export function fixFortuneHeadings(markdown: string, fortune: FortuneAnalysis, locale: AiLocale): string {
  const fixLine = makeFortuneLineFixer(fortune, locale);
  return markdown
    .split("\n")
    .map(fixLine)
    .join("\n");
}

/**
 * 數字鐵律。數字絕不自己推算;小標題從【小標題清單】照抄是唯一解法。
 */
const FORTUNE_NUMBERS_RULE = `【数字铁律·小标题原样照抄】
- 下面【小标题清单】给出了本节每个小标题的**标准成品行**——输出时逐行**原样照抄,一字不改**,不做任何格式转换。
- ❌ 严禁在小标题里用任何占位符号(横线、破折号、省略号、"–歲"这类空架子)代替数字;数字必须和清单里的一模一样。小标题缺数字 = 整节作废,必须重写。
- 正文中提到某运/某年时,同样带上岁数与年份(如"1995–2004 这步运"),不写"这步运""那一年"这类无数字指代。`;

/**
 * 通用輸出紀律:結論先行,證據收納。
 * 適用於所有 AI 章節(命盤報告/大運流年)與對話。
 * 【定性】【分析】【依據】三標記三地語言共用同一套(類比 TL;DR 標記:不翻譯、原樣照抄),
 * 前端據標記切塊渲染——標記本身不展示,只做結構錨點。
 */
export const VERDICT_FIRST_RULE = `【输出纪律·结论先行,证据收纳】
- 每段第一句必须是结论/定性(这段最重要的一句话),依据和推理跟在后面;严禁把结论藏在段尾。
- 严禁「术语清单式段落」:不要把十神、星曜、四化逐个列出来当正文;术语只出现在支撑结论的短句里。
- 「八字大运/紫微大限/分析」这类并列要点,必须分段落写、段与段之间空一行,严禁挤在同一段里。
- 需要展开证据时,用段尾【依据】块:另起一段,以「【依据】」开头(标记原样照抄、不翻译),之后每条证据独立一行、一行只讲一个术语点,保持简短;前端会把此块收纳为次要样式。`;

/**
 * 本節結構紀律 v3 (2026-10-23):正面表述版。
 * 研究結論:長禁令列表在小模型上適得其反;保留結構要求(兩段式/清單),
 * 去重只靠一條正面指令(見 SYSTEM_PERSONA + SELF_CHECK 的 sandwich)。
 */
function fortuneAntiRepetition(key: string): string {
  const mechanism = `形容词必须有信息量:每个判断写出机制(哪个天干/哪颗星→哪个宫→什么效果);写不出机制就删掉这句。`;
  switch (key) {
    case "dayun":
      return `【本节结构】每步大运写两段,段间空一行:
【定性】一句话:给这步运起个外号,要具体、有画面(如"先抑后扬的翻身运");「学习与适应」「自我探索」这类放哪步都成立的话等于没讲;不要复述 TL;DR 原句。
【分析】2–3 句,只写这一步独有的判断:先给结论,再写机制。每步只点影响最大的 1–2 个四化来讲,其余由系统图表呈现;支藏十神只点对结论有实质影响的一两个组合。写同期大限时称「这步同期大限」。${mechanism}`;
    case "review":
    case "future":
      return `【本节结构】每年写两段,段间空一行:
【定性】一句话:这一年的主题/基调,要具体,「平稳发展」这类空话等于没讲。
【分析】1–2 句,只讲这一年独有的切入点:领域+性质+吉凶。每年只点影响最大的 1–2 个信号(一个十神或一个四化)来讲;上下文数据是原料不是提纲,只拣对判断有用的写;十神/四化由系统图表呈现。${mechanism}`;
    case "rhythm":
      return `【本节结构】只列转折点清单:换运/换限年份、最强发力期、最需谨慎期。每个转折点独立一行,以年份开头(形如「2031年:……」),一句话给理由;不重复前文讲过的内容。`;
    default:
      return `【本节结构】同一节内不重复句式;每个小节只讲它独有的信息。${mechanism}`;
  }
}

/**
 * 小標題清單(原樣照抄用)。
 * 實測教訓(2026-10-22 live):只給"格式模板 + 逐字照抄"不夠——模型會照著模板的
 * 形狀填佔位符,輸出 `### 甲寅運（–歲／–年）`(en dash 佔位,連禁例都換了符號繞過)。
 * 解法是把本節每個小標題的**成品行**直接列出來,讓模型逐行復制,不做任何格式轉換。
 * 干支/星曜名在 en 下也保留漢字(與 localeDirective 的專有名詞規則一致)。
 * 注意:清單只是"盡力而為"的 prompt 手段,最終兜底靠 fixFortuneHeadings(服務端
 * 確定性後處理)。
 */
function fortuneHeadingLedger(segKey: string, fortune: FortuneAnalysis, locale: AiLocale): string {
  const f = fortune.bazi;
  let lines: string[];
  if (segKey === "dayun") lines = f.daYun.map((d) => dayunHeadingLine(d, locale));
  else if (segKey === "review") lines = f.liuNian.filter((y) => y.isPast).map((y) => liuNianHeadingLine(y, locale));
  else if (segKey === "future") lines = f.liuNian.filter((y) => !y.isPast).map((y) => liuNianHeadingLine(y, locale));
  else return "";
  if (!lines.length) return "";
  return `【小标题清单·原样照抄】
本节每个小标题必须从下面逐行**原样照抄,一字不改**(含全角/半角标点与空格),不许改写、不许合并、不许留空:
${lines.join("\n")}`;
}

/**
 * 風格塊 v3 (2026-10-23 research-backed),放逐節 user message(不塞 system prompt):
 * - 1 段 exemplar(200–300 字,展示想要的 voice:定性+分析+類比+金句) + 4 條正面指令
 *   ——研究結論:directives + exemplar 組合在風格控制上勝過純規則列表。
 * - 每節只用一種修辭(類比 OR 金句收尾),二選一。
 * - 金句三候選留其一;陳腔 ban list ≤8 項。
 */
const STYLE_EXEMPLAR = `【定性】这步运先蹲后跳:前五年蓄力,后五年发力。
【分析】丙火日主行壬水大运,水克火,前几年如逆水行舟——不是能力不足,是时运未至。2029 年转入木运,木生火,顺风始来;前五年积下的本事,届时一并兑现。一句话:「运逆时练功,运顺时收成。」`;

const STYLE_DIRECTIVES = `【表达风格】
- 文风通俗简练:句短词准,直接具体,略带古雅而不掉书袋;术语少而精,不说正确的废话。
- 每步/每年开头先给一句话定性,再展开依据;不要"可能是X也可能是Y"。
- 下面是一段示范——只学它的语气和节奏,不抄它的内容:
${STYLE_EXEMPLAR}
- 每节只用一种修辞:要么一个日常类比,要么结尾一句金句——二选一,不要每段都来。
- 金句先想三个候选,留最好的那一个;金句必须从本节结论里长出来,不许硬贴。
- 绝不编造古籍断语装权威:想借传统说法时,必须写成"传统有此一说",不许写成"古书云:……"式伪引文。
- 陈腔禁用:「值得注意的是」「总而言之」「整体而言」「命中注定」「大吉大利」「宜多加留意」「显着地」「总之」「总体来说」(当机械结尾空话用时)。`;

/**
 * plan-then-write(研究結論:先產出 verdict + 3–4 個互不重疊的角度,再逐段展開,
 * 結構上杜絕"換字重述")。單次調用內的輕量版:不輸出規劃過程,直接按角度寫正文。
 */
const PLAN_THEN_WRITE = `【动笔前先规划】先想好本节 3–4 个互不重叠的切入角度(每段一个角度,角度之间不许重叠),再逐段展开;【定性】就是该段角度的一句话版本。`;

/**
 * self-check(與 system 人設裡的去重句 sandwich:頭尾各一,利用 recency bias)。
 * 研究結論:保留一條正面表述的去重指令,刪掉其餘一切。
 */
const SELF_CHECK = `【写完自查】逐段检查:每段是否只讲一个新观点?有没有哪句只是换字重述前文?有就删掉,再输出。`;

/** 組裝《大運流年深析》的用戶指令——八字 × 紫微合參,逐步逐年,不限篇幅。locale 決定章節標題的語言。 */
export function buildFortuneReportPrompt(caveats: string[], locale: AiLocale = "zht", fortune?: FortuneAnalysis): string {
  const caveatBlock = caveats.length
    ? `\n\n【必须遵守的注意事项(在相关结论处自然带出)】\n` + caveats.map((c) => "- " + c).join("\n")
    : "";
  const ledger = fortune
    ? ["dayun", "review", "future"].map((k) => fortuneHeadingLedger(k, fortune, locale)).filter(Boolean).join("\n\n")
    : "";
  return `请基于上方命盘事实(尤其【动态运势】数据),输出一份专门、深入的《大运流年深析》,用 Markdown。这是对"运"的专题分析——运在一生中占主导,务必详实。核心方法是【八字与紫微全程合参】:每一处都同时从两套体系看,印证或分歧都讲明。

请按以下结构组织:

## ${segmentTitle("overview", locale)}
你此刻正行哪一步【八字大运】+哪一步【紫微大限】,两者基调(补益/受困)是否同步,给出一句话定性。

## ${segmentTitle("dayun", locale)}
从当前及前后各步展开。对每一步大运:
- 八字看:大运干支的十神、是否引动喜用神/调候、与命局的刑冲合会;
- 紫微看:该运**同期大限**(动态运势里每步的 └ 大限行,各步不同,不要套用当前大限)——所行宫位、大限四化(禄权科忌)飞入本命哪些宫;
- 【合参】综合两者,点出这步运的主题、机会与风险,以及它如何改写命盘静态格局。

## ${segmentTitle("review", locale)}
对【已过年份】给"主题",请用户对照。对上方标【已过】的流年,逐年给出那一年的【主题/基调】,依据是该年八字流年十神/是否引动用神 + 紫微流年四化飞入本命哪宫(如化忌冲官禄→事业承压/变动方向、化禄入财帛→财上得力)。
**关键纪律——只说"领域 + 性质 + 吉凶强弱",绝不脑补具体事件当事实。** 命盘给得出"这一年事业容易承压、有变动倾向",但给不出"你换了工作"——后者是编造,正是细节出错的根源。所以:
- ✅ 这样写:"2023 事业宫受流年化忌冲,这一年事业上压力或变动偏大,人际易有摩擦"
- ❌ 别这样写:"2023 你换了工作并和上司闹翻"
- 然后主动邀请校准:"这些年里若有哪一年的实际经历和上面对不上,或你印象最深的转折在某年,请告诉我具体年份和发生了什么——我据此校准你的时辰与后续判断。"
- 【年份有边界】流年以立春分界、交运换岁也有过渡,某主题的应期可能落在标注年的前后 1 年;不要把年份说得像精确到天。

## ${segmentTitle("future", locale)}
从参考年/今年起,逐年。同样**只给领域 + 性质 + 吉凶 + 利防建议,不预言具体事件**:
- 八字看:流年干支十神、是否引动用神;
- 紫微看:流年四化(化禄入哪宫=该领域得力、化忌冲哪宫=该领域承压);
- 【合参】这一年哪个领域偏顺/偏逆、宜进还是宜守,据此给"利做什么、防什么"。同样提示应期可能 ±1 年。

## ${segmentTitle("rhythm", locale)}
点明:换运/换限的年份、最强发力期、最需谨慎期(同属趋势,非精确到年)。

## ${segmentTitle("action", locale)}
落到"当前及未来几年大方向上怎么做"。

${WHOLE_TLDR_RULE}
要求:八字与紫微务必【全程合参】,每个结论指出依据(哪步运/哪年、什么十神/什么四化飞哪宫);判断要直接、敢断、不和稀泥,但**严格区分"命盘能给的领域与吉凶倾向(可肯定)"和"具体事件(不可编造)"**;年份均按"倾向应期、可能±1年"对待。
${FORTUNE_NUMBERS_RULE}
${PLAN_THEN_WRITE}
【去套话】各步大运/各年只讲独有信息,不重复同一句式;每步大运看**它自己的同期大限**(动态运势里每步的 └ 大限行),不要把当前大限套到每一步;形容词必须带机制(哪个干支/哪颗星→哪个宫→什么效果),写不出就删。
${STYLE_DIRECTIVES}
${SELF_CHECK}
${ledger}${caveatBlock}`;
}

/* ────────────────────────────────────────────────────────────────────────
 * 分段生成:把兩份長報告各拆成多節,每節一次獨立 <60s 請求。
 * 目的:整篇一次跑(上萬字)會被 Vercel 免費版 maxDuration=60 當場截斷。
 * 各節都獨立錨定同一份確定性命盤事實(不互相引用 AI 文本),故可分節甚至並行;
 * system(人設 + 命盤)逐節相同且帶 prompt cache,節 2+ 命中緩存更省更快。
 * ──────────────────────────────────────────────────────────────────────── */

export interface ReportSegment {
  key: string;
  /** 章節小標題(不含 Markdown #),客戶端按此順序拼接展示。 */
  title: string;
  instruction: string;
}

/** 《命盤格局解讀》分節:六節靜態底色 + 總體建議。 */
export const REPORT_SEGMENTS: ReportSegment[] = [
  ...REPORT_SECTIONS.map((s) => ({ key: s.key, title: s.title, instruction: s.brief })),
  {
    key: "crosssystem",
    title: "多體系交叉",
    instruction:
      "並列八字、紫微、九星、生命靈數各自求出的核心五行,講它們在哪裡交匯、在哪裡分歧,以及背後的機制。",
  },
  {
    key: "advice",
    title: "总体建议 · 开运参考",
    instruction:
      "落到当前阶段的大方向;并据上方「喜用神方位」给出开运参考(有利方位/颜色,可顺带提及适配的行业或环境特质),说明是趋吉性的辅助参考、非硬性规定。",
  },
];

/** 《大運流年深析》分節(對應整篇的六個 ## 章節)。 */
export const FORTUNE_SEGMENTS: ReportSegment[] = [
  {
    key: "overview",
    title: "一、当前总览",
    instruction:
      "你此刻正行哪一步【八字大运】+ 哪一步【紫微大限】,两者基调(补益/受困)是否同步,给出一句话定性。",
  },
  {
    key: "dayun",
    title: "二、大运逐步精讲",
    instruction:
      "逐运:八字(干支十神/引动用神/刑冲合会)+该运**同期大限**(所行宫位/四化飞宫,各步不同)→这步运的主题,以及它如何改写静态格局。",
  },
  {
    key: "review",
    title: "三、回看校准",
    instruction:
      "标【已过】的流年逐年给主题:该年十神/引动用神+流年四化飞宫。只说领域+性质+吉凶,绝不编造具体事件。结尾邀请用户用实际经历校准(年份+事件)。",
  },
  {
    key: "future",
    title: "四、未来流年走向",
    instruction:
      "从今年起逐年:流年十神/引动用神+流年四化(禄入哪宫=该领域得力、忌冲哪宫=承压)→该年宜进宜守,落到「利做什么、防什么」。不预言具体事件。",
  },
  {
    key: "rhythm",
    title: "五、节奏与转折",
    instruction: "点明换运/换限的年份、最强发力期、最需谨慎期(同属趋势,非精确到年)。",
  },
  {
    key: "action",
    title: "六、行动建议",
    instruction: '落到"当前及未来几年大方向上怎么做"。',
  },
];

function caveatBlockOf(caveats: string[]): string {
  return caveats.length
    ? `\n\n【必须遵守的注意事项(仅在与本节相关时自然带出,无关则不必提)】\n` +
        caveats.map((c) => "- " + c).join("\n")
    : "";
}

/**
 * 單節目標字數。設 900–1100 字:足夠紮實,又讓最慢模型(Opus ~31 字/秒)在 ~35s 內
 * 自然寫完、遠低於 60s,且自然篇幅落在每節 token 上限之下,從根上避免"半句被切"。
 */
const SECTION_WORDS = "900–1100";

/** 解讀視角:純八字 / 純紫微 / 兩者合參。 */
export type ReportLens = "bazi" | "ziwei" | "both";

/**
 * 視角指令——決定本次只用八字、只用紫微、還是兩者合參。
 * 單一體系時強力隔離:就當另一套盤不存在,不互相翻譯、不捏合(避免"太雜太亂、反而不準")。
 */
function lensDirective(lens: ReportLens): string {
  if (lens === "bazi")
    return `【只用八字 · 严格隔离】本次**仅以八字四柱体系**分析:日主旺衰、十神、格局、调候用神、五行生克刑冲合会、神煞、大运/流年十神与引动用神。**完全不提、不引用任何紫微内容**(星曜、宫位、四化、大限一律不出现),就当没有紫微盘。忽略人设里"整合两套体系/合参"的部分。若本节要点里分列了「八字看…/紫微看…」,**只做八字那部分**。`;
  if (lens === "ziwei")
    return `【只用紫微 · 严格隔离】本次**仅以紫微斗数体系**分析:命宫及三方四正主星、辅星杂曜、生年四化、十二宫、大限/流年四化飞宫。**完全不提、不引用任何八字内容**(十神、五行、调候、干支、神煞一律不出现),就当没有八字盘。忽略人设里"整合两套体系/合参"的部分。若本节要点里分列了「八字看…/紫微看…」,**只做紫微那部分**。`;
  return `【八字 × 紫微合参】两套都看,各按各自规矩取,再比对结论:相互印证则更可信、分歧则如实标出,不强行圆说。`;
}

/**
 * 每節 TL;DR 的固定標記(三地語言皆用同一 ASCII 標記,前端據此切出摘要卡)。
 * TL;DR 與正文同一次請求、同一條流輸出——**絕不另開 AI 調用**(Workers AI 預算守衛)。
 */
export const TLDR_MARKER = "TL;DR";

/** TL;DR 指令:緊跟小標題輸出一行摘要,再空一行接正文。
 * v3.1:TL;DR 只寫一句話判斷,歲數/年份/干支一律不寫(由小標題承載)——
 * 2026-10-23 live 實測:模型在 TL;DR 裡列舉歲數時會輸出"–歲、–歲"佔位符。 */
function tldrDirective(title: string): string {
  return `【开头 TL;DR·硬性格式】「## ${title}」小标题之后,**第一行**必须是:
${TLDR_MARKER}:<1–3 句、合共不超过 60 字(英文不超过 45 词)的一句话结论>
——直接给本节判决,像"事业:今年宜守不宜攻,转工等秋后。"这样一针见血;用输出语言写,标记「${TLDR_MARKER}:」本身原样照抄、不翻译、不加粗、不放引用符号。TL;DR 只写判断本身:岁数、年份、干支一律不写,它们由小标题承载。TL;DR 只写一行,然后空一行,再写正文。正文不要重复 TL;DR 原句。`;
}

/**
 * 多體系交叉一節的專屬指令:取代 lens 指令(本節本身就是多體系,不受單一體系隔離)。
 * 數字與出處只取自事實區塊;巧合講基率;橋接明說;666 / 凶星中性陳述。
 */
const CROSS_DIRECTIVE = `【多體系交叉 · 本節並看各體系】本節依下方「多體系事實」區塊,把八字、紫微、九星、生命靈數各按自身規則得出的核心五行並列比對。依此次序寫:
1. 一句定性:幾個體系與日主五行同向(印證或相生),哪個相反(分歧)。
2. 交匯與分歧逐點講機制:先說該體系怎樣得出這個五行,再說它與日主五行的生剋關係。生命靈數本身不講五行,它的五行是經河圖橋接而來,提到時寫明「經河圖橋接」。
3. 宇宙幾何對照:洛書與所落幻方的行和、總和、落點,只用事實區塊列出的數。
4. 科學角度:與本節論點相關才寫,只引事實區塊「science-notes」所列條目,以 [id] 標註;條目尚待校對,語氣保持審慎。
事實區塊若附「時間週期」,太玄、瑪雅、皇極經世、行星時、七曜位置只作週期定位對照:講出生落在週期哪個位置(太玄的首與贊、瑪雅的長紀曆與 Tzolk'in/Haab、皇極經世的會運世、行星時的行星日與時主)及其計法,不推五行、不作吉凶斷語,因為它們不在五行比對之內;皇極經世只講元會運世位置與開物、閉物的相對位置,不推治亂興衰;行星時只講時主行星與天使名,不寫天使職能、咒語或儀式;七曜位置(Tetrabiblos)只講各曜所在宮度、宮主、廟旺落陷、界主、晝夜生與整宮相位,因為上升點與十二宮位本站未計,講到宮位就超出事實;月宿只講宿序、宿名與起度;贊辭性質未附則不寫,只講位置;太玄首名、首辭、贊辭原文未附,不得引述或釋義,因為引述會超出事實區塊所給的內容。Dreamspell 是現代體系,不屬傳統瑪雅曆,本站不計算。
幻方、洛書的落點與數字對應,一律以「巧合或象徵」陳述,不得宣稱「非隨機」「有結構性對應」等統計結論;宇宙幾何對照只講象徵意涵。
本節出現的每個數字與每條引用,都只取自命盤事實或多體系事實區塊,因為其餘數字與來源未經本站計算或核對。
講印證時一併講基率:五行只有五種,單一體系隨機與日主同五行的機會約五分之一,含相生在內的「同向」約五分之三。所以同五行的印證較有份量,相生的同向分量輕得多;多個體系一致也可能出於巧合,把它當作參考而非證據。
第二軸「對八字喜忌」:上面的印證、相生、分歧是第一軸,只看各體系五行與日主五行的生剋;第二軸看該五行對此盤是喜用、忌還是閒,依事實區塊「扶抑喜忌」一節與表中「對八字喜忌」欄。身強弱判定、評分、喜忌五行一律照抄事實區塊,因為評分由本站規則算出,另行推算會與頁面不一致;提到時註明這是本站簡化評分、非古籍原文。講某體系落喜用或落忌時,一併講事實區塊按此盤列出的第二軸基率(例如喜用 n 種五行即約 n/5),因為喜忌五行數因盤而異,只有事實區塊的分數適用於此盤。事實區塊標明中和時,寫明此盤不定喜忌、各體系皆為閒,改以第一軸為主。事實區塊標明可能從格時,明說從格喜忌與扶抑相反,第二軸結論僅供參考。
扶抑喜用與系統事實中已有的調候用神是兩套不同方法,並列陳述各自結論,不合併也不互相修正,因為兩者的依據與算法不同,混為一談會讓讀者分不清結論出自哪套。
666、化忌、凶星等,以中性語氣說明其在原體系中的本義(例如 666 是太陽方陣全部數字之和),讓讀者理解而非擔憂。
對照表已由頁面畫出,本節用段落解讀,不重畫表格。`;

/**
 * 單節《命盤格局解讀》指令(分段模式)。lens 決定純八字/純紫微/合參;locale 決定小標題語言。
 * extraFacts:只供 crosssystem 一節使用的多體系事實區塊,附在 user prompt 末尾(不進 system,保 prompt cache)。
 */
export function buildReportSectionPrompt(
  caveats: string[],
  seg: ReportSegment,
  lens: ReportLens = "both",
  locale: AiLocale = "zht",
  extraFacts?: string,
): string {
  const title = segmentTitle(seg.key, locale);
  const cross = seg.key === "crosssystem";
  // 本節指令引用「多體系事實」區塊,缺了就讓模型憑空推算,寧可直接報錯。
  if (cross && !extraFacts?.trim()) throw new Error("crosssystem 一節須傳入 extraFacts(多體系事實區塊)");
  const basisHint = cross
    ? "(哪個體系、計出值、五行、與日主的關係)"
    : lens === "ziwei" ? "(哪个宫位的哪颗星或四化)" : lens === "bazi" ? "(哪一柱/哪个十神/星运/神煞)" : "(哪一柱/哪个十神/哪个宫位的哪颗星或四化)";
  const patternHint = cross
    ? ""
    : `若本节涉及性格/命格${lens === "bazi" ? ",以日主与十神格局立论" : lens === "ziwei" ? ",务必结合命宫三方四正四宫合看主星定格局,先点格局再展开" : ",紫微部分须结合命宫三方四正四宫合看主星定格局"}。`;
  return `请基于上方命盘事实,**只**写【命盘格局解读】中的这一节:「${title}」。
本节要点:${seg.instruction}

${cross ? CROSS_DIRECTIVE : lensDirective(lens)}

要求:
- 【真实直接、不模棱两可】给出明确判断,优点缺点都直说,该断就断;少用"可能/也许/倾向于"安全垫,杜绝放之四海皆准、谁都适用的废话。真矛盾或数据有边界时明说"不确定/两种力量并存"。
- 【篇幅·硬性】本节扼要讲透核心即可,约 ${SECTION_WORDS} 字、3–4 段;**务必在篇幅内把话说完、自然收尾(以句号结束),宁可少写一点,也绝不写到一半被切断。** 不要越界写其它节,也不要把大运流年展开成长篇(那是另一份报告)。
- 每个论断挂依据${basisHint}。${patternHint}
${PLAN_THEN_WRITE}
${VERDICT_FIRST_RULE}
${STYLE_DIRECTIVES}
- **输出以「## ${title}」作为小标题开头,只写这一节。**
${tldrDirective(title)}
${SELF_CHECK}${caveatBlockOf(caveats)}${cross && extraFacts ? `\n\n${extraFacts}` : ""}`;
}

/** 單節《大運流年深析》指令(分段模式)。lens 決定純八字/純紫微/合參;locale 決定小標題語言。 */
export function buildFortuneSectionPrompt(caveats: string[], seg: ReportSegment, lens: ReportLens = "both", locale: AiLocale = "zht", fortune?: FortuneAnalysis): string {
  const title = segmentTitle(seg.key, locale);
  const basis =
    lens === "bazi" ? "(哪步大运/哪年、什么十神、是否引动喜用神)" :
    lens === "ziwei" ? "(哪步大限/哪年、什么四化飞入哪宫)" :
    "(哪步运/哪年、什么十神/什么四化飞哪宫)";
  const ledger = fortune ? fortuneHeadingLedger(seg.key, fortune, locale) : "";
  return `请基于上方命盘事实(尤其【动态运势】数据),**只**写《大运流年深析》中的这一节:「${title}」。每个结论挂依据${basis}。
本节要点:${seg.instruction}

${lensDirective(lens)}

${FORTUNE_NUMBERS_RULE}

${PLAN_THEN_WRITE}

${fortuneAntiRepetition(seg.key)}

${STYLE_DIRECTIVES}

${VERDICT_FIRST_RULE}

铁律:严格区分"命盘能给的领域与吉凶倾向(可肯定)"与"具体事件(不可编造)";流年以立春分界,年份按"倾向应期、可能±1 年"对待,别说得像精确到天。判断要直接敢断、不和稀泥。
【篇幅·硬性】本节约 ${SECTION_WORDS} 字、扼要写透;**务必在篇幅内把话说完、自然收尾(以句号结束),宁短勿断,绝不写到一半被切。**

${ledger}
**输出以「## ${title}」作为小标题开头,只写这一节,不要写其它节。**
${tldrDirective(title)}
${SELF_CHECK}${caveatBlockOf(caveats)}`;
}
