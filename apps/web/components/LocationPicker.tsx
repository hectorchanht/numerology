"use client";

import { useState } from "react";
import { REGIONS, locName } from "@/lib/locations";
import { useLocale } from "@/lib/i18n";
import { Icon } from "@/components/Icon";

interface Props {
  /** 當前選中的經度(字符串;"" 表示不指定) */
  value: string;
  /** 揀城市時連緯度一齊帶出(行星時用);手動輸入經度時 latitude 為 undefined。 */
  onChange: (longitude: string, latitude?: string) => void;
}

/** 手動輸入經度:唔喺城市表入面嘅出生地用呢個兜底,全球通用。 */
const MANUAL = "__manual";

/** 地區(中國省 / 世界國家,按大洲分組) → 城市 二級選擇,另可手動輸入經度。 */
export function LocationPicker({ value, onChange }: Props) {
  const { t, locale } = useLocale();
  /** 地名跟 UI locale:預轉好嘅數據直接揀,唔經 runtime 轉換 */
  const L = (name: string, nameHant: string) => locName(locale, name, nameHant);
  const [regionIdx, setRegionIdx] = useState("");
  // 按城市名揀:同區有經度相同嘅城市(如邯鄲、邢台),用經度做 value 會揀錯。
  const [cityName, setCityName] = useState("");
  const region =
    regionIdx !== "" && regionIdx !== MANUAL ? (REGIONS[Number(regionIdx)] ?? null) : null;
  const groups: string[] = [];
  for (const r of REGIONS) if (!groups.includes(r.group)) groups.push(r.group);

  return (
    <>
      <label className="row">
        <Icon name="pin" className="ic" />
        <span className="lbl">{t("loc.regionAria")}</span>
        <select
          aria-label={t("loc.regionAria")}
          value={regionIdx}
          onChange={(e) => { setRegionIdx(e.target.value); setCityName(""); onChange(""); }}
        >
          <option value="">{t("loc.noRegion")}</option>
          <option value={MANUAL}>{t("loc.manualEntry")}</option>
          {groups.map((g) => {
            const gr = REGIONS.find((r) => r.group === g)!;
            return (
              <optgroup key={g} label={L(gr.group, gr.groupHant)}>
                {REGIONS.map((r, i) =>
                  r.group === g ? (
                    <option key={r.name} value={String(i)}>{L(r.name, r.nameHant)}</option>
                  ) : null,
                )}
              </optgroup>
            );
          })}
        </select>
      </label>
      {regionIdx === MANUAL ? (
        <label className="row">
          <Icon name="pin" className="ic dim" />
          <span className="lbl">{t("loc.longitudeAria")}</span>
          <input
            type="number"
            aria-label={t("loc.longitudeAria")}
            value={value}
            min={-180}
            max={180}
            step={0.01}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      ) : (
        <label className="row">
          <Icon name="pin" className="ic dim" />
          <span className="lbl">{t("loc.cityAria")}</span>
          <select
            aria-label={t("loc.cityAria")}
            value={value === "" ? "" : cityName}
            onChange={(e) => {
              const c = region?.cities.find((x) => x.name === e.target.value);
              setCityName(c?.name ?? "");
              if (c) onChange(String(c.longitude), String(c.latitude));
              else onChange("");
            }}
            disabled={!region}
          >
            <option value="">{region ? t("loc.pickCity") : "—"}</option>
            {(region?.cities ?? []).map((c) => (
              <option key={c.name} value={c.name}>{L(c.name, c.nameHant)}</option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
