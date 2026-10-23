"use client";

import { useState } from "react";
import { REGIONS } from "@/lib/locations";
import { useLocale, useScript } from "@/lib/i18n";
import { Icon } from "@/components/Icon";

interface Props {
  /** 当前选中的经度(字符串;"" 表示不指定) */
  value: string;
  onChange: (longitude: string) => void;
}

/** 手動輸入經度:唔喺城市表入面嘅出生地用呢個兜底,全球通用。 */
const MANUAL = "__manual";

/** 地區(中國省 / 世界國家,按大洲分組) → 城市 二級選擇,另可手動輸入經度。 */
export function LocationPicker({ value, onChange }: Props) {
  const { t } = useLocale();
  const { z } = useScript();
  const [regionIdx, setRegionIdx] = useState("");
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
          onChange={(e) => { setRegionIdx(e.target.value); onChange(""); }}
        >
          <option value="">{t("loc.noRegion")}</option>
          <option value={MANUAL}>{t("loc.manualEntry")}</option>
          {groups.map((g) => (
            <optgroup key={g} label={z(g)}>
              {REGIONS.map((r, i) =>
                r.group === g ? (
                  <option key={r.name} value={String(i)}>{z(r.name)}</option>
                ) : null,
              )}
            </optgroup>
          ))}
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={!region}
          >
            <option value="">{region ? t("loc.pickCity") : "—"}</option>
            {(region?.cities ?? []).map((c) => (
              <option key={c.name} value={c.longitude}>{z(c.name)}</option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
