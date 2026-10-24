import {
  layoutPoster,
  paintPoster,
  fontSpec,
  POSTER_COLOR_VARS,
  type PosterModel,
  type PosterPalette,
  type PosterColor,
} from "./poster.js";
import {
  layoutShareCard,
  paintShareCard,
  SHARE_CARD_W,
  SHARE_CARD_H,
  type ShareCardModel,
} from "./shareCard.js";
import { readTheme } from "./theme.js";

/**
 * 命盤海報導出 PNG(瀏覽器端):手寫 Canvas 2D,唔用 html2canvas 之類依賴。
 * model 由呼叫方用 includeBirth:false 建好,呢度只負責畫同儲存。
 */

/** 導出倍率:430px 寬 × 3 = 1290px,手機 Retina 夠清。 */
const SCALE = 3;

/** 由海報元素讀 CSS 變數 → 色板(跟住當前主題)。 */
function readPalette(el: Element): PosterPalette {
  const cs = getComputedStyle(el);
  const out = {} as PosterPalette;
  for (const [k, v] of Object.entries(POSTER_COLOR_VARS) as [PosterColor, string][]) {
    out[k] = cs.getPropertyValue(v).trim() || "#000";
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 主題對應 logo:深色 logo.png、淺色 logo-light.png(同導航列一致)。 */
export function posterLogoSrc(): string {
  return readTheme() === "light" ? "/logo-light.png" : "/logo.png";
}

/** 將海報 model 畫成 PNG Blob。el = 屏幕上嘅海報元素(用嚟讀色板同字體)。 */
export async function renderPosterPng(model: PosterModel, el: Element): Promise<Blob> {
  const palette = readPalette(el);
  const family = getComputedStyle(el).fontFamily || "sans-serif";
  const [logo] = await Promise.all([loadImage(posterLogoSrc()), document.fonts?.ready]);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  const measure = (text: string, size: number, weight: number): number => {
    ctx.font = fontSpec(size, weight, family);
    return ctx.measureText(text).width;
  };
  const layout = layoutPoster(model, measure);
  canvas.width = Math.round(layout.width * SCALE);
  canvas.height = Math.round(layout.height * SCALE);
  paintPoster(ctx, layout, palette, family, SCALE, logo);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

/**
 * 通用分享卡導出 PNG(9:16,1620x2880):同 poster 同一色板/字體,供 /name、/daily、/hepan 用。
 * el = 屏幕上嘅卡元素(用嚟讀色板同字體)。
 */
export async function renderShareCardPng(model: ShareCardModel, el: Element): Promise<Blob> {
  const palette = readPalette(el);
  const family = getComputedStyle(el).fontFamily || "sans-serif";
  await document.fonts?.ready;

  const SCALE = 3;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  const layout = layoutShareCard(model);
  canvas.width = Math.round(SHARE_CARD_W * SCALE);
  canvas.height = Math.round(SHARE_CARD_H * SCALE);
  paintShareCard(ctx, layout, palette, family, SCALE);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

/**
 * 儲存圖片:手機(粗指標)優先用系統分享表(可「儲存影像」入相簿);
 * 唔支援或失敗就退回 <a download>(桌面瀏覽器、Android Chrome 直接落 Downloads)。
 */
export async function savePosterPng(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (coarse && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // 用戶自己取消
      // NotAllowedError 等(例如失咗手勢授權)→ 落去用下載
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
