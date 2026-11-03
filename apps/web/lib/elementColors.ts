/** 五行色票(學院圖表共用)。水嘅邊用 --label-2,喺深色卡(#1c1c1e)上都睇得到。 */
export type Element5 = "木" | "火" | "金" | "水" | "土";

export const ELEMENT_STYLE: Record<Element5, { bg: string; fg: string; bd: string }> = {
  木: { bg: "#2e933c", fg: "#ffffff", bd: "#1e6b28" },
  火: { bg: "#e03131", fg: "#ffffff", bd: "#a61e1e" },
  金: { bg: "#f1f3f5", fg: "#343a40", bd: "#adb5bd" },
  水: { bg: "#212529", fg: "#ffffff", bd: "var(--label-2)" },
  土: { bg: "#eab308", fg: "#422006", bd: "#a16207" },
};
