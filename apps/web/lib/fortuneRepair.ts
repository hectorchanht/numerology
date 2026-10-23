import type { FortuneAnalysis } from "@numerology/engine";
import type { Locale } from "./i18n.js";

/**
 * 前端确定性修复:服务端 makeFortuneLineFixer(packages/ai/src/prompts.ts)
 * 的客户端镜像,逻辑保持同步。
 * 用途:修复已缓存(KV/历史记录)的旧占位文本,以及服务端未来新增的小标题形状。
 * 渲染时应用,不改存档原文。
 */

const GZ_RE = "[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]";
const PLACEHOLDER_RE = /[-–—]\s*[歲岁]|[歲岁][（(]\s*[-–—]\s*[)）]|[(（]\s*[-–—]\s*[)）]\s*[：:]|ages?\s*[-–—(\[]/i;

interface StepDecadal {
  ganzhi: string;
  palace: string;
}

function dayunHeadingLine(
  d: { ganZhi: string; startAge: number; endAge: number; startYear: number; endYear: number },
  locale: Locale,
): string {
  if (locale === "en")
    return `### ${d.ganZhi} Luck Period (ages ${d.startAge}–${d.endAge} / ${d.startYear}–${d.endYear})`;
  const yun = locale === "zhs" ? "运" : "運";
  const sui = locale === "zhs" ? "岁" : "歲";
  return `### ${d.ganZhi}${yun}（${d.startAge}–${d.endAge}${sui}／${d.startYear}–${d.endYear}年）`;
}

function liuNianHeadingLine(y: { year: number; ganZhi: string; age: number }, locale: Locale): string {
  if (locale === "en") return `### ${y.year} (${y.ganZhi}, age ${y.age})`;
  const sui = locale === "zhs" ? "岁" : "歲";
  return `### ${y.year}年（${y.ganZhi}，${y.age}${sui}）`;
}

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

/** 对单份报告 markdown 做确定性修复(小标题数字 + 紫微大限:無/错配)。 */
export function repairFortuneMarkdown(
  markdown: string,
  fortune: FortuneAnalysis,
  locale: Locale,
): string {
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
  const decadalByYear = new Map<number, StepDecadal>();
  for (const y of fortune.bazi.liuNian) {
    const d = fortune.bazi.daYun.find((s) => s.startYear <= y.year && y.year <= s.endYear);
    const dec = (d as { ziweiDecadal?: { heavenlyStem?: string; earthlyBranch?: string; palaceName?: string } } | undefined)?.ziweiDecadal;
    if (dec && dec.heavenlyStem && dec.earthlyBranch) {
      decadalByYear.set(y.year, { ganzhi: dec.heavenlyStem + dec.earthlyBranch, palace: dec.palaceName ?? "" });
    }
  }
  const cur = (fortune as { ziwei?: { decadal?: { heavenlyStem?: string; earthlyBranch?: string; palaceName?: string } } }).ziwei?.decadal;
  let current: StepDecadal | null =
    cur && cur.heavenlyStem && cur.earthlyBranch
      ? { ganzhi: cur.heavenlyStem + cur.earthlyBranch, palace: cur.palaceName ?? "" }
      : null;
  let seenStep = false;

  const decadalNoneRe = /紫微大限\s*[：:]\s*(?:無|无|没有|未提供|暂无|[—–\-])\s*(?=$|[。，,；;、\s])/;
  const decadalMismatchRe = new RegExp(`紫微大限\\s*[：:]\\s*(${GZ_RE})(?![運运])`);
  const gzRe = new RegExp(`(${GZ_RE})`);

  const fixLine = (line: string): string => {
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
          current = decadalByYear.get(Number(yrm[1]!)) ?? current;
          seenStep = true;
        }
      } else if (gm && (/年/.test(t) || /age/i.test(t))) {
        const fixed = yearByGanzhi.get(gm[1]!);
        if (fixed && (t.length <= 28 || /^#{1,4}\s/.test(t))) {
          const yr = [...liuNianByYear.entries()].find(([, e]) => e.ganZhi === gm[1]!)?.[0];
          current = (yr !== undefined ? decadalByYear.get(Number(yr)) : undefined) ?? null;
          seenStep = true;
          return fixed;
        }
      }
    }
    if (/^##(?!#)/.test(t)) {
      if (seenStep) current = null;
    }
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

  return markdown.split("\n").map(fixLine).join("\n");
}
