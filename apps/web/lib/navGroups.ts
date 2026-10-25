import type { IconName } from "@/components/Icon";

export interface SubLink {
  href: string;
  id: string;
  icon: IconName;
}

export interface SubGroup {
  /** 組名 yjT id;null = 唔分組(尾段)。 */
  labelId: string | null;
  links: SubLink[];
}

/**
 * 子頁工具連結(全站單一資料源):桌面側欄、手機「更多」sheet 共用。
 * 按用家意圖分組:占卦 / 命理 / 研習 / 海報。
 */
export const SUB_GROUPS: SubGroup[] = [
  {
    labelId: "nav.group.divine",
    links: [
      { href: "/yijing", id: "nav.yijing", icon: "hex" },
      { href: "/yijing/meihua", id: "nav.meihua", icon: "hourglass" },
      { href: "/yijing/liuyao", id: "nav.liuyao", icon: "grid" },
      { href: "/qimen", id: "nav.qimen", icon: "compass" },
    ],
  },
  {
    labelId: "nav.group.destiny",
    links: [
      { href: "/name", id: "nav.name", icon: "user" },
      { href: "/hepan", id: "nav.hepan", icon: "heart" },
      { href: "/fengshui", id: "nav.fengshui", icon: "pin" },
      { href: "/daily", id: "nav.daily", icon: "sun" },
    ],
  },
  {
    labelId: "nav.group.study",
    links: [
      { href: "/yijing/academy", id: "nav.academy", icon: "bulb" },
      { href: "/yijing/gua", id: "nav.gua", icon: "book" },
      { href: "/yijing/cases", id: "nav.cases", icon: "history" },
    ],
  },
  {
    labelId: null,
    links: [{ href: "/poster", id: "nav.poster", icon: "image" }],
  },
];

/** 平鋪版。 */
export const SUB_LINKS: SubLink[] = SUB_GROUPS.flatMap((g) => g.links);

const groupLinks = (labelId: string): SubLink[] =>
  SUB_GROUPS.find((g) => g.labelId === labelId)?.links ?? [];

/**
 * 占卦三法分頁 strip(GroupTabs 用):銅錢 / 梅花 / 六爻 — 同一目的(起卦得本卦)的三種起卦法。
 * 奇門遁甲係另一套排盤系統(唔起卦、唔入占卦歷史),刻意唔入呢條 strip。
 * 占卦歷史已併入首頁「歷史」版,亦唔喺呢度出現。
 */
export const CASTING_TABS: SubLink[] = groupLinks("nav.group.divine").filter((l) =>
  ["/yijing", "/yijing/meihua", "/yijing/liuyao"].includes(l.href),
);

/** 學苑分頁 strip(GroupTabs 用):學院 / 六十四卦 / 佔例庫。 */
export const STUDY_TABS: SubLink[] = groupLinks("nav.group.study");
