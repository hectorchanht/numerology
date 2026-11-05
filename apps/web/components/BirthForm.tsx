"use client";

import { useId, useState } from "react";
import type { BirthInput } from "@numerology/engine";
import type { BirthFormValue, Calendar } from "@/lib/formTypes";
import { useLocale } from "@/lib/i18n";
import { LocationPicker } from "@/components/LocationPicker";
import { Icon } from "@/components/Icon";
import { Seg, ToggleRow } from "@/components/ui";

interface Props {
  loading: boolean;
  onSubmit: (input: BirthFormValue) => void;
  /** 預填值(測試期用) */
  defaults?: BirthInput | null;
}

/** 必填字段 */
const FIELDS = [
  { key: "year", labelKey: "form.year" as const, min: 1900, max: 2100, icon: "cal" },
  { key: "month", labelKey: "form.month" as const, min: 1, max: 12, icon: "cal" },
  { key: "day", labelKey: "form.day" as const, min: 1, max: 31, icon: "cal" },
  { key: "hour", labelKey: "form.hour" as const, min: 0, max: 23, icon: "clock" },
] as const;

/** 十二地支:時辰標示用(23 點起子時)。 */
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";

export function BirthForm({ loading, onSubmit, defaults }: Props) {
  const { t } = useLocale();
  /** 同頁可能有兩份表(合盤):所有 id 加 useId 前綴,免撞。 */
  const uid = useId();
  const idOf = (field: string) => `${uid}-${field}`;
  const errId = `${uid}-birth-err`;
  const str = (n: number | undefined): string => (n === undefined ? "" : String(n));
  const [v, setV] = useState<Record<string, string>>({
    year: str(defaults?.year), month: str(defaults?.month), day: str(defaults?.day),
    hour: str(defaults?.hour), minute: str(defaults?.minute),
  });
  // 性別唔預設:佢決定大運順逆,要用戶自己揀。
  const [gender, setGender] = useState<"男" | "女" | "">(defaults?.gender ?? "");
  const [name, setName] = useState("");
  const [calendar, setCalendar] = useState<Calendar>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [longitude, setLongitude] = useState<string>(
    defaults?.longitude !== undefined ? String(defaults.longitude) : "",
  );
  const [latitude, setLatitude] = useState<string>(str(defaults?.latitude));
  // 真太陽時:開 = 有揀城市就帶經度校正;關 = 按時鐘時間(保留已揀城市)。
  const [trueSolar, setTrueSolar] = useState(true);
  const [error, setError] = useState<string>("");
  /** 出錯嘅欄位 id:標 aria-invalid 並移焦點過去。 */
  const [errField, setErrField] = useState<string>("");

  const fail = (field: string, msg: string) => {
    setError(msg);
    setErrField(field);
    const el = document.getElementById(idOf(field));
    (el?.querySelector("button") ?? el)?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrField("");
    const nums: Record<string, number> = {};
    for (const f of FIELDS) {
      const n = Number(v[f.key]);
      if (v[f.key] === "" || !Number.isInteger(n) || n < f.min || n > f.max) {
        fail(f.key, t("form.invalidField", { label: t(f.labelKey) }));
        return;
      }
      nums[f.key] = n;
    }
    // 日數按月份檢查:陽曆用真實月長(閏年 2 月 29),農曆月最多 30 日(閏月等細節交服務端)。
    const maxDay = calendar === "solar" ? new Date(nums.year!, nums.month!, 0).getDate() : 30;
    if (nums.day! > maxDay) {
      fail("day", t("form.dayInvalid", { max: maxDay }));
      return;
    }
    let minute = 0;
    if (v.minute !== "") {
      const m = Number(v.minute);
      if (!Number.isInteger(m) || m < 0 || m > 59) {
        fail("minute", t("form.minuteHint"));
        return;
      }
      minute = m;
    }
    if (!gender) {
      fail("gender", t("form.genderRequired"));
      return;
    }
    const out: BirthFormValue = {
      year: nums.year!, month: nums.month!, day: nums.day!,
      hour: nums.hour!, minute, gender,
      calendar,
      ...(calendar === "lunar" && isLeapMonth ? { isLeapMonth: true } : {}),
      ...(name.trim() ? { name: name.trim() } : {}),
    };
    if (trueSolar && longitude !== "") out.longitude = Number(longitude);
    if (latitude !== "") {
      const lat = Number(latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        fail("latitude", t("form.invalidField", { label: t("form.latitude") }));
        return;
      }
      out.latitude = lat;
    }
    onSubmit(out);
  };

  const yearLabel = calendar === "lunar" ? t("form.yearLunar") : t("form.yearSolar");
  const hourN = Number(v.hour);
  const hourSub =
    v.hour !== "" && Number.isInteger(hourN) && hourN >= 0 && hourN <= 23
      ? t("form.hourBranch", { b: BRANCHES[Math.floor((hourN + 1) / 2) % 12]! })
      : "";
  const invalid = (id: string) =>
    errField === id ? { "aria-invalid": true as const, "aria-describedby": errId } : {};
  /** 改返出錯嗰格:清走錯誤(下次提交再驗)。 */
  const clearErr = (key: string) => {
    if (errField === key) { setErrField(""); setError(""); }
  };
  const edit = (key: string, val: string) => {
    setV((s) => ({ ...s, [key]: val }));
    clearErr(key);
  };
  /** 錯誤顯示喺出錯嗰行入面,手機彈鍵盤都睇到。 */
  const errSub = (id: string) =>
    errField === id ? <span className="sub err" id={errId} role="alert">{error}</span> : null;
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
              <label className="row" key={f.key} htmlFor={idOf(f.key)}>
                <Icon name={f.icon} className="ic" />
                <span className="lbl">
                  {f.key === "year" ? yearLabel : t(f.labelKey)}
                  {f.key === "hour" && hourSub ? <span className="sub">{hourSub}</span> : null}
                  {errSub(f.key)}
                </span>
                <input
                  id={idOf(f.key)} type="number" inputMode="numeric"
                  min={f.min} max={f.max}
                  value={v[f.key]}
                  onChange={(e) => edit(f.key, e.target.value)}
                  {...invalid(f.key)}
                />
              </label>
            ))}
            <label className="row" htmlFor={idOf("minute")}>
              <Icon name="clock" className="ic dim" />
              <span className="lbl">{t("form.minute")}{errSub("minute")}</span>
              <input
                id={idOf("minute")} type="number" inputMode="numeric" min={0} max={59}
                value={v.minute}
                onChange={(e) => edit("minute", e.target.value)}
                {...invalid("minute")}
              />
            </label>
          </div>
        </div>

        <div className="form-col">
          <h2 className="group-title">{t("form.groupPerson")}</h2>
          <div className="list">
            <label className="row" htmlFor={idOf("chart-name")}>
              <Icon name="user" className="ic" />
              <span className="lbl">{t("form.name")}</span>
              <input
                id={idOf("chart-name")} type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("form.namePh")}
                maxLength={20}
              />
            </label>
            <div className="row" id={idOf("gender")}>
              <Icon name="user" className="ic" />
              <span className="lbl">{t("form.gender")}{errSub("gender")}</span>
              <Seg
                compact
                label={t("form.gender")}
                value={gender}
                onChange={(g) => { setGender(g); clearErr("gender"); }}
                options={[
                  { value: "男", label: t("form.male") },
                  { value: "女", label: t("form.female") },
                ]}
              />
            </div>
            <LocationPicker value={longitude} onChange={(lon, lat) => { setLongitude(lon); if (lat !== undefined) { setLatitude(lat); clearErr("latitude"); } }} />
            <ToggleRow icon="sun" label={t("form.trueSolar")} sub={solarSub} checked={trueSolar} onChange={setTrueSolar} />
            <label className="row" htmlFor={idOf("latitude")}>
              <Icon name="pin" className="ic dim" />
              <span className="lbl">
                {t("form.latitude")}
                <span className="sub">{t("form.latitudeSub")}</span>
                {errSub("latitude")}
              </span>
              <input
                id={idOf("latitude")} type="number" inputMode="decimal" min={-90} max={90} step={0.01}
                value={latitude}
                onChange={(e) => { setLatitude(e.target.value); clearErr("latitude"); }}
                {...invalid("latitude")}
              />
            </label>
          </div>
        </div>
      </div>

      {error && !errField ? <p className="notice" role="alert">{error}</p> : null}
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
