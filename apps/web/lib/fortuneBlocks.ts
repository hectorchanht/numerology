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
/**
 * 證據標記有繁簡兩形:prompt 叫模型照抄簡體【依据】,但模型出繁體正文嗰陣
 * 幾乎必寫繁體【依據】(2026-11-02 真機實測:7 份真實輸出全部用【依據】、
 * 【依据】零命中,舊 parser 因此永遠切唔出證據)。兩形都要認,唔好再假設單一形。
 */
export const EVIDENCE_MARKS = ["【依据】", "【依據】"] as const;

/** 喺 text 入面搵 marks 之中最早出現嗰個(由 from 起)。 */
function findFirstMark(
  text: string,
  marks: readonly string[],
  from = 0,
): { index: number; mark: string } | null {
  let best: { index: number; mark: string } | null = null;
  for (const mark of marks) {
    const i = text.indexOf(mark, from);
    if (i >= 0 && (best === null || i < best.index)) best = { index: i, mark };
  }
  return best;
}

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
 * 切出段尾【依据】塊(繁簡兩形皆認)。無標記(舊文本) → evidence 為空,正文原樣。
 * 遇到小標題或下一個定性/分析標記即停(證據塊只取段尾連續行,唔吞之後嘅正文)。
 */
export function parseEvidenceBlock(md: string): EvidenceSplit {
  const hit = findFirstMark(md ?? "", EVIDENCE_MARKS);
  if (!hit) return { body: md, evidence: [] };
  const body = md.slice(0, hit.index).trimEnd();
  const evidence: string[] = [];
  for (const raw of md.slice(hit.index + hit.mark.length).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#{1,4}\s/.test(line)) break;
    if (line.startsWith(VERDICT_MARK) || line.startsWith(ANALYSIS_MARK)) break;
    evidence.push(line.replace(/^[-*•·\d.)\]]+\s*/, "").trim());
  }
  return { body, evidence: evidence.filter(Boolean) };
}

/* ── 全節分塊(預設正文渲染用) ───────────────────────────────────
 * 背景(2026-11-02 真機截圖實證):報告節嘅真實模型輸出同 prompt 假設有落差——
 * (1)【分析】多數黐喺【定性】段尾同一行/同段(inline),唔係獨立段落;
 * (2)證據標記係繁體【依據】,唔係 prompt 寫嘅【依据】;
 * (3)一節有 3–4 組「定性(+分析)+依據」,唔係全節得一嚿段尾證據;
 * (4)弱模型可以全節冇定性/分析標記,只有「一段文字 + 一嚿依據」重複(實測 gpt-oss)。
 * 舊渲染齋靠段尾 parseEvidenceBlock 一次過切,三樣全部 miss → 成節原樣
 * markdown 一幅文字牆。parseSectionBlocks 改用標記出現位置(唔理段落邊界)
 * 逐嚿切,標記去到邊切到邊;無標記者原樣做 plain 塊,內容一字不吞。
 */

export type SectionNode =
  | { kind: "plain"; md: string; evidence: string[] }
  | { kind: "va"; verdict: string; analysis: string; evidence: string[] };

const SECTION_MARK_RE = /【定性】|【分析】|【依據】|【依据】/g;
const LIST_ITEM_RE = /^(?:[-*•·]\s+|\d{1,2}[.)、]\s*)/;

/**
 * 一嚿證據文本(標記之後、下一個標記之前) → 證據條目 + 尾隨正文。
 * - 列表行(以 -、*、• 等符號開頭)逐行一條;未見列表符號之前嘅非空行當平鋪證據逐行收;
 * - 見過列表之後再出現嘅非列表行,或者小標題行起 → 係證據之後嘅正文
 *   (實測:模型會喺證據後加「（全文共約1050字）」或 ### 小標題+金句),歸 trailing 交回正文,唔吞。
 */
function parseEvidenceText(chunk: string): { items: string[]; trailing: string } {
  const items: string[] = [];
  const trailing: string[] = [];
  let sawList = false;
  let inTrailing = false;
  for (const raw of chunk.split("\n")) {
    const line = raw.trim();
    if (inTrailing) {
      trailing.push(raw);
      continue;
    }
    if (!line) continue;
    if (/^#{1,6}\s/.test(line) || sawList) {
      if (!LIST_ITEM_RE.test(line)) {
        inTrailing = true;
        trailing.push(raw);
        continue;
      }
    }
    if (LIST_ITEM_RE.test(line)) {
      sawList = true;
      items.push(line.replace(LIST_ITEM_RE, "").trim());
    } else {
      items.push(line);
    }
  }
  return { items: items.filter(Boolean), trailing: trailing.join("\n").trim() };
}

/**
 * 將一節正文(已抽走思考/TL;DR/標題)切成有序塊:
 * 每個【定性】開新 va 塊(定性 + 分析 + 該塊證據);標記外嘅文字做 plain 塊;
 * 【依據】無論喺段首定段中都抽出嚟掛喺當前塊,下一個塊開始即止。
 * 無任何標記(舊文本) → 一個 plain 塊原樣,唔改一字。
 */
export function parseSectionBlocks(md: string): SectionNode[] {
  const src = md ?? "";
  type Node = SectionNode;
  const nodes: Node[] = [];
  let cur: Node | null = null;
  let field: "plain" | "verdict" | "analysis" | "evidence" = "plain";

  const plainNode = (): Extract<Node, { kind: "plain" }> => {
    if (cur && cur.kind === "plain") return cur;
    const n: Node = { kind: "plain", md: "", evidence: [] };
    nodes.push(n);
    cur = n;
    return n;
  };
  const vaNode = (): Extract<Node, { kind: "va" }> => {
    const n: Node = { kind: "va", verdict: "", analysis: "", evidence: [] };
    nodes.push(n);
    cur = n;
    return n;
  };
  /** cur 若係 va 塊就回傳佢(經函數讀,避開 TS 對 closure 賦值嘅窄化誤判)。 */
  const curVa = (): Extract<Node, { kind: "va" }> | null =>
    cur && cur.kind === "va" ? cur : null;
  const assign = (text: string) => {
    if (!text) return;
    if (field === "verdict") {
      const n = curVa() ?? vaNode();
      n.verdict += text;
    } else if (field === "analysis") {
      const n = curVa() ?? vaNode();
      n.analysis += text;
    } else {
      plainNode().md += text;
    }
  };
  const assignEvidence = (chunk: string) => {
    if (!chunk.trim()) return;
    const { items, trailing } = parseEvidenceText(chunk);
    const host = cur ?? plainNode();
    host.evidence.push(...items);
    if (trailing) {
      // 證據後嘅正文必須自成新 plain 塊:唔可以黐返去 host 度——host 嘅證據
      // 已經收尾,trailing 係下一段正文(佢自己之後可能再有證據要掛)。
      const n: Node = { kind: "plain", md: trailing, evidence: [] };
      nodes.push(n);
      cur = n;
      field = "plain";
    }
  };
  const flush = (text: string) => {
    if (field === "evidence") assignEvidence(text);
    else assign(text);
  };

  let last = 0;
  for (const m of src.matchAll(SECTION_MARK_RE)) {
    flush(src.slice(last, m.index));
    if (m[0] === VERDICT_MARK) {
      vaNode();
      field = "verdict";
    } else if (m[0] === ANALYSIS_MARK) {
      if (!curVa()) vaNode();
      field = "analysis";
    } else {
      field = "evidence";
    }
    last = m.index + m[0].length;
  }
  flush(src.slice(last));

  const out: SectionNode[] = [];
  for (const n of nodes) {
    if (n.kind === "plain") {
      const text = n.md.trim();
      if (text || n.evidence.length) out.push({ kind: "plain", md: text, evidence: n.evidence });
    } else {
      const verdict = n.verdict.trim();
      const analysis = n.analysis.trim();
      if (verdict || analysis || n.evidence.length) {
        out.push({ kind: "va", verdict, analysis, evidence: n.evidence });
      }
    }
  }
  return out;
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
