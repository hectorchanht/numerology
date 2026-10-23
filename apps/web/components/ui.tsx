"use client";

import { useLocale } from "@/lib/i18n";
import { go } from "@/lib/nav";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";

/** iOS 風格分段控件(單選)。 */
export function Seg<T extends string>({
  value,
  options,
  onChange,
  compact,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  compact?: boolean;
  label?: string;
}) {
  return (
    <div className={`seg${compact ? " compact" : ""}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? "on" : ""}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 列表內的開關行(整行可撳)。 */
export function ToggleRow({
  icon,
  label,
  sub,
  checked,
  onChange,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" className="row" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <Icon name={icon} className="ic" />
      <span className="lbl">
        {label}
        {sub ? <span className="sub">{sub}</span> : null}
      </span>
      <span className={`toggle${checked ? " on" : ""}`} aria-hidden="true" />
    </button>
  );
}

/** 頂部導航列:左邊 logo(或返回鍵)+ eyebrow,右邊 icon 按鈕;最右 [主題][齒輪 = 設定]。 */
export function ScreenNav({
  eyebrow,
  onBack,
  children,
  gear = true,
}: {
  eyebrow?: React.ReactNode;
  onBack?: () => void;
  children?: React.ReactNode;
  gear?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="nav">
      {onBack ? (
        <button type="button" className="icon-btn lead" onClick={onBack} aria-label={t("nav.back")}>
          <Icon name="back" />
        </button>
      ) : (
        <>
          <img className="logo logo-dark" src="/logo.png" width={28} height={28} alt="" aria-hidden="true" />
          <img className="logo logo-light" src="/logo-light.png" width={28} height={28} alt="" aria-hidden="true" />
        </>
      )}
      <span className="eyebrow">{eyebrow}</span>
      <span className="nav-actions">
        {children}
        <ThemeToggle />
        {gear ? (
          <button type="button" className="icon-btn" onClick={() => go("settings")} aria-label={t("nav.settings")}>
            <Icon name="gear" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

/** 未有命盤時的佔位:引導返「起盤」,避免死胡同。 */
export function EmptyChart() {
  const { t } = useLocale();
  return (
    <div className="card empty">
      <Icon name="grid" />
      <div className="empty-t">{t("chart.empty")}</div>
      <p className="note">{t("chart.emptyHint")}</p>
      <button type="button" className="btn block" onClick={() => go("home")}>
        <Icon name="home" />
        {t("chart.goHome")}
      </button>
    </div>
  );
}
