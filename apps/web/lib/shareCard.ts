import { fontSpec, POSTER_COLOR_VARS, type PosterColor, type PosterPalette } from "./poster.js";

/**
 * 通用分享卡(/name、/daily、/hepan 用):純邏輯層,無 DOM、可測試。
 * 固定 9:16 版式(540x960 logical,導出 x3 = 1620x2880),適合 IG Story / Threads / WhatsApp。
 * 畫面預覽由各頁自行用 HTML 排(同 model),導出 PNG 行呢度嘅 layout + paint,保證字眼一致。
 */

export interface ShareCardRow {
  label: string;
  value: string;
  /** 重點行(用 accent 色) */
  accent?: boolean;
}

export interface ShareCardModel {
  /** 卡種標題,如 姓名測分 */
  title: string;
  /** 主角,如 陳大文 */
  heroName: string;
  /** 大數字,如 67 */
  heroValue: string;
  /** 單位,如 分 */
  heroUnit: string;
  /** 大數字下嘅一句,如 吉 · 旭日東昇 */
  heroNote: string;
  rows: ShareCardRow[];
  disclaimer: string;
  /** 行動呼籲,如 立即測你個名 */
  cta: string;
  /** 分享連結全文 */
  url: string;
  brand: string;
}

export const SHARE_CARD_W = 540;
export const SHARE_CARD_H = 960;

type CardOp =
  | { t: "rect"; x: number; y: number; w: number; h: number; r: number; fill: PosterColor }
  | { t: "seal"; x: number; y: number; s: number; text: string }
  | {
      t: "text"; x: number; y: number; text: string; size: number; weight: number;
      color: PosterColor; align: CanvasTextAlign; maxW?: number;
    }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; color: PosterColor };

/** 版面:由上而下流水排,y 游標推進;回傳 ops + 實際高度(應等於 SHARE_CARD_H)。 */
export function layoutShareCard(m: ShareCardModel): { ops: CardOp[]; width: number; height: number } {
  const ops: CardOp[] = [];
  const W = SHARE_CARD_W;
  const cx = W / 2;
  let y = 0;

  ops.push({ t: "rect", x: 0, y: 0, w: W, h: SHARE_CARD_H, r: 0, fill: "bg" });
  // 內卡
  const pad = 28;
  ops.push({ t: "rect", x: pad, y: pad, w: W - pad * 2, h: SHARE_CARD_H - pad * 2, r: 28, fill: "card" });
  y = pad + 44;

  // 頂:印仔 + 品牌 + 卡種
  ops.push({ t: "seal", x: pad + 28, y, s: 56, text: "命" });
  ops.push({ t: "text", x: pad + 28 + 72, y: y + 22, text: m.brand, size: 26, weight: 700, color: "label", align: "left" });
  ops.push({ t: "text", x: pad + 28 + 72, y: y + 50, text: m.title, size: 22, weight: 400, color: "label2", align: "left" });
  y += 104;
  ops.push({ t: "line", x1: pad + 28, y1: y, x2: W - pad - 28, y2: y, color: "sep" });
  y += 44;

  // Hero:名
  ops.push({ t: "text", x: cx, y, text: m.heroName, size: 46, weight: 700, color: "label", align: "center" });
  y += 84;
  // Hero:數字版(大數字+右下單位)/文字版(自適應字號置中,單位放下一行)
  if (/^\d+$/.test(m.heroValue)) {
    ops.push({ t: "text", x: cx - 30, y, text: m.heroValue, size: 170, weight: 800, color: "accent", align: "center" });
    ops.push({ t: "text", x: cx + 118, y: y - 8, text: m.heroUnit, size: 40, weight: 700, color: "accent", align: "left" });
  } else {
    const len = [...m.heroValue].length;
    const size = len <= 2 ? 150 : len <= 4 ? 110 : len <= 6 ? 88 : 72;
    ops.push({
      t: "text", x: cx, y, text: m.heroValue, size, weight: 800, color: "accent",
      align: "center", maxW: W - 120,
    });
    y += size + 24;
    if (m.heroUnit) {
      ops.push({ t: "text", x: cx, y, text: m.heroUnit, size: 32, weight: 700, color: "accent", align: "center" });
      y += 56;
    }
  }
  y += 200;
  ops.push({ t: "text", x: cx, y, text: m.heroNote, size: 28, weight: 600, color: "label2", align: "center", maxW: W - 120 });
  y += 64;
  ops.push({ t: "line", x1: pad + 28, y1: y, x2: W - pad - 28, y2: y, color: "sep" });
  y += 40;

  // 明細行
  for (const r of m.rows) {
    ops.push({
      t: "text", x: pad + 56, y, text: r.label, size: 25, weight: 400,
      color: "label2", align: "left",
    });
    ops.push({
      t: "text", x: W - pad - 56, y, text: r.value, size: 27, weight: r.accent ? 700 : 500,
      color: r.accent ? "accent" : "label", align: "right", maxW: 300,
    });
    y += 58;
  }
  y += 16;
  ops.push({ t: "line", x1: pad + 28, y1: y, x2: W - pad - 28, y2: y, color: "sep" });
  y += 44;

  // 免責
  ops.push({
    t: "text", x: cx, y, text: m.disclaimer, size: 21, weight: 400,
    color: "label3", align: "center", maxW: W - 120,
  });
  y += 56;

  // CTA + 連結(置底)
  const footY = SHARE_CARD_H - pad - 96;
  ops.push({ t: "text", x: cx, y: footY, text: m.cta, size: 30, weight: 700, color: "accent", align: "center" });
  ops.push({ t: "text", x: cx, y: footY + 44, text: m.url, size: 21, weight: 400, color: "label2", align: "center" });

  return { ops, width: W, height: SHARE_CARD_H };
}

/** 模型內所有會畫出嚟嘅文字(測試用)。 */
export function shareCardTexts(m: ShareCardModel): string[] {
  return [
    m.title, m.heroName, m.heroValue, m.heroUnit, m.heroNote,
    ...m.rows.flatMap((r) => [r.label, r.value]),
    m.disclaimer, m.cta, m.url, m.brand,
  ].filter(Boolean);
}

function ellipsize(
  ctx: CanvasRenderingContext2D, text: string, font: string, maxW: number,
): string {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}

export function paintShareCard(
  ctx: CanvasRenderingContext2D,
  layout: { ops: CardOp[] },
  palette: PosterPalette,
  family: string,
  scale: number,
): void {
  ctx.save();
  ctx.scale(scale, scale);
  for (const op of layout.ops) {
    if (op.t === "rect") {
      ctx.fillStyle = palette[op.fill];
      ctx.beginPath();
      ctx.roundRect(op.x, op.y, op.w, op.h, op.r);
      ctx.fill();
    } else if (op.t === "seal") {
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.roundRect(op.x, op.y, op.s, op.s, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = fontSpec(Math.round(op.s * 0.62), 800, family);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(op.text, op.x + op.s / 2, op.y + op.s * 0.16);
    } else if (op.t === "text") {
      const font = fontSpec(op.size, op.weight, family);
      const text = op.maxW ? ellipsize(ctx, op.text, font, op.maxW) : op.text;
      ctx.font = font;
      ctx.fillStyle = palette[op.color];
      ctx.textAlign = op.align;
      ctx.textBaseline = "top";
      ctx.fillText(text, op.x, op.y);
    } else {
      ctx.strokeStyle = palette[op.color];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(op.x1, op.y1);
      ctx.lineTo(op.x2, op.y2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export { POSTER_COLOR_VARS };
export type { PosterPalette };
