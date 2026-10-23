/**
 * 大運流年章節的確定性切塊(純函數,可測試)。
 *
 * 背景:AI 被要求按「【定性】/【分析】標記 + 段間空行」輸出(見 @numerology/ai 的
 * VERDICT_FIRST_RULE),但弱模型未必完全照做;前端據標記切塊渲染,標記缺失時有
 * 降級策略(首句=定性),保證舊緩存/舊歷史記錄也能正常看。
 * 標記三地語言共用同一套(類比 TL;DR 標記:不翻譯、原樣照抄)。
 */

const GZ_RE = "[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]";

export const VERDICT_MARK = "【定性】";
export const ANALYSIS_MARK = "【分析】";
export const EVIDENCE_MARK = "【依据】";

/** 取首句(中文按 。！？/英文按 .!?/換行切)作降級定性。 */
function firstSentence(s: string): { head: string; tail: string } {
  const m = s.match(/^(.+?[。！？!?\n])\s*([\s\S]*)$/);
  if (!m) return { head: s.trim(), tail: "" };
  return { head: m[1]!.trim(), tail: (m[2] ?? "").trim() };
}

export interface VerdictAnalysis {
  verdict: string;
  analysis: string;
}

/**
 * 由一段文字切出【定性】與【分析】。
 * - 兩標記皆有 → 按標記切;
 * - 只有其一 → 標記後首句為定性,餘為分析;
 * - 無標記(舊文本) → 首句為定性,餘為分析。
 */
export function parseVerdictAnalysis(text: string): VerdictAnalysis {
  const t = (text ?? "").trim();
  if (!t) return { verdict: "", analysis: "" };
  const vi = t.indexOf(VERDICT_MARK);
  const ai = t.indexOf(ANALYSIS_MARK);
  if (vi >= 0 && ai > vi) {
    return {
      verdict: t.slice(vi + VERDICT_MARK.length, ai).trim(),
      analysis: t.slice(ai + ANALYSIS_MARK.length).trim(),
    };
  }
  let mark: string | null = null;
  if (vi >= 0) mark = VERDICT_MARK;
  else if (ai >= 0) mark = ANALYSIS_MARK;
  if (mark) {
    const rest = t.slice(t.indexOf(mark) + mark.length).trim();
    const f = firstSentence(rest);
    return { verdict: f.head, analysis: f.tail };
  }
  const f = firstSentence(t);
  return { verdict: f.head, analysis: f.tail };
}

export interface StepChunk {
  /** 該步 key(干支或年份字串)。 */
  key: string;
  /** 原始小標題行(含 markdown 標記)。 */
  heading: string;
  /** 小標題之後的正文(未切塊)。 */
  body: string;
}

/** 通用切塊:按行掃描,命中任一 key 即開新塊。 */
function splitByKeys(
  md: string,
  keys: string[],
  keyOfLine: (line: string) => string | null,
): StepChunk[] {
  const chunks: StepChunk[] = [];
  let cur: StepChunk | null = null;
  const body: string[] = [];
  const flush = () => {
    if (cur) {
      cur.body = body.join("\n").trim();
      chunks.push(cur);
      body.length = 0;
    }
  };
  for (const line of md.split("\n")) {
    const k = keyOfLine(line);
    if (k && keys.includes(k)) {
      flush();
      cur = { key: k, heading: line.trim(), body: "" };
    } else if (cur) {
      body.push(line);
    }
  }
  flush();
  return chunks;
}

const DAYUN_HEAD_RE = new RegExp(`(${GZ_RE})\\s*(?:[運运]|Luck\\s*Period)`);

/** 大運節切塊:key = 干支(如 "戊辰")。 */
export function splitDayunSteps(md: string, ganzhis: string[]): StepChunk[] {
  return splitByKeys(md, ganzhis, (line) => {
    const m = line.match(DAYUN_HEAD_RE);
    return m ? m[1]! : null;
  });
}

const YEAR_HEAD_RE = /(\d{4})\s*(?:年|\()/;

/** 流年節切塊:key = 年份字串(如 "2023")。 */
export function splitYearBlocks(md: string, years: number[]): StepChunk[] {
  const keys = years.map(String);
  return splitByKeys(md, keys, (line) => {
    const m = line.match(YEAR_HEAD_RE);
    return m ? m[1]! : null;
  });
}

export interface EvidenceSplit {
  /** 【依据】之前的正文。 */
  body: string;
  /** 【依据】之後的證據行(去空行、去列表符、去小標題)。 */
  evidence: string[];
}

/**
 * 切出段尾【依据】塊。無標記(舊文本) → evidence 為空,正文原樣。
 * 遇到小標題即停(證據塊只取段尾連續行)。
 */
export function parseEvidenceBlock(md: string): EvidenceSplit {
  const i = md.indexOf(EVIDENCE_MARK);
  if (i < 0) return { body: md, evidence: [] };
  const body = md.slice(0, i).trimEnd();
  const evidence: string[] = [];
  for (const raw of md.slice(i + EVIDENCE_MARK.length).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#{1,4}\s/.test(line)) break;
    evidence.push(line.replace(/^[-*•·\d.)\]]+\s*/, "").trim());
  }
  return { body, evidence: evidence.filter(Boolean) };
}

export interface RhythmItem {
  year: number | null;
  text: string;
}

/**
 * 節奏與轉折清單:一年一行、年份開頭(見 fortuneAntiRepetition rhythm)。
 * 非年份開頭的行照收(year=null),小標題/TL;DR 行跳過。
 */
export function parseRhythmItems(md: string): RhythmItem[] {
  const items: RhythmItem[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trim().replace(/^[-*•·]\s*/, "");
    if (!line || /^#{1,4}\s/.test(line) || /^TL;DR[:：]/i.test(line)) continue;
    const m = line.match(/^(\d{4})\s*[年:：\-–—]+\s*(.*)$/);
    if (m) {
      items.push({ year: parseInt(m[1]!, 10), text: m[2]!.trim() });
    } else {
      items.push({ year: null, text: line });
    }
  }
  return items;
}
