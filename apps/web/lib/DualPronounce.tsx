"use client";

import { PronounceButton } from "@dawn-studio/pronounce";
import { fixYijingSpeech } from "./speechText.js";

/** 並排顯示粵語 + 普通話兩個發音掣(唔使長按切換);易經多音字先糾音。
 * 傳 readings 可在每粒掣上方顯示對應讀音(粵拼/拼音)。 */
export function DualPronounce({
  text,
  locale,
  mode = "single",
  readings,
}: {
  text: string;
  locale: "zht" | "zhs" | "en";
  mode?: "single" | "all";
  readings?: { "zh-HK"?: string; "zh-CN"?: string };
}) {
  return (
    <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "flex-start" }}>
      <PronounceButton
        text={fixYijingSpeech(text, "zh-HK")}
        locale={locale}
        mode={mode}
        langs={["zh-HK"]}
        defaultLang="zh-HK"
        reading={readings?.["zh-HK"]}
      />
      <PronounceButton
        text={fixYijingSpeech(text, "zh-CN")}
        locale={locale}
        mode={mode}
        langs={["zh-CN"]}
        defaultLang="zh-CN"
        reading={readings?.["zh-CN"]}
      />
    </span>
  );
}
