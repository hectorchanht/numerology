# @dawn-studio/pronounce

Tiny reusable Cantonese / Mandarin pronunciation button for any React project.

- **Zero-cost TTS** — browser Web Speech API (`zh-HK` / `zh-CN`), on-device, no API key, no AI budget.
- **Physics micro-interactions** — Framer Motion `whileTap` spring press, dual ripple rings while playing, `AnimatePresence` icon morph.
- **One 32px icon button** — left-click plays/stops (Cantonese by default), right-click / long-press opens a mini menu to switch to Mandarin. A 粵/普 corner badge shows the current language.

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

<PronounceButton text="你好" locale="zht" />;
```

Props:

| prop     | type                    | default | notes                                              |
| -------- | ----------------------- | ------- | -------------------------------------------------- |
| `text`   | `string`                | —       | text to speak (required)                           |
| `locale` | `"zht" \| "zhs" \| "en"` | `"zht"` | UI labels only (廣東話/普通話, etc.), not the voice |

Or drive speech yourself with the core hook:

```tsx
import { useSpeech } from "@dawn-studio/pronounce";

const { speak, stop, isPlaying, currentLang } = useSpeech({ rate: 1.0 });
speak("正官", "zh-HK"); // Cantonese
speak("正官", "zh-CN"); // Mandarin
stop();
```

## Notes

- SSR-safe: every `window.speechSynthesis` access is behind a runtime guard; renders `null` when unsupported.
- Rapid clicks cancel the previous utterance first, so it stays responsive.
- Voice selection: picks the system voice whose `lang` best matches `zh-HK` / `zh-CN`; falls back to the browser default for the utterance lang.
- Touch: 550ms long-press opens the language menu (non-passive listener, suppresses the native callout/menu).

## License

MIT — Dawn Studio.
