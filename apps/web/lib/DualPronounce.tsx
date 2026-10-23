"use client";

import { PronounceButton } from "@dawn-studio/pronounce";
import { fixYijingSpeech } from "./speechText.js";

/** 並排顯示粵語 + 普通話兩個發音掣(唔使長按切換);易經多音字先糾音。 */
export function DualPronounce({
  text,
  locale,
  mode = "single",
}: {
  text: string;
  locale: "zht" | "zhs" | "en";
  mode?: "single" | "all";
}) {
  return (
    <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
      <PronounceButton
        text={fixYijingSpeech(text, "zh-HK")}
        locale={locale}
        mode={mode}
        langs={["zh-HK"]}
        defaultLang="zh-HK"
      />
      <PronounceButton
        text={fixYijingSpeech(text, "zh-CN")}
        locale={locale}
        mode={mode}
        langs={["zh-CN"]}
        defaultLang="zh-CN"
      />
    </span>
  );
}
