import { astro, util } from "iztro";
import type { BirthInput } from "./types.js";
import { hourToTimeIndex, validateBirthInput } from "./time.js";
import { resolveBirthDateTime } from "./solartime.js";

type Mut = "禄" | "权" | "科" | "忌";
const TYPES: Mut[] = ["禄", "权", "科", "忌"];

export interface ZiweiFeixing {
  tier: "modern";
  note: string;
  /** 十二宮 × 四化 = 48 條 */
  flies: { from: string; stem: string; type: Mut; star: string; intoPalace: string }[];
  selfMutaged: { palace: string; type: Mut; star: string }[];
  luJiJiaoChi: { luPalace: string; jiPalace: string }[];
}

/**
 * 祿忌交馳:A 宮宮干化祿入 B 宮,同時 B 宮宮干化忌入返 A 宮 → 一對 {luPalace:A, jiPalace:B}。
 * 本站採此定義,各派不一。
 */
export function findLuJiJiaoChi(
  flies: { from: string; type: string; intoPalace: string }[],
): { luPalace: string; jiPalace: string }[] {
  return flies
    .filter((l) => l.type === "禄" && l.intoPalace !== "未入盘")
    .filter((l) =>
      flies.some((j) => j.type === "忌" && j.from === l.intoPalace && j.intoPalace === l.from),
    )
    .map((l) => ({ luPalace: l.from, jiPalace: l.intoPalace }));
}

/** 飛星派:宮干飛化四化、自化、祿忌交馳(二十世紀流派說法)。 */
export function castZiweiFeixing(input: BirthInput): ZiweiFeixing {
  validateBirthInput(input);
  const t = resolveBirthDateTime(input);
  const a = astro.bySolar(`${t.year}-${t.month}-${t.day}`, hourToTimeIndex(t.hour), input.gender, true, "zh-CN");

  const flies: ZiweiFeixing["flies"] = [];
  const selfMutaged: ZiweiFeixing["selfMutaged"] = [];
  for (const raw of a.palaces) {
    const p = a.palace(raw.name)!; // 須經 a.palace() 先綁定 astrolabe,mutagedPlaces 先有用
    const stars = util.getMutagensByHeavenlyStem(p.heavenlyStem);
    const into = p.mutagedPlaces();
    TYPES.forEach((type, i) => {
      const star = stars[i] ?? "";
      flies.push({ from: p.name, stem: p.heavenlyStem, type, star, intoPalace: into[i]?.name ?? "未入盘" });
      if (p.selfMutaged(type)) selfMutaged.push({ palace: p.name, type, star });
    });
  }
  return {
    tier: "modern",
    note: "飛星派說法(二十世紀),非《紫微斗數全書》內容",
    flies,
    selfMutaged,
    luJiJiaoChi: findLuJiJiaoChi(flies),
  };
}
