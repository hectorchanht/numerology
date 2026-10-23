"use client";

import { useState } from "react";
import type { BirthInput } from "@numerology/engine";
import type { BirthFormValue, Calendar } from "@/lib/formTypes";
import { useLocale } from "@/lib/i18n";
import { LocationPicker } from "@/components/LocationPicker";
import { Icon } from "@/components/Icon";
import { Seg, ToggleRow } from "@/components/ui";

interface Props {
  loading: boolean;
  onSubmit: (input: BirthFormValue) => void;
  /** 预填值(测试期用) */
  defaults?: BirthInput | null;
}

/** 必填字段 */
const FIELDS = [
  { key: "year", labelKey: "form.year" as const, min: 1900, max: 2100, icon: "cal" },
  { key: "month", labelKey: "form.month" as const, min: 1, max: 12, icon: "cal" },
  { key: "day", labelKey: "form.day" as const, min: 1, max: 31, icon: "cal" },
  { key: "hour", labelKey: "form.hour" as const, min: 0, max: 23, icon: "clock" },
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
  // 真太陽時:開 = 有揀城市就帶經度校正;關 = 按時鐘時間(保留已揀城市)。
  const [trueSolar, setTrueSolar] = useState(true);
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
    if (trueSolar && longitude !== "") out.longitude = Number(longitude);
    onSubmit(out);
  };

  const yearLabel = calendar === "lunar" ? t("form.yearLunar") : t("form.yearSolar");
  const solarSub = !trueSolar ? t("form.trueSolarOff") : longitude === "" ? t("form.trueSolarNeedCity") : t("form.trueSolarOn");

  return (
    <form onSubmit={submit} noValidate>
      {/* .form-cols:手機 display:contents;平板兩組並排 */}
      <div className="form-cols">
        <div className="form-col">
          <h2 className="group-title">{t("form.groupTime")}</h2>
          <div className="list">
            <div className="row">
              <Icon name="cal" className="ic" />
              <span className="lbl">{t("form.calendar")}</span>
              <Seg
                compact
                label={t("form.calendar")}
                value={calendar}
                onChange={setCalendar}
                options={[
                  { value: "solar", label: t("form.solarShort") },
                  { value: "lunar", label: t("form.lunarShort") },
                ]}
              />
            </div>
            {calendar === "lunar" ? (
              <ToggleRow icon="cal" label={t("form.leap")} checked={isLeapMonth} onChange={setIsLeapMonth} />
            ) : null}
            {FIELDS.map((f) => (
              <label className="row" key={f.key} htmlFor={f.key}>
                <Icon name={f.icon} className="ic" />
                <span className="lbl">{f.key === "year" ? yearLabel : t(f.labelKey)}</span>
                <input
                  id={f.key} type="number" inputMode="numeric"
                  min={f.min} max={f.max}
                  value={v[f.key]}
                  onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="row" htmlFor="minute">
              <Icon name="clock" className="ic dim" />
              <span className="lbl">{t("form.minute")}</span>
              <input
                id="minute" type="number" inputMode="numeric" min={0} max={59}
                value={v.minute}
                onChange={(e) => setV((s) => ({ ...s, minute: e.target.value }))}
              />
            </label>
          </div>
        </div>

        <div className="form-col">
          <h2 className="group-title">{t("form.groupPerson")}</h2>
          <div className="list">
            <div className="row">
              <Icon name="user" className="ic" />
              <span className="lbl">{t("form.gender")}</span>
              <Seg
                compact
                label={t("form.gender")}
                value={gender}
                onChange={setGender}
                options={[
                  { value: "男", label: t("form.male") },
                  { value: "女", label: t("form.female") },
                ]}
              />
            </div>
            <LocationPicker value={longitude} onChange={setLongitude} />
            <ToggleRow icon="sun" label={t("form.trueSolar")} sub={solarSub} checked={trueSolar} onChange={setTrueSolar} />
          </div>
        </div>
      </div>

      {error ? <p className="notice" role="alert">{error}</p> : null}
      <button className="btn block cta" type="submit" disabled={loading}>
        <Icon name="spark" />
        {loading ? t("form.submitting") : t("form.submit")}
      </button>
      <p className="note">
        {calendar === "lunar" ? t("form.hintLunar") : t("form.hintSolar")} {t("form.privacy")}
      </p>
    </form>
  );
}
