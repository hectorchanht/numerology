/** AI 输出语言(与界面语言开关对应)。默认繁体(zht)。 */
export type AiLocale = "zht" | "zhs" | "en";

import type { FortuneAnalysis } from "@numerology/engine";

/**
 * 输出语言指令 —— 追加到 system 末尾,不碰命盘事实块(干支/星曜名三地皆同)。
 * 放在最后一条 system block,Anthropic 的 prompt cache 前缀(人设 + 命盘)不受影响。
 */
export function localeDirective(locale: AiLocale): string {
  if (locale === "zhs") return "【输出语言】请全程使用简体中文撰写,包括标题、术语解释与标点习惯。";
  if (locale === "en")
    return "[Output language] Write the ENTIRE response in English, including headings, terminology explanations, and punctuation conventions. Keep proper nouns (stem/branch/star/palace names) in their original Chinese characters with an English gloss on first use.";
  return "【輸出語言】請全程使用繁體中文(香港用語)撰寫,包括標題、術語解釋與標點習慣。";
}

/**
 * 各报告章节标题的三地对照(key → locale → 标题)。
 * 模型会把 prompt 里的小标题逐字照抄进输出,故标题必须与输出语言一致,
 * 否则会出现"正文繁体、标题简体"的错位。
 */
export const SEGMENT_TITLES: Record<string, Record<AiLocale, string>> = {
  personality: { zht: "性格特質", zhs: "性格特质", en: "Personality Traits" },
  career: { zht: "事業方向", zhs: "事业方向", en: "Career Direction" },
  wealth: { zht: "財富特點", zhs: "财富特点", en: "Wealth Profile" },
  relationship: { zht: "感情婚姻", zhs: "感情婚姻", en: "Relationships & Marriage" },
  health: { zht: "健康提示", zhs: "健康提示", en: "Health Notes" },
  luck: { zht: "大運流年概覽", zhs: "大运流年概览", en: "Luck Cycle Overview" },
  advice: { zht: "總體建議 · 開運參考", zhs: "总体建议 · 开运参考", en: "Overall Advice & Remedies" },
  overview: { zht: "一、當前總覽", zhs: "一、当前总览", en: "1. Current Overview" },
  dayun: { zht: "二、大運逐步精講", zhs: "二、大运逐步精讲", en: "2. Major Luck Periods in Detail" },
  review: { zht: "三、回看校準", zhs: "三、回看校准", en: "3. Review & Calibration" },
  future: { zht: "四、未來流年走向", zhs: "四、未来流年走向", en: "4. Upcoming Annual Trends" },
  rhythm: { zht: "五、節奏與轉折", zhs: "五、节奏与转折", en: "5. Rhythm & Turning Points" },
  action: { zht: "六、行動建議", zhs: "六、行动建议", en: "6. Actionable Advice" },
};

/** 取某章节在指定语言下的标题(缺失时回落简体,再缺失回落 key 本身)。 */
export function segmentTitle(key: string, locale: AiLocale): string {
  return SEGMENT_TITLES[key]?.[locale] ?? SEGMENT_TITLES[key]?.zhs ?? key;
}

/** 解读师人设:真实准确为先、直话直说,不模棱两可。 */
export const SYSTEM_PERSONA = `你是一位兼通【八字四柱】与【紫微斗数】的命理解读师。

最高原则:【真实准确为先,直话直说,不模棱两可】。
- 命盘显示什么就说什么,包括性格短板、不利格局、事业财富感情上的硬伤与风险——直接点破,不绕弯、不和稀泥,不要为了让对方舒服而软化或打折扣。
- 该下明确判断时就果断下判断,不要每句都加"可能 / 也许 / 倾向于"之类的安全垫。放之四海皆准的万能套话、谁都适用的废话,一律不写。
- 但"直接"不等于"编造确定性":命盘信号清晰一致时,果断下结论;当信号本身矛盾、或数据有边界(真太阳时未校正、调候待校对)时,明确说"这一块不确定 / 两种力量并存",而不是含糊带过。诚实=既敢下结论,也敢承认不知道。
- 【铁律:区分"倾向"与"事件"】命盘只能给出领域、性质、吉凶倾向与应期(这些可肯定地说),给不出具体发生了什么事。所以对性格、格局、某段运的吉凶基调可以直接断言;但绝不把"某年你换了工作/破了财/分了手"这类具体事件当作既成事实写出来——那是脑补,也是细节出错的根源。涉及具体年份的事,只说"这一年某领域偏顺/偏逆、容易有某性质的状况",并注意流年以立春分界、应期可能前后差 1 年。

其他原则:
1. 整合八字与紫微两套体系:一致则相互印证;矛盾则如实指出并分析为何矛盾,绝不强行圆说。
2. 【动静结合,运为主导】命盘格局是"静"(先天的牌),大运流年是"动"(后天的局),运在一生中占主导:格局一般行好运能翻身,格局好行逆运也受困。事业/财富/感情的结论必须落到"哪步运、哪些年",而非只看静态命盘下断语。八字看大运流年十神与是否引动喜用神(引动=补益、受克=受困);紫微看大限/流年四化飞入本命哪宫(化禄入某宫=该领域得力、化忌冲某宫=该领域起波折)。
3. 只依据随附的命盘事实推理,绝不臆造命盘里没有的星曜、干支或神煞。每个论断尽量挂依据(哪柱/哪十神/哪宫的哪颗星或四化)。
4. 一句话免责即可、不必反复强调:涉及健康只作提示并建议就医,涉及投资/法律不下绝对结论;命盘是倾向而非注定,最终决定在用户自己。点到为止,别让免责冲淡判断的力度。`;

/** 时辰推断师人设:据已知人生事实,比对当日 12 时辰命盘,反推最可能时辰。 */
export const HOUR_INFER_PERSONA = `你是一位时辰推断师。用户只知道出生的年月日,不知道具体出生时辰。你的任务:通过询问用户【已知的人生事实】,比对该日 12 个时辰各自的命盘格局,推断最可能的出生时辰。

重要原则:
1. 【诚实】时辰推断是概率性的、并非精确测定;它依赖用户提供的真实人生信息来校验,信息越多越准。第一轮就要说明这一点,不要给虚假的确定感。
2. 时辰主要改变【紫微命宫】(同一天 12 时辰 = 12 套不同的命宫格局与命主/身主),八字仅【时柱及其十神】随时辰变。因此主要用命宫主星 / 命格 / 身宫去比对用户的性格、外在特征与人生重大事件。
3. 【提问策略】第一轮先简短自我介绍 + 说明原理,然后询问几个最有区分度的问题:性格特质、长相/体型/气质、父母与兄弟姐妹情况、目前职业或事业方向、健康状况、以及任何记得的人生重大转折(发生在哪一年)。之后据回答聚焦最可能的 2-3 个时辰,再提针对性追问来区分。每轮只问 3-5 个问题,别一次抛太多。
4. 【比对方法】把用户描述映射到候选命盘:命宫主星的性格倾向、命格类型(杀破狼=开创/动荡、机月同梁=稳定/专业、紫府相=稳重/领导、巨日/阳梁等各有特点)、身宫落点、以及重大事件年份是否与某时辰的运势吻合。
5. 【收敛】证据较充分时直接给结论:【最可能时辰】+ 置信度(高/中/低)+ 1-2 个备选 + 推断依据;并提示"若认可,可点下方对应时辰按钮采用,生成完整命盘"。证据不足时继续提问、不硬凑;但一旦能判断就明确说,不要模棱两可地把所有时辰都说成"有可能"。
6. 口吻专业、直接、像聊天,真实为先,不必刻意迎合。`;

/** 报告章节定义。 */
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

/** 组装报告的用户指令。locale 决定章节标题的语言(正文语言由 localeDirective 指令模型)。 */
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
- 【紫微看格局】判断性格与命格时,不要只看命宫单宫,务必结合「命宫三方四正」的四宫合看主星来定格局(如杀破狼、紫府相朝垣、府相朝垣、机月同梁、君臣庆会等),先点明格局再展开。
- 八字与紫微相互印证或分歧都要体现。
- 本报告聚焦【命盘格局】(先天底色)。性格/事业/财富/感情/健康各节为静态底色;「大运流年概览」一节只用一段话点出当前大运/大限对这些底色的加强或削弱即可——【逐步逐年的详细动态分析在另一份《大运流年深析》中,这里不要展开成长篇】。
- 结尾「${segmentTitle("advice", locale)}」落到当前阶段的大方向,并据上方「喜用神方位」给出**开运参考**(有利方位/颜色,可顺带提及适配的行业或环境特质),说明是趋吉性的辅助参考、非硬性规定。${caveatBlock}`;
}

/**
 * 小标题清单(原样照抄用)。
 * 实测教训(2026-10-22 live):只给"格式模板 + 逐字照抄"不够——模型会照着模板的
 * 形状填占位符,输出 `### 甲寅運（–歲／–年）`(en dash 占位,连禁例都换了符号绕过)。
 * 解法是把本节每个小标题的**成品行**直接列出来,让模型逐行复制,不做任何格式转换。
 * 干支/星曜名在 en 下也保留汉字(与 localeDirective 的专有名词规则一致)。
 */
/** 大运小标题成品行(与【小标题清单】同源,供 prompt 与服务端后处理共用)。 */
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

/** 流年小标题成品行(与【小标题清单】同源,供 prompt 与服务端后处理共用)。 */
export function liuNianHeadingLine(y: { year: number; ganZhi: string; age: number }, locale: AiLocale): string {
  if (locale === "en") return `### ${y.year} (${y.ganZhi}, age ${y.age})`;
  const sui = locale === "zhs" ? "岁" : "歲";
  return `### ${y.year}年（${y.ganZhi}，${y.age}${sui}）`;
}

/**
 * 确定性后处理 v2:把模型写残的小标题逐行修复为标准成品行,形状无关。
 * 背景(2026-10-22 live 实证):弱模型(mistral-small)即使 prompt 里给了逐行照抄的
 * 清单,仍会输出 `### 癸未運（–歲／–年）` 这类占位符——纯 prompt 手段不可靠,
 * 必须服务端兜底。2026-10-23 新形状:`- 歲（-）：己巳運`(破折号前缀 + 占位 + 冒号 +
 * 干支運结尾),故 v2 不再限定 `###` 前缀,改为"干支+運锚定 + 标题感"判定。
 *
 * 判定某行是"<干支>運"小标题:干支+運出现在行首(md 前缀后)或短行行尾,或行内有
 * 占位符痕迹;且行内没有该步正确的起始年份数字(有正确年份 = 已写对,不动)。
 * 正文里顺带提到"這步己巳運…"的行(干支運在行中、后有正文、无占位符)不会被误伤。
 */
const GZ_RE = "[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]";
/** 占位符痕迹:短横/破折号配歲、空括号、ages 占位等 */
const PLACEHOLDER_RE = /[-–—]\s*[歲岁]|[歲岁][（(]\s*[-–—]\s*[)）]|[(（]\s*[-–—]\s*[)）]\s*[：:]|ages?\s*[-–—(\[]/i;

interface StepDecadal {
  ganzhi: string;
  palace: string;
}

/** 从行首(md 前缀后)或行尾(短行)抓"<干支>運";行内占位符形状也抓(限短行)。 */
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

/** 有状态的行级修复器:小标题形状无关修复 + 紫微大限"無"/错配修复。 */
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
  // 每年所属大运步的同期大限(回看/未来节里"紫微大限:無"用它修复,而非当前大限)
  const decadalByYear = new Map<number, StepDecadal>();
  for (const y of fortune.bazi.liuNian) {
    const d = fortune.bazi.daYun.find((s) => s.startYear <= y.year && y.year <= s.endYear);
    const dec = (d as { ziweiDecadal?: { heavenlyStem?: string; earthlyBranch?: string; palaceName?: string } } | undefined)?.ziweiDecadal;
    if (dec && dec.heavenlyStem && dec.earthlyBranch) {
      decadalByYear.set(y.year, { ganzhi: dec.heavenlyStem + dec.earthlyBranch, palace: dec.palaceName ?? "" });
    }
  }
  // 总览节等:紫微大限:無 → 当前大限;进入某步大运后切换为该步同期大限。
  const cur = fortune.ziwei?.decadal;
  let current: StepDecadal | null =
    cur && cur.heavenlyStem && cur.earthlyBranch
      ? { ganzhi: cur.heavenlyStem + cur.earthlyBranch, palace: cur.palaceName ?? "" }
      : null;
  /** 是否已见过大运/流年小标题:首个 ##(总览标题)不重置,之后的 ## 才暂停大限修复 */
  let seenStep = false;

  const decadalNoneRe = /紫微大限\s*[：:]\s*(?:無|无|没有|未提供|暂无|[—–\-])\s*(?=$|[。，,；;、\s])/;
  const decadalMismatchRe = new RegExp(`紫微大限\\s*[：:]\\s*(${GZ_RE})(?![運运])`);
  const gzRe = new RegExp(`(${GZ_RE})`);

  return (line: string): string => {
    // 1) 大运小标题
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
    // 2) 流年小标题(不含運)
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
          // 已写对的流年标题:仍切换到该年所属大限,供后文"紫微大限:無"修复用
          current = decadalByYear.get(Number(yrm[1]!)) ?? current;
          seenStep = true;
        }
      } else if (gm && (/年/.test(t) || /age/i.test(t))) {
        // 无年份数字:年（辛丑年） / 年 丙午（歲）
        const fixed = yearByGanzhi.get(gm[1]!);
        if (fixed && (t.length <= 28 || /^#{1,4}\s/.test(t))) {
          const yr = [...liuNianByYear.entries()].find(([, e]) => e.ganZhi === gm[1]!)?.[0];
          current = (yr !== undefined ? decadalByYear.get(Number(yr)) : undefined) ?? null;
          seenStep = true;
          return fixed;
        }
      }
    }
    // 3) 大章节标题(## ):首个(总览)不重置,之后暂停大限修复(由小标题重新驱动)
    if (/^##(?!#)/.test(t)) {
      if (seenStep) current = null;
    }
    // 4) 紫微大限:無 / 干支错配 → 确定性替换(保守:短行才做错配替换)
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
 * 数字铁律。数字绝不自己推算;小标题从【小标题清单】照抄是唯一解法。
 */
const FORTUNE_NUMBERS_RULE = `【数字铁律·小标题原样照抄】
- 下面【小标题清单】给出了本节每个小标题的**标准成品行**——输出时逐行**原样照抄,一字不改**,不做任何格式转换。
- ❌ 严禁在小标题里用任何占位符号(横线、破折号、省略号、"–歲"这类空架子)代替数字;数字必须和清单里的一模一样。小标题缺数字 = 整节作废,必须重写。
- 正文中提到某运/某年时,同样带上岁数与年份(如"1995–2004 这步运"),不写"这步运""那一年"这类无数字指代。`;

/**
 * 去套话纪律(按节定制)。模型会镜像 prompt 的啰嗦,故指令本身必须短;
 * 具体机制要求:写"补益/受困"必须同时写出机制(哪个干支/哪颗星→哪个宫→什么效果),
 * 否则删掉这句。
 * 2026-10-22 live 复盘:模型会把上下文当填空模板——逐字翻译每行数据、每步固定句式。
 * 故纪律必须点名禁止这几种机械行为。
 */
function fortuneAntiRepetition(key: string): string {
  const mechanism = `形容词必须有信息量:每个"补益/受困/顺利"判断必须写出机制(哪个天干/哪颗星、作用在哪个宫、产生什么效果),写不出机制就删掉这句,不要留空话。`;
  switch (key) {
    case "dayun":
      return `【本节纪律】每步大运 3–4 句,只写**这一步独有**的判断。**严禁**:(1)把支藏十神逐个列出再机械复述"A与B相合、C与D相刑"——只点对本运有实质影响的一两个组合;(2)把禄权科忌飞宫逐个报一遍("禄星飞入X宫,权星飞入Y宫…")——只解读真正起作用的(通常是忌和禄),不重要的不提;(3)固定句式"天干X,支藏…,大限…,主题是…"——各步换切入点(有的先讲大限、有的先讲十神、有的先讲与命局的冲合);(4)定性句在"顺利/平稳/挑战/机遇"里轮换——必须说出这步独一无二的特征;(5)段落以 –/— 开头当项目符号。上下文是原料不是提纲:不要把每行数据翻译成一句话。同期大限看各步自己的 └ 大限行,不要套用当前大限。${mechanism}`;
    case "review":
    case "future":
      return `【本节纪律】每年 2–3 句,只讲**这一年独有**的切入点。**严禁**"分析/主题/机会/风险"四段式填表,也严禁把上下文数据逐行翻译成句子——上下文是原料不是提纲,只拣对判断有用的写。${mechanism}`;
    case "rhythm":
      return `【本节纪律】**只列转折点清单**:换运/换限年份、最强发力期、最需谨慎期,每项一句话给理由。**严禁**把前面讲过的内容再解释一遍——这里是目录,不是重播。`;
    default:
      return `【去套话】同一节内不重复句式;每个小节只讲它独有的信息。${mechanism}`;
  }
}

/**
 * 小标题清单(原样照抄用)。
 * 实测教训(2026-10-22 live):只给"格式模板 + 逐字照抄"不够——模型会照着模板的
 * 形状填占位符,输出 `### 甲寅運（–歲／–年）`(en dash 占位,连禁例都换了符号绕过)。
 * 解法是把本节每个小标题的**成品行**直接列出来,让模型逐行复制,不做任何格式转换。
 * 干支/星曜名在 en 下也保留汉字(与 localeDirective 的专有名词规则一致)。
 * 注意:清单只是"尽力而为"的 prompt 手段,最终兜底靠 fixFortuneHeadings(服务端
 * 确定性后处理)。
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
 * 解读风格规则(对齐外部研究中与本 brief 一致的部分)。
 * - mingli-master interpretation_guide.md:敢斷(一句话定性,不说"可能是X也可能是Y")、
 *   禁「值得注意的是」式废话、用日常类比翻译术语。
 * - ziwei-bazi-reading:断语可信度分级——绝不编造古籍断语原文装权威。
 * 与本 brief 冲突的部分(如"像朋友聊天"的过度迎合、置信度概率条)不采纳;
 * 本 brief 的"真实直接、不模棱两可"保持优先。
 */
const FORTUNE_STYLE_RULES = `【表达风格】
- 每步大运/每年开头先给**一句话定性**(如"这步运是先抑后扬的翻身运"),再展开依据;不要"可能是X也可能是Y"。
- 术语第一次出现就用日常类比翻译成人话(如"伤官就像心里那股不服管的劲"——这是例子,类比自己造,不要照抄),每节一两个类比足矣。
- ❌ 禁止的废话开场:「值得注意的是」「总体而言」「整体上是XX的」「需要多加注意」——要么删掉,要么换成有信息量的说法(如「有个反常的地方:……」)。
- 【断语纪律】绝不编造古籍断语原文来装权威:引用断语只能用命盘事实里**明确出现**的原话;想借传统说法时,必须写成"传统有此一说"(表明是传闻口径、非本盘实证),不许写成"古书云:……"式伪引文。`;

/** 组装《大运流年深析》的用户指令——八字 × 紫微合参,逐步逐年,不限篇幅。locale 决定章节标题的语言。 */
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

要求:八字与紫微务必【全程合参】,每个结论指出依据(哪步运/哪年、什么十神/什么四化飞哪宫);判断要直接、敢断、不和稀泥,但**严格区分"命盘能给的领域与吉凶倾向(可肯定)"和"具体事件(不可编造)"**;年份均按"倾向应期、可能±1年"对待。
${FORTUNE_NUMBERS_RULE}
【去套话】各步大运/各年只讲独有信息,不重复同一句式;每步大运看**它自己的同期大限**(动态运势里每步的 └ 大限行),不要把当前大限套到每一步;形容词必须带机制(哪个干支/哪颗星→哪个宫→什么效果),写不出就删。
${FORTUNE_STYLE_RULES}
${ledger}${caveatBlock}`;
}

/* ────────────────────────────────────────────────────────────────────────
 * 分段生成:把两份长报告各拆成多节,每节一次独立 <60s 请求。
 * 目的:整篇一次跑(上万字)会被 Vercel 免费版 maxDuration=60 当场截断。
 * 各节都独立锚定同一份确定性命盘事实(不互相引用 AI 文本),故可分节甚至并行;
 * system(人设 + 命盘)逐节相同且带 prompt cache,节 2+ 命中缓存更省更快。
 * ──────────────────────────────────────────────────────────────────────── */

export interface ReportSegment {
  key: string;
  /** 章节小标题(不含 Markdown #),客户端按此顺序拼接展示。 */
  title: string;
  instruction: string;
}

/** 《命盘格局解读》分节:六节静态底色 + 总体建议。 */
export const REPORT_SEGMENTS: ReportSegment[] = [
  ...REPORT_SECTIONS.map((s) => ({ key: s.key, title: s.title, instruction: s.brief })),
  {
    key: "advice",
    title: "总体建议 · 开运参考",
    instruction:
      "落到当前阶段的大方向;并据上方「喜用神方位」给出开运参考(有利方位/颜色,可顺带提及适配的行业或环境特质),说明是趋吉性的辅助参考、非硬性规定。",
  },
];

/** 《大运流年深析》分节(对应整篇的六个 ## 章节)。 */
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
 * 单节目标字数。设 900–1100 字:足够扎实,又让最慢模型(Opus ~31 字/秒)在 ~35s 内
 * 自然写完、远低于 60s,且自然篇幅落在每节 token 上限之下,从根上避免"半句被切"。
 */
const SECTION_WORDS = "900–1100";

/** 解读视角:纯八字 / 纯紫微 / 两者合参。 */
export type ReportLens = "bazi" | "ziwei" | "both";

/**
 * 视角指令——决定本次只用八字、只用紫微、还是两者合参。
 * 单一体系时强力隔离:就当另一套盘不存在,不互相翻译、不捏合(避免"太杂太乱、反而不准")。
 */
function lensDirective(lens: ReportLens): string {
  if (lens === "bazi")
    return `【只用八字 · 严格隔离】本次**仅以八字四柱体系**分析:日主旺衰、十神、格局、调候用神、五行生克刑冲合会、神煞、大运/流年十神与引动用神。**完全不提、不引用任何紫微内容**(星曜、宫位、四化、大限一律不出现),就当没有紫微盘。忽略人设里"整合两套体系/合参"的部分。若本节要点里分列了「八字看…/紫微看…」,**只做八字那部分**。`;
  if (lens === "ziwei")
    return `【只用紫微 · 严格隔离】本次**仅以紫微斗数体系**分析:命宫及三方四正主星、辅星杂曜、生年四化、十二宫、大限/流年四化飞宫。**完全不提、不引用任何八字内容**(十神、五行、调候、干支、神煞一律不出现),就当没有八字盘。忽略人设里"整合两套体系/合参"的部分。若本节要点里分列了「八字看…/紫微看…」,**只做紫微那部分**。`;
  return `【八字 × 紫微合参】两套都看,各按各自规矩取,再比对结论:相互印证则更可信、分歧则如实标出,不强行圆说。`;
}

/** 单节《命盘格局解读》指令(分段模式)。lens 决定纯八字/纯紫微/合参;locale 决定小标题语言。 */
export function buildReportSectionPrompt(caveats: string[], seg: ReportSegment, lens: ReportLens = "both", locale: AiLocale = "zht"): string {
  const title = segmentTitle(seg.key, locale);
  return `请基于上方命盘事实,**只**写【命盘格局解读】中的这一节:「${title}」。
本节要点:${seg.instruction}

${lensDirective(lens)}

要求:
- 【真实直接、不模棱两可】给出明确判断,优点缺点都直说,该断就断;少用"可能/也许/倾向于"安全垫,杜绝放之四海皆准、谁都适用的废话。真矛盾或数据有边界时明说"不确定/两种力量并存"。
- 【篇幅·硬性】本节扼要讲透核心即可,约 ${SECTION_WORDS} 字、3–4 段;**务必在篇幅内把话说完、自然收尾(以句号结束),宁可少写一点,也绝不写到一半被切断。** 不要越界写其它节,也不要把大运流年展开成长篇(那是另一份报告)。
- 每个论断挂依据${lens === "ziwei" ? "(哪个宫位的哪颗星或四化)" : lens === "bazi" ? "(哪一柱/哪个十神/星运/神煞)" : "(哪一柱/哪个十神/哪个宫位的哪颗星或四化)"}。若本节涉及性格/命格${lens === "bazi" ? ",以日主与十神格局立论" : lens === "ziwei" ? ",务必结合命宫三方四正四宫合看主星定格局,先点格局再展开" : ",紫微部分须结合命宫三方四正四宫合看主星定格局"}。
- **输出以「## ${title}」作为小标题开头,只写这一节。**${caveatBlockOf(caveats)}`;
}

/** 单节《大运流年深析》指令(分段模式)。lens 决定纯八字/纯紫微/合参;locale 决定小标题语言。 */
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

${fortuneAntiRepetition(seg.key)}

${FORTUNE_STYLE_RULES}

铁律:严格区分"命盘能给的领域与吉凶倾向(可肯定)"与"具体事件(不可编造)";流年以立春分界,年份按"倾向应期、可能±1 年"对待,别说得像精确到天。判断要直接敢断、不和稀泥。
【篇幅·硬性】本节约 ${SECTION_WORDS} 字、扼要写透;**务必在篇幅内把话说完、自然收尾(以句号结束),宁短勿断,绝不写到一半被切。**

${ledger}
**输出以「## ${title}」作为小标题开头,只写这一节,不要写其它节。**${caveatBlockOf(caveats)}`;
}
