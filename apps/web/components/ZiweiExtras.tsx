"use client";

import { useMemo, useState } from "react";
import { castZiweiFeixing, type BirthInput, type ZiweiChart, type ZiweiHoroscope } from "@numerology/engine";
import { ZIWEI_STARS } from "@numerology/knowledge";
import { useLocale, useScript, type TKey } from "@/lib/i18n";

const VERDICT: Record<string, TKey> = { 吉: "ziwei.geju.vJi", 凶: "ziwei.geju.vXiong", 中: "ziwei.geju.vZhong" };

/** 格局卡、疊化、飛星派(預設摺埋)、十四主星條目。 */
export function ZiweiExtras({
  ziwei, input, horoscope,
}: {
  ziwei: ZiweiChart;
  input: BirthInput;
  horoscope: ZiweiHoroscope | null;
}) {
  const { t } = useLocale();
  const { z, zT } = useScript();
  const [star, setStar] = useState<string | null>(null);
  const fx = useMemo(() => castZiweiFeixing(input), [input]);
  const entry = ZIWEI_STARS.find((s) => s.name === star);

  return (
    <>
      <h2 className="group-title">{t("ziwei.geju.title")}</h2>
      {ziwei.geju.length ? (
        <div className="list">
          {ziwei.geju.map((g) => (
            <div key={g.id} className="row plain" style={{ display: "block" }}>
              <b>{z(g.name)}</b>{" "}
              <span className={`tag${g.verdict === "吉" ? " accent" : g.verdict === "凶" ? " warn" : ""}`}>
                {t(VERDICT[g.verdict] ?? "ziwei.geju.vZhong")}
              </span>
              <p className="note">{zT(g.cite)}</p>
              <details>
                <summary className="note">{t("ziwei.geju.steps")}</summary>
                <ol className="note">{g.steps.map((s, i) => <li key={i}>{z(s)}</li>)}</ol>
              </details>
            </div>
          ))}
        </div>
      ) : <p className="note">{t("ziwei.geju.none")}</p>}

      <h2 className="group-title">{t("ziwei.overlap.title")}</h2>
      {horoscope?.overlaps.length ? (
        <div className="list">
          {horoscope.overlaps.map((o) => (
            <div key={o.star} className="row plain">
              <span className="lbl"><b>{z(o.star)}</b> · {z(o.natalPalaceName)}</span>
              <span className="val wrap">
                {o.layers.map((l) => `${z(l.layer)}${z(l.type)}`).join(" + ")} · {z(o.tag)}
              </span>
            </div>
          ))}
        </div>
      ) : <p className="note">{t("ziwei.overlap.none")}</p>}

      <details style={{ marginTop: 16 }}>
        <summary className="group-title">{t("ziwei.feixing.summary")}</summary>
        <h3 className="note"><b>{t("ziwei.feixing.jiaochi")}</b></h3>
        <p className="note">
          {fx.luJiJiaoChi.length
            ? fx.luJiJiaoChi.map((p) => t("ziwei.feixing.jiaochiLine", { a: z(p.luPalace), b: z(p.jiPalace) })).join(";")
            : t("ziwei.feixing.none")}
        </p>
        <h3 className="note"><b>{t("ziwei.feixing.self")}</b></h3>
        <p className="note">
          {fx.selfMutaged.length
            ? fx.selfMutaged.map((s) => `${z(s.palace)}${z(s.type)}${z(s.star)}`).join("、")
            : t("ziwei.feixing.none")}
        </p>
        <h3 className="note"><b>{t("ziwei.feixing.flies")}</b></h3>
        <ul className="note">
          {fx.flies.map((f) => (
            <li key={`${f.from}${f.type}`}>
              {t("ziwei.feixing.fly", { a: z(f.from), s: z(f.stem), t: z(f.type), star: z(f.star), b: z(f.intoPalace) })}
            </li>
          ))}
        </ul>
      </details>

      <h2 className="group-title">{t("ziwei.star.title")}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ZIWEI_STARS.map((s) => (
          <button
            key={s.name}
            type="button"
            className={`tag${star === s.name ? " accent" : ""}`}
            aria-pressed={star === s.name}
            onClick={() => setStar(star === s.name ? null : s.name)}
          >
            {z(s.name)}
          </button>
        ))}
      </div>
      {entry ? (
        <p className="note">
          <b>{z(entry.name)}</b> · {t("ziwei.star.wuxing")}{z(entry.wuxing)} · {t("ziwei.star.dou")}{z(entry.dou)}
          {entry.huaqi ? ` · ${t("ziwei.star.huaqi")}${z(entry.huaqi)}` : ""}
          <br />{t("ziwei.star.zhusi")}:{zT(entry.zhusi)}
          <br />{zT(entry.cite)}
        </p>
      ) : null}
    </>
  );
}
