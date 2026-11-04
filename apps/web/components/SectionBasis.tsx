"use client";

import type { ChartResult } from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { ganWuXing } from "@/lib/ganzhi";
import { sectionBasis, type BasisFact, type PillarKey } from "@/lib/basis";
import { Icon } from "@/components/Icon";

const COL: Record<PillarKey, TKey> = {
  year: "baziT.colYear", month: "baziT.colMonth", day: "baziT.colDay", hour: "baziT.colHour",
};

/**
 * 報告每節嘅「命盤依據」摺疊:由排盤數據直接列出呢節睇咗乜(lib/basis.ts),唔靠模型輸出標記。
 * 同 SectionBody 嘅 AI 依據(.evid)同一套樣式,但永遠喺度。
 */
export function SectionBasis({ chart, segKey }: { chart: ChartResult; segKey: string }) {
  const { t } = useLocale();
  const { z } = useScript();
  const facts = sectionBasis(chart)[segKey];
  if (!facts?.length) return null;

  const label = (f: BasisFact): string => {
    const l = f.label;
    switch (l.kind) {
      case "dayMaster": return t("baziT.kvDayMaster");
      case "palace": return t("basis.palace", { p: z(l.palace) });
      case "tenGod": return t("basis.tenGod", { g: z(l.gods) });
      case "dayBranch": return t("basis.dayBranch");
      case "wuxing": return t("basis.wuxing");
      case "luck": return t("viz.nowLuck");
      case "useGod": return t("viz.useGod");
      case "crossSignal": return t(`cross.sys.${l.system}` as TKey);
    }
  };
  const value = (f: BasisFact): string => {
    const l = f.label;
    if (l.kind === "tenGod") {
      if (!f.hits?.length) return t("basis.none");
      return f.hits
        .map((h) => `${z(h.god)}(${t(h.part === "gan" ? "basis.posGan" : "basis.posZhi", { p: t(COL[h.pillar]) })})`)
        .join("、");
    }
    if (!f.value) return l.kind === "palace" ? t("zw.noMajor") : t("basis.none");
    switch (l.kind) {
      case "dayMaster": return `${z(f.value)}${ganWuXing(f.value) ?? ""} · ${t("baziT.yueling")} ${f.vars?.month ?? ""}`;
      case "wuxing": {
        const strong = t("viz.wxStrong", { el: String(f.vars?.strong ?? "") });
        const miss = f.vars?.missing ? t("viz.wxMissing", { el: String(f.vars.missing) }) : t("viz.wxAll");
        return `${strong} · ${miss}`;
      }
      case "luck": return `${f.value} · ${t("fortune.ageRange", { a: f.vars?.a ?? "", b: f.vars?.b ?? "" })}`;
      case "useGod": return `${z(f.value)}${f.source ? ` · ${t("viz.useGodSub")}` : ""}`;
      case "crossSignal":
        return [z(f.value), String(f.vars?.wuxing ?? ""), t(`cross.rel.${f.vars?.relation}` as TKey), f.vars?.bridge ? t("cross.bridge") : ""]
          .filter(Boolean).join(" · ");
      default: return z(f.value);
    }
  };

  return (
    <details className="evid basis">
      <summary><Icon name="chevDown" small className="caret-ic" />{t("basis.title")}</summary>
      <ul className="evid-list basis-list">
        {facts.map((f, i) => (
          <li key={i}><span className="basis-k">{label(f)}</span>{value(f)}</li>
        ))}
      </ul>
      <p className="basis-note">{t("basis.note")}</p>
    </details>
  );
}
