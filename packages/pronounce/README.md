# @dawn-studio/pronounce

Tiny reusable **any-language** pronunciation button for any React project.

- **Zero-cost TTS** — browser Web Speech API, any BCP-47 language tag
  (`zh-HK`, `en-US`, `ja-JP`, `ko-KR`, `es-ES`…), on-device, no API key, no AI budget.
- **Every setting is yours** — languages list, labels, corner badge, theme color per language,
  rate / pitch / volume, explicit voice (`name`/`voiceURI`) or a custom `pickVoice` function,
  controlled or uncontrolled language selection. Nothing is hardcoded to Cantonese/Mandarin anymore.
- **Physics micro-interactions** — Framer Motion `whileTap` spring press, dual ripple rings while playing, `AnimatePresence` icon morph.
- **One 32px icon button** — left-click plays/stops, right-click / long-press opens a mini menu to switch language.
  A corner badge shows the current language (粵/普/EN/JA…).

## Install

```bash
npm install @dawn-studio/pronounce
# peer deps (your app provides these):
npm install react framer-motion
```

No Tailwind needed — all styling is inline, colors via CSS variables
(`--card`, `--card-2`, `--card-3`, `--sep`, `--label`, `--label-2`, `--fill`, `--pop-shadow`)
so it adapts to your theme (dark/light). Undefined vars fall back to browser defaults.

## Usage

```tsx
import { PronounceButton } from "@dawn-studio/pronounce";

// default: Cantonese + Mandarin (backwards compatible with 0.3.x)
<PronounceButton text="你好" locale="zht" />;

// any languages, fully configured
<PronounceButton
  text="Hello world"
  locale="en"
  mode="all"
  langs={["en-US", "ja-JP", "zh-HK"]}
  defaultLang="en-US"
  speechOptions={{ rate: 0.95, pitch: 1.1, voice: "Google US English" }}
  onLangChange={(lang) => console.log("switched to", lang)}
/>;
```

Props:

| prop             | type                                              | default              | notes                                                        |
| ---------------- | ------------------------------------------------- | -------------------- | ------------------------------------------------------------ |
| `text`           | `string`                                          | —                    | text to speak (required)                                     |
| `locale`         | `"zht" \| "zhs" \| "en"`                           | `"zht"`              | UI labels only (not the voice)                               |
| `mode`           | `"single" \| "all"`                               | `"single"`           | `"all"` splits long text into queued sentences               |
| `langs`          | `string[]`                                        | `["zh-HK","zh-CN"]`  | any BCP-47 tags; the switch menu lists exactly these         |
| `defaultLang`    | `string`                                          | `langs[0]`           | initial language                                             |
| `controlledLang` | `string`                                          | —                    | fully parent-controlled language (with `onLangChange`)        |
| `onLangChange`   | `(lang: string) => void`                           | —                    | fires when the user picks a language from the menu           |
| `langNames`      | `{ [tag]: { zht, zhs, en } }`                      | built-in 18 langs    | override/add display names per UI locale                     |
| `langBadges`     | `{ [tag]: string }`                               | 粵/普, else `EN`…    | corner badge text per language                               |
| `langColors`     | `{ [tag]: string }`                               | blue/green, else blue| theme color per language (button, ripples, menu highlight)   |
| `speechOptions`  | `UseSpeechOptions`                                | —                    | `rate`, `pitch`, `volume`, `voice` (name/voiceURI), `pickVoice` |
| `reading`        | `string`                                          | —                    | pronunciation label (pinyin/jyutping/romaji…) shown above the button; caller supplies the correct reading for the active language |

## Drive speech yourself

```tsx
import { useSpeech, useVoices, resolveVoice } from "@dawn-studio/pronounce";

const { speak, speakAll, stop, isPlaying, currentLang, voices } = useSpeech({
  rate: 1.0,
  voice: "Samantha",                 // exact SpeechSynthesisVoice.name or voiceURI
  // or fully custom selection:
  // pickVoice: (voices, lang) => voices.find(v => v.lang.startsWith("en")),
});

speak("正官", "zh-HK");   // Cantonese
speak("hello", "en-US");  // any language tag
speakAll(longText, "ja-JP");
stop();

// build your own settings panel:
const voices = useVoices(); // reactive list, updates on voiceschanged
const v = resolveVoice(voices, "zh-HK", "Google 粵語（香港）");
```

`SpeechLang` is just `string` — pass any BCP-47 tag. Voice selection order:
custom `pickVoice` → explicit `voice` name/URI → exact lang match → base-language match
→ browser default for the utterance lang.
Chinese variants never cross-fallback: `zh-CN`/`zh-TW` (Mandarin) and `zh-HK`/`yue-HK`
(Cantonese) only match within their own group — a missing Mandarin voice will NOT
silently speak Cantonese, it falls through to the browser default.

Helpers: `getLangLabel(tag, locale, custom?)`, `getLangBadge(tag, custom?)`,
`getLangColor(tag, custom?)`, `normalizeLangTag(tag)`,
`splitSpeechSentences(text, maxLen?)`, `speechText(markdown)` (strip formatting before speaking).

## Notes

- SSR-safe: every `window.speechSynthesis` access is behind a runtime guard; the button renders `null` when unsupported.
- Rapid clicks cancel the previous utterance first, so it stays responsive.
- Touch: 550ms long-press opens the language menu (non-passive listener, suppresses the native callout/menu).

## License

MIT — Dawn Studio.
