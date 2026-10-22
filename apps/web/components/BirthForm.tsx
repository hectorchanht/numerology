"use client";

import { useState } from "react";
import type { BirthInput } from "@numerology/engine";
import type { BirthFormValue, Calendar } from "@/lib/formTypes";
import { useLocale } from "@/lib/i18n";
import { LocationPicker } from "@/components/LocationPicker";

interface Props {
  loading: boolean;
  onSubmit: (input: BirthFormValue) => void;
  /** 预填值(测试期用) */
  defaults?: BirthInput | null;
}

/** 必填字段 */
const FIELDS = [
  { key: "year", labelKey: "form.year" as const, min: 1900, max: 2100 },
  { key: "month", labelKey: "form.month" as const, min: 1, max: 12 },
  { key: "day", labelKey: "form.day" as const, min: 1, max: 31 },
  { key: "hour", labelKey: "form.hour" as const, min: 0, max: 23 },
] as const;

export function BirthForm({ loading, onSubmit, defaults }: Props) {
  const { t } = useLocale();
  const str = (n: number | undefined): string => (n === undefined ? "" : String(n));
  const [v, setV] = useState<Record<string, string>>({
    year: str(defaults?.year), month: str(defaults?.month), day: str(defaults?.day),
    hour: str(defaults?.hour), minute: str(defaults?.minute),
  });
  const [gender, setGender] = useState<"男" | "女">(defaults?.gender ?? "男");
  const [calendar, setCalendar] = useState<Calendar>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [longitude, setLongitude] = useState<string>(
    defaults?.longitude !== undefined ? String(defaults.longitude) : "",
  );
  const [error, setError] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const nums: Record<string, number> = {};
    for (const f of FIELDS) {
      const n = Number(v[f.key]);
      if (v[f.key] === "" || !Number.isInteger(n) || n < f.min || n > f.max) {
        setError(t("form.invalidField", { label: t(f.labelKey) }));
        return;
      }
      nums[f.key] = n;
    }
    let minute = 0;
    if (v.minute !== "") {
      const m = Number(v.minute);
      if (!Number.isInteger(m) || m < 0 || m > 59) {
        setError(t("form.minuteHint"));
        return;
      }
      minute = m;
    }
    const out: BirthFormValue = {
      year: nums.year!, month: nums.month!, day: nums.day!,
      hour: nums.hour!, minute, gender,
      calendar,
      ...(calendar === "lunar" && isLeapMonth ? { isLeapMonth: true } : {}),
    };
    if (longitude !== "") out.longitude = Number(longitude);
    onSubmit(out);
  };

  const yearLabel = calendar === "lunar" ? t("form.yearLunar") : t("form.yearSolar");

  return (
    <form className="card" onSubmit={submit}>
      <h2 className="section-title">{t("form.title")}</h2>
      <div className="cal-toggle">
        <button type="button" className={calendar === "solar" ? "active" : ""} onClick={() => setCalendar("solar")}>{t("form.solar")}</button>
        <button type="button" className={calendar === "lunar" ? "active" : ""} onClick={() => setCalendar("lunar")}>{t("form.lunar")}</button>
        {calendar === "lunar" ? (
          <label className="leap-check">
            <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} />
            {t("form.leap")}
          </label>
        ) : null}
      </div>
      <div className="form-grid">
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={f.key}>{f.key === "year" ? yearLabel : t(f.labelKey)}</label>
            <input
              id={f.key} type="number" inputMode="numeric"
              min={f.key === "year" ? f.min : undefined} max={f.key === "year" ? f.max : undefined}
              value={v[f.key]}
              onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="field">
          <label htmlFor="minute">{t("form.minute")}</label>
          <input
            id="minute" type="number" inputMode="numeric" min={0} max={59}
            value={v.minute}
            onChange={(e) => setV((s) => ({ ...s, minute: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="gender">{t("form.gender")}</label>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as "男" | "女")}>
            <option value="男">{t("form.male")}</option>
            <option value="女">{t("form.female")}</option>
          </select>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>{t("form.birthplace")}</label>
          <LocationPicker value={longitude} onChange={setLongitude} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.1rem" }}>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? t("form.submitting") : t("form.submit")}
        </button>
        {error ? <span className="notice">{error}</span> : (
          <span className="muted">
            {calendar === "lunar" ? t("form.hintLunar") : t("form.hintSolar")}
          </span>
        )}
      </div>
    </form>
  );
}
