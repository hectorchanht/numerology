"use client";

import { useEffect, useMemo, useState } from "react";
import { castZiweiHoroscope, type BirthInput, type ZiweiChart, type ZiweiLayer, type ZiweiPalace, type ZiweiStar } from "@numerology/engine";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { Seg } from "@/components/ui";
import { ZiweiExtras } from "@/components/ZiweiExtras";

type LayerSel = "natal" | ZiweiLayer["key"];
const LAYER_KEYS: Record<LayerSel, TKey> = {
  natal: "ziwei.layer.natal", decadal: "ziwei.layer.decadal", age: "ziwei.layer.age",
  yearly: "ziwei.layer.yearly", monthly: "ziwei.layer.monthly", daily: "ziwei.layer.daily",
};

/** 瀏覽器時區今日 YYYY-M-D(引擎格式);只可喺 client 呼叫。 */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
const toInputDate = (s: string) => s.split("-").map((x) => x.padStart(2, "0")).join("-");

/** 地支 → 傳統紫微盤 4×4 網格座標 [row, col]。 */
const GRID: Record<string, [number, number]> = {
  巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
  辰: [2, 1], 酉: [2, 4],
  卯: [3, 1], 戌: [3, 4],
  寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4],
};

const RING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 某地支的三方四正地支集合(本宮 + 對宮 + 兩三合)。 */
function sanFangBranches(branch: string): { self: string; opposite: string; trine: string[] } {
  const i = RING.indexOf(branch);
  return {
    self: branch,
    opposite: RING[(i + 6) % 12]!,
    trine: [RING[(i + 4) % 12]!, RING[(i + 8) % 12]!],
  };
}

type Highlight = "self" | "opposite" | "trine";

const BADGE_KEYS: Record<Highlight, TKey> = {
  self: "zw.ben",
  opposite: "zw.dui",
  trine: "zw.sanhe",
};

function StarSpan({ star, kind }: { star: ZiweiStar; kind: "major" | "minor" }) {
  const { z } = useScript();
  return (
    <span className={`star ${kind}`}>
      {z(star.name)}
      {star.brightness ? <span className="bri">{z(star.brightness)}</span> : null}
      {/* className 保留引擎原字(CSS 用 .hua.忌),只轉顯示字 */}
      {star.mutagen ? <span className={`hua ${star.mutagen}`}>{z(star.mutagen)}</span> : null}
    </span>
  );
}

function Palace({
  p, highlight, onSelect, layer, douJun,
}: {
  p: ZiweiPalace;
  highlight: Highlight | null;
  onSelect: (branch: string) => void;
  /** 揀咗運限層先有 */
  layer?: ZiweiLayer;
  douJun?: boolean;
}) {
  const { t } = useLocale();
  const { z } = useScript();
  const [row, col] = GRID[p.earthlyBranch] ?? [1, 1];
  const cls = [
    "palace",
    p.isSoulPalace ? "soul" : "",
    p.isBodyPalace ? "body" : "",
    highlight ? `hl-${highlight}` : "",
    layer && !layer.active ? "dim" : "",
  ].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      className={cls}
      style={{ gridRow: row, gridColumn: col }}
      onClick={() => onSelect(p.earthlyBranch)}
      aria-pressed={highlight === "self"}
    >
      <span className="stars">
        {p.majorStars.length
          ? p.majorStars.map((s) => <StarSpan key={s.name} star={s} kind="major" />)
          : <span className="empty">{t("zw.noMajor")}</span>}
        {p.minorStars.map((s) => <StarSpan key={s.name} star={s} kind="minor" />)}
      </span>
      {layer ? (
        <span className="stars layer-stars">
          <span>
            {z(layer.palaceNames[p.index])}
            {layer.palaceIndex === p.index ? ` ★${t("ziwei.layer.ming", { l: t(LAYER_KEYS[layer.key]) })}` : ""}
          </span>
          {layer.sihua.filter((h) => h.intoPalace === p.name).map((h) => (
            <span key={h.type}>{t(LAYER_KEYS[layer.key])}{z(h.type)}{z(h.star)}</span>
          ))}
          {layer.stars.filter((s) => s.natalPalaceName === p.name).map((s) => <span key={s.name}>{z(s.name)}</span>)}
        </span>
      ) : null}
      <span className="pn">
        <b>{z(p.name)}</b>
        <span className="dr">{p.decadal.range[0]}–{p.decadal.range[1]}</span>
      </span>
      {p.isBodyPalace ? <span className="tag">{t("zw.body")}</span> : null}
      {douJun ? <span className="tag doujun">{t("ziwei.doujun")}</span> : null}
      {highlight ? <span className="sfsz-badge">{t(BADGE_KEYS[highlight])}</span> : null}
    </button>
  );
}

/** 紫微 4×4 宮盤:撳宮位高亮三方四正,下方列出該宮全部星曜與十二神。 */
export function ZiweiBoard({ ziwei, input, center }: { ziwei: ZiweiChart; input: BirthInput; center?: React.ReactNode }) {
  const { t } = useLocale();
  const { z } = useScript();
  const [selected, setSelected] = useState<string>(ziwei.soulPalaceBranch);
  const [layerSel, setLayerSel] = useState<LayerSel>("natal");
  const [date, setDate] = useState(""); // SSR 唔知用戶時區,mount 後先填今日
  useEffect(() => setDate(todayStr()), []);
  const horoscope = useMemo(() => {
    if (!date) return null;
    try {
      return castZiweiHoroscope(input, date);
    } catch {
      return null; // 日期超出可排範圍
    }
  }, [input, date]);
  const layer = layerSel === "natal" ? undefined : horoscope?.layers.find((l) => l.key === layerSel);
  const sf = sanFangBranches(selected);
  const highlightOf = (branch: string): Highlight | null => {
    if (branch === sf.self) return "self";
    if (branch === sf.opposite) return "opposite";
    if (sf.trine.includes(branch)) return "trine";
    return null;
  };
  const sel = ziwei.palaces.find((p) => p.earthlyBranch === selected);
  const selName = z(sel?.name);
  const relNames = [sf.opposite, ...sf.trine]
    .map((b) => z(ziwei.palaces.find((p) => p.earthlyBranch === b)?.name))
    .filter(Boolean)
    .join("、");

  return (
    <>
      <Seg
        compact
        label={t("ziwei.layer.label")}
        value={layerSel}
        onChange={setLayerSel}
        options={(Object.keys(LAYER_KEYS) as LayerSel[]).map((k) => ({ value: k, label: t(LAYER_KEYS[k]) }))}
      />
      <label className="note layer-date">
        {t("ziwei.layer.date")}{" "}
        <input
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={date ? toInputDate(date) : ""}
          onChange={(e) => e.target.value && setDate(e.target.value.split("-").map(Number).join("-"))}
        />
      </label>
      {layer && !layer.active ? <p className="note">{t("ziwei.layer.inactive")}</p> : null}
      <div className="ziwei-board">
        {ziwei.palaces.map((p) => (
          <Palace key={p.index} p={p} highlight={highlightOf(p.earthlyBranch)} onSelect={setSelected} layer={layer} douJun={!!layer && horoscope?.douJun.branch === p.earthlyBranch} />
        ))}
        <div className="board-center">
          {center ?? (
            <>
              <div className="big">{z(ziwei.fiveElementsClass)}</div>
              <div className="sm">
                {t("baziT.kvSoulLord")} {z(ziwei.soul)} · {t("baziT.kvBodyLord")} {z(ziwei.body)}
                <br />
                {t("zw.soulBody", { a: ziwei.soulPalaceBranch, b: ziwei.bodyPalaceBranch })}
                <br />
                {z(ziwei.chineseDate)}
              </div>
            </>
          )}
        </div>
      </div>
      <p className="note sfsz-hint">
        {t("zw.hintA")}<strong>{t("zw.hintB")}</strong>{t("zw.hintC")}
        <strong className="accent">{selName}</strong>{t("zw.hintD")}{selName}{t("zw.hintE")} + {relNames}。
      </p>

      {sel ? (
        <div className="list palace-detail">
          <div className="row plain">
            <span className="lbl"><b>{selName}</b></span>
            <span className="val">{sel.heavenlyStem}{sel.earthlyBranch}{sel.isBodyPalace ? ` · ${t("zw.body")}` : ""}</span>
          </div>
          <div className="row plain">
            <span className="lbl">{t("zw.major")}</span>
            <span className="val wrap">
              {sel.majorStars.length ? sel.majorStars.map((s) => <StarSpan key={s.name} star={s} kind="major" />) : t("zw.noMajor")}
            </span>
          </div>
          {sel.minorStars.length ? (
            <div className="row plain">
              <span className="lbl">{t("zw.minor")}</span>
              <span className="val wrap">{sel.minorStars.map((s) => <StarSpan key={s.name} star={s} kind="minor" />)}</span>
            </div>
          ) : null}
          {sel.adjectiveStars.length ? (
            <div className="row plain">
              <span className="lbl">{t("zw.adj")}</span>
              <span className="val wrap">{z(sel.adjectiveStars.map((s) => s.name).join(" "))}</span>
            </div>
          ) : null}
          <div className="row plain">
            <span className="lbl">{t("zw.decadal")}</span>
            <span className="val">
              {sel.decadal.range[0]}–{sel.decadal.range[1]} · {sel.decadal.heavenlyStem}{sel.decadal.earthlyBranch}
            </span>
          </div>
          <div className="row plain">
            <span className="lbl">{t("ziwei.sanfangMajor")}</span>
            <span className="val wrap">{sel.sanFang.majorStars.map((s) => z(s)).join("、") || t("zw.noMajor")}</span>
          </div>
          <div className="row plain">
            <span className="lbl">{t("zw.gods")}</span>
            <span className="val wrap">{z(`${sel.changsheng12} · ${sel.boshi12} · ${sel.jiangqian12} · ${sel.suiqian12}`)}</span>
          </div>
        </div>
      ) : null}
      <ZiweiExtras ziwei={ziwei} input={input} horoscope={horoscope} />
    </>
  );
}
