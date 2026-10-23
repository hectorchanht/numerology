import type { BirthInput } from "@numerology/engine";
import { yjT, yjFmt, type YijingLocale } from "./yijingStrings.js";
import { lockScript } from "./script.js";

/**
 * 命盤海報(/poster)的純邏輯層(無 DOM、可測試):
 * 1. 術語跟語言:引擎 / iztro 一律輸出簡體(七杀、命宫…),呢度經 lockScript 按 locale 轉返。
 * 2. 海報資料模型:畫面同導出 PNG 共用同一份 model,保證兩邊字眼一致。
 * 3. Canvas 版面:layoutPoster 只計座標、出繪圖指令;paintPoster 先至落 ctx。
 * 生辰私隱:導出用 includeBirth:false,model 根本冇生辰字串,畫布無從洩漏。
 */

/* ———————————————————— 1. 術語本地化 ———————————————————— */
// 簡⇄繁一律經 lib/script.ts(@dawn-studio/zh-convert);調用方要先 warmScriptFor,冷時原樣返回。

/** 十神 + 十二宮英文名(跟 knowledge 包 MINGLI_GLOSSARY 嘅英文釋義用字一致)。key 用繁體。 */
const TERM_EN: Record<string, string> = {
  比肩: "Friend", 劫財: "Rob Wealth", 食神: "Eating God", 傷官: "Hurting Officer",
  偏財: "Indirect Wealth", 正財: "Direct Wealth", 七殺: "Seven Killings", 正官: "Direct Officer",
  偏印: "Indirect Resource", 正印: "Direct Resource",
  命宮: "Life palace", 兄弟: "Siblings palace", 夫妻: "Spouse palace", 子女: "Children palace",
  財帛: "Wealth palace", 疾厄: "Health palace", 遷移: "Travel palace", 僕役: "Friends palace",
  交友: "Friends palace", 官祿: "Career palace", 田宅: "Property palace", 福德: "Blessings palace",
  父母: "Parents palace",
};

/**
 * UI 術語(十神名、宮位名)跟語言:zht 繁、zhs 簡、en 有英譯就英文,冇就退返繁體。
 */
export function posterTerm(s: string, loc: YijingLocale): string {
  if (!s) return s;
  const t = lockScript(s, loc);
  return loc === "en" ? TERM_EN[t] ?? t : t;
}

/**
 * 干支 / 星曜名:按長期規則唔譯做英文,只跟字形——zhs 簡、zht 及 en 用繁體。
 * (干支字本身簡繁同形,轉換係 no-op。)
 */
export function posterName(s: string, loc: YijingLocale): string {
  return lockScript(s, loc);
}

/** 生成日期按當前語言格式化(唔用瀏覽器系統語言,避免 zht 頁出簡體/英文日期)。 */
const DATE_LOCALE: Record<YijingLocale, string> = { zht: "zh-HK", zhs: "zh-CN", en: "en-US" };
export function posterDate(d: Date, loc: YijingLocale): string {
  return d.toLocaleDateString(DATE_LOCALE[loc], { year: "numeric", month: "long", day: "numeric" });
}

/* ———————————————————— 2. 資料模型 ———————————————————— */

export const POSTER_PILLARS = ["year", "month", "day", "hour"] as const;
const PILLAR_IDS = {
  year: "poster.yearPillar",
  month: "poster.monthPillar",
  day: "poster.dayPillar",
  hour: "poster.hourPillar",
} as const;

/** 由排盤結果抽出海報需要嘅最少欄位(結構上同 ChartResult 兼容)。 */
export interface PosterSource {
  input: BirthInput;
  lunarDate?: string;
  pillars: Record<(typeof POSTER_PILLARS)[number], { ganZhi: string; shiShenGan?: string }>;
  dayMaster: string;
  soul?: { name: string; majorStars: { name: string }[] };
  body?: { name: string };
  dayun?: { ganZhi: string; startAge: number; endAge: number } | null;
  generatedAt: Date;
}

export interface PosterRow {
  key: string;
  label: string;
  value: string;
  /** 跟喺 value 後面嘅細字(主星、歲數)。 */
  note?: string;
  accent?: boolean;
}

export interface PosterPillar {
  key: string;
  ganZhi: string;
  shiShen: string;
  label: string;
}

export interface PosterModel {
  title: string;
  generatedAt: string;
  brand: string;
  /** 生辰區(公曆 + 農曆);導出時為空陣列。 */
  birth: PosterRow[];
  baziHeading: string;
  pillars: PosterPillar[];
  dayMaster: PosterRow;
  ziweiHeading: string;
  ziwei: PosterRow[];
  disclaimer: string;
}

function p2(n: number): string {
  return String(n).padStart(2, "0");
}

function birthLine(input: BirthInput, loc: YijingLocale): string {
  const g = yjT(input.gender === "女" ? "poster.female" : "poster.male", loc);
  return `${input.year}-${p2(input.month)}-${p2(input.day)} ${p2(input.hour)}:${p2(input.minute ?? 0)} ${g}`;
}

/**
 * 建海報 model。includeBirth=false(導出)時唔會讀 input / lunarDate,
 * 生辰資料根本唔入 model——真排除,唔係靠 CSS 隱藏。
 */
export function buildPosterModel(
  src: PosterSource,
  loc: YijingLocale,
  opts: { includeBirth: boolean },
): PosterModel {
  const birth: PosterRow[] = [];
  if (opts.includeBirth) {
    birth.push({ key: "birth", label: yjT("poster.birth", loc), value: birthLine(src.input, loc) });
    if (src.lunarDate) {
      birth.push({ key: "lunar", label: yjT("poster.lunar", loc), value: posterName(src.lunarDate, loc) });
    }
  }

  const ziwei: PosterRow[] = [];
  if (src.soul) {
    const stars = src.soul.majorStars.map((s) => posterName(s.name, loc)).join(" ") || "—";
    ziwei.push({
      key: "soul",
      label: yjT("poster.soulPalace", loc),
      value: posterTerm(src.soul.name, loc),
      note: `${yjT("poster.mainStars", loc)}${loc === "en" ? ": " : ":"}${stars}`,
    });
  }
  if (src.body) {
    ziwei.push({ key: "body", label: yjT("poster.bodyPalace", loc), value: posterTerm(src.body.name, loc) });
  }
  if (src.dayun) {
    ziwei.push({
      key: "dayun",
      label: yjT("poster.dayun", loc),
      value: posterName(src.dayun.ganZhi, loc),
      note: yjFmt(yjT("poster.ageRange", loc), { a: src.dayun.startAge, b: src.dayun.endAge }),
    });
  }

  return {
    title: yjT("poster.title", loc),
    generatedAt: yjFmt(yjT("poster.generatedAt", loc), { date: posterDate(src.generatedAt, loc) }),
    brand: yjT("poster.brand", loc),
    birth,
    baziHeading: yjT("poster.bazi", loc),
    pillars: POSTER_PILLARS.map((k) => ({
      key: k,
      ganZhi: posterName(src.pillars[k].ganZhi, loc),
      shiShen: posterTerm(src.pillars[k].shiShenGan ?? "", loc),
      label: yjT(PILLAR_IDS[k], loc),
    })),
    dayMaster: {
      key: "daymaster",
      label: yjT("poster.daymaster", loc),
      value: posterName(src.dayMaster, loc),
      accent: true,
    },
    ziweiHeading: yjT("poster.ziwei", loc),
    ziwei,
    disclaimer: yjT("poster.disclaimer", loc),
  };
}

/** 模型內所有會畫出嚟嘅文字(測試用:檢查簡體洩漏 / 生辰洩漏)。 */
export function posterTexts(m: PosterModel): string[] {
  const rows = [...m.birth, m.dayMaster, ...m.ziwei];
  return [
    m.title, m.generatedAt, m.brand, m.baziHeading, m.ziweiHeading, m.disclaimer,
    ...m.pillars.flatMap((p) => [p.ganZhi, p.shiShen, p.label]),
    ...rows.flatMap((r) => [r.label, r.value, r.note ?? ""]),
  ].filter(Boolean);
}

/** 導出檔名:只用今日日期,唔帶任何生辰資料。 */
export function posterFilename(d: Date): string {
  return `chart-poster-${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}.png`;
}

/* ———————————————————— 3. Canvas 版面 ———————————————————— */

/** 色板 key,對應 CSS 變數(導出時由 getComputedStyle 讀,兩個主題都啱)。 */
export const POSTER_COLOR_VARS = {
  bg: "--bg",
  card: "--card",
  card2: "--card-2",
  label: "--label",
  label2: "--label-2",
  label3: "--label-3",
  accent: "--accent",
  sep: "--sep",
} as const;
export type PosterColor = keyof typeof POSTER_COLOR_VARS;
export type PosterPalette = Record<PosterColor, string>;

export type PosterOp =
  | { t: "rect"; x: number; y: number; w: number; h: number; r: number; fill: PosterColor }
  | { t: "line"; x: number; y: number; w: number; color: PosterColor }
  | {
      t: "text";
      x: number;
      y: number; // 基線
      text: string;
      size: number;
      weight: number;
      color: PosterColor;
      align: "left" | "center" | "right";
    }
  | { t: "vtext"; x: number; y: number; text: string; size: number; step: number; color: PosterColor }
  | { t: "logo"; x: number; y: number; size: number; r: number };

export interface PosterLayout {
  width: number;
  height: number;
  ops: PosterOp[];
}

/** 量字寬(px);瀏覽器用 ctx.measureText,測試用假實現。 */
export type MeasureFn = (text: string, size: number, weight: number) => number;

/** 海報版面常數(CSS px),同 poster.tsx 嘅 inline CSS 一一對應。 */
export const POSTER_W = 430;
const MARGIN = 16; // 導出圖外圍留邊(頁面底色)
const PAD_X = 20;
const PAD_T = 24;
const PAD_B = 20;
const REM = 16;

/** CJK 逐字斷行,拉丁字按空格斷行。 */
export function wrapText(text: string, maxW: number, size: number, weight: number, measure: MeasureFn): string[] {
  const tokens = text.match(/[A-Za-z0-9'’.,:;!?()\-–—/]+\s*|\s+|./gu) ?? [];
  const lines: string[] = [];
  let cur = "";
  for (const tok of tokens) {
    const next = cur + tok;
    if (cur && measure(next.trimEnd(), size, weight) > maxW) {
      lines.push(cur.trimEnd());
      cur = tok.trimStart();
    } else {
      cur = next;
    }
  }
  if (cur.trim()) lines.push(cur.trimEnd());
  return lines;
}

/** 單行塞唔落就縮細字號(下限 8px),用於四柱格嘅十神英文名。 */
export function fitSize(text: string, maxW: number, size: number, weight: number, measure: MeasureFn): number {
  let s = size;
  while (s > 8 && measure(text, s, weight) > maxW) s -= 0.5;
  return s;
}

/** 計版面:回傳畫布尺寸(CSS px)同繪圖指令。純函數。 */
export function layoutPoster(m: PosterModel, measure: MeasureFn): PosterLayout {
  const ops: PosterOp[] = [];
  const cardX = MARGIN;
  const cardW = POSTER_W;
  const x0 = cardX + PAD_X;
  const cw = cardW - PAD_X * 2;
  const right = x0 + cw;
  let y = MARGIN + PAD_T;

  /* —— 頂部:標題 + 生成日期 | 直排品牌字 + logo —— */
  const titleSize = 28;
  ops.push({ t: "text", x: x0, y: y + titleSize * 1.05, text: m.title, size: titleSize, weight: 700, color: "label", align: "left" });
  const dateTop = y + titleSize * 1.3 + 0.3 * REM;
  ops.push({ t: "text", x: x0, y: dateTop + 13 * 1.1, text: m.generatedAt, size: 13, weight: 400, color: "label2", align: "left" });
  const leftH = dateTop + 13 * 1.45 - y;

  const logoSize = 52;
  const logoX = right - logoSize;
  ops.push({ t: "logo", x: logoX, y, size: logoSize, r: 14 });
  const vSize = 13;
  const vStep = vSize * 1.5; // letter-spacing 0.5em
  const vChars = [...m.brand].length;
  ops.push({ t: "vtext", x: logoX - 0.9 * REM - vSize / 2, y, text: m.brand, size: vSize, step: vStep, color: "label3" });
  y += Math.max(leftH, logoSize, vChars * vStep);

  /* —— 列(label | value + note) —— */
  const labelW = Math.max(13 * 4.2, ...[...m.birth, m.dayMaster, ...m.ziwei].map((r) => measure(r.label, 13, 400)));
  const row = (r: PosterRow, last: boolean): void => {
    const vx = x0 + labelW + 12;
    const vMax = right - vx;
    const top = y + 10;
    let base = top + 16 * 1.1;
    ops.push({ t: "text", x: x0, y: base, text: r.label, size: 13, weight: 400, color: "label2", align: "left" });
    ops.push({ t: "text", x: vx, y: base, text: r.value, size: 16, weight: 400, color: r.accent ? "accent" : "label", align: "left" });
    let h = 16 * 1.45;
    if (r.note) {
      const noteSize = 12.8;
      const vw = measure(r.value, 16, 400) + 8;
      if (vw + measure(r.note, noteSize, 400) <= vMax) {
        ops.push({ t: "text", x: vx + vw, y: base, text: r.note, size: noteSize, weight: 400, color: "label2", align: "left" });
      } else {
        for (const line of wrapText(r.note, vMax, noteSize, 400, measure)) {
          base += noteSize * 1.45;
          h += noteSize * 1.45;
          ops.push({ t: "text", x: vx, y: base, text: line, size: noteSize, weight: 400, color: "label2", align: "left" });
        }
      }
    }
    y = top + h + 10;
    if (!last) ops.push({ t: "line", x: x0, y, w: cw, color: "sep" });
  };
  const heading = (text: string): void => {
    ops.push({ t: "text", x: x0, y: y + 13 * 1.1, text, size: 13, weight: 400, color: "accent", align: "left" });
    y += 13 * 1.45 + 4;
  };

  /* —— 生辰(導出時 model.birth 為空,整段唔畫) —— */
  if (m.birth.length) {
    y += 1.3 * REM;
    m.birth.forEach((r, i) => row(r, i === m.birth.length - 1));
  }

  /* —— 八字四柱 —— */
  y += 1.1 * REM;
  heading(m.baziHeading);
  y += 8;
  const gap = 8;
  const colW = (cw - gap * 3) / 4;
  const pillarH = 12 + 24 * 1.3 + 2 + 12 * 1.35 + 2 + 11 * 1.3 + 12;
  m.pillars.forEach((p, i) => {
    const px = x0 + i * (colW + gap);
    const cx = px + colW / 2;
    ops.push({ t: "rect", x: px, y, w: colW, h: pillarH, r: 12, fill: "card2" });
    let b = y + 12 + 24 * 1.05;
    ops.push({ t: "text", x: cx, y: b, text: p.ganZhi, size: 24, weight: 500, color: "label", align: "center" });
    b += 24 * 0.25 + 2 + 12 * 1.1;
    if (p.shiShen) {
      const s = fitSize(p.shiShen, colW - 8, 12, 400, measure);
      ops.push({ t: "text", x: cx, y: b, text: p.shiShen, size: s, weight: 400, color: "accent", align: "center" });
    }
    b += 12 * 0.25 + 2 + 11 * 1.1;
    ops.push({ t: "text", x: cx, y: b, text: p.label, size: 11, weight: 400, color: "label3", align: "center" });
  });
  y += pillarH + 0.6 * REM;
  row(m.dayMaster, true);

  /* —— 紫微 —— */
  y += 1.1 * REM;
  heading(m.ziweiHeading);
  m.ziwei.forEach((r, i) => row(r, i === m.ziwei.length - 1));

  /* —— 免責 —— */
  y += 1.4 * REM;
  const dSize = 0.72 * REM;
  for (const line of wrapText(m.disclaimer, cw, dSize, 400, measure)) {
    ops.push({ t: "text", x: x0 + cw / 2, y: y + dSize * 1.1, text: line, size: dSize, weight: 400, color: "label2", align: "center" });
    y += dSize * 1.45;
  }
  y += PAD_B;

  const cardH = y - MARGIN;
  ops.unshift({ t: "rect", x: cardX, y: MARGIN, w: cardW, h: cardH, r: 20, fill: "card" });
  return { width: cardW + MARGIN * 2, height: y + MARGIN, ops };
}

/** paintPoster 用到嘅 CanvasRenderingContext2D 子集(測試可傳假 ctx 記錄調用)。 */
export interface PosterCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  imageSmoothingEnabled: boolean;
  imageSmoothingQuality: ImageSmoothingQuality;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  translate(x: number, y: number): void;
  rotate(a: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
  closePath(): void;
  fill(): void;
  stroke(): void;
  clip(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  drawImage(img: CanvasImageSource, x: number, y: number, w: number, h: number): void;
}

function roundRectPath(ctx: PosterCtx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fontSpec(size: number, weight: number, family: string): string {
  return `${weight} ${size}px ${family}`;
}

const CJK = /[⺀-鿿豈-﫿]/;

/** 將版面畫落 ctx(ctx 已按 scale 放大)。logo 載入失敗時(null)畫回朱砂方塊保持構圖。 */
export function paintPoster(
  ctx: PosterCtx,
  layout: PosterLayout,
  palette: PosterPalette,
  family: string,
  scale: number,
  logo: CanvasImageSource | null,
): void {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.textBaseline = "alphabetic";
  for (const op of layout.ops) {
    switch (op.t) {
      case "rect":
        ctx.fillStyle = palette[op.fill];
        roundRectPath(ctx, op.x, op.y, op.w, op.h, op.r);
        ctx.fill();
        break;
      case "line":
        ctx.fillStyle = palette[op.color];
        ctx.fillRect(op.x, op.y - 0.5, op.w, 0.5);
        break;
      case "text":
        ctx.fillStyle = palette[op.color];
        ctx.font = fontSpec(op.size, op.weight, family);
        ctx.textAlign = op.align;
        ctx.fillText(op.text, op.x, op.y);
        break;
      case "vtext": {
        // 仿 writing-mode: vertical-rl:中文逐字直落;拉丁字母順時針轉 90° 排
        ctx.fillStyle = palette[op.color];
        ctx.font = fontSpec(op.size, 400, family);
        ctx.textAlign = "center";
        [...op.text].forEach((ch, i) => {
          const cy = op.y + i * op.step + op.size * 0.88;
          if (CJK.test(ch)) {
            ctx.fillText(ch, op.x, cy);
          } else {
            ctx.save();
            ctx.translate(op.x, op.y + i * op.step + op.size * 0.5);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(ch, 0, op.size * 0.35);
            ctx.restore();
          }
        });
        break;
      }
      case "logo":
        ctx.save();
        roundRectPath(ctx, op.x, op.y, op.size, op.size, op.r);
        if (logo) {
          ctx.clip();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(logo, op.x, op.y, op.size, op.size);
        } else {
          ctx.fillStyle = palette.accent;
          ctx.fill();
        }
        ctx.restore();
        break;
    }
  }
  ctx.restore();
}
