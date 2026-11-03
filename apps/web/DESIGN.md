---
name: 洛書命理 · 八字紫微合參
description: Near-monochrome ink with a single lamplight-amber accent; Apple-native, mobile-first.
colors:
  lamplight-amber: "#e3a857"
  lamplight-amber-soft: "rgba(227, 168, 87, 0.16)"
  lamplight-amber-line: "rgba(227, 168, 87, 0.45)"
  on-amber: "#1a1206"
  ink-black: "#000000"
  ink-card: "#1c1c1e"
  ink-card-2: "#2c2c2e"
  ink-card-3: "#3a3a3c"
  ink-fill: "rgba(118, 118, 128, 0.24)"
  ink-separator: "rgba(84, 84, 88, 0.6)"
  label: "#ffffff"
  label-2: "rgba(235, 235, 245, 0.6)"
  label-3: "rgba(235, 235, 245, 0.38)"
  body-text: "rgba(255, 255, 255, 0.88)"
  paper-white: "#ffffff"
  paper-card: "#f2f2f7"
  paper-card-2: "#e5e5ea"
  paper-label: "#1c1c1e"
  signal-green: "#30d158"
  warn-coral: "#ff8a80"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang HK, PingFang TC, PingFang SC, Helvetica Neue, Noto Sans TC, Microsoft JhengHei, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.01em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang HK, PingFang TC, PingFang SC, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang HK, PingFang TC, PingFang SC, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang HK, PingFang TC, PingFang SC, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  prose:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang HK, PingFang TC, PingFang SC, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang HK, PingFang TC, PingFang SC, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  sheet: "18px"
  pill: "999px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "28px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.lamplight-amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "50px"
  button-secondary:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.lamplight-amber}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "50px"
  button-small:
    backgroundColor: "{colors.lamplight-amber}"
    textColor: "{colors.on-amber}"
    rounded: "11px"
    padding: "0 14px"
    height: "38px"
  card:
    backgroundColor: "{colors.ink-card}"
    rounded: "{rounded.lg}"
    padding: "18px"
  list-row:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.label}"
    padding: "10px 16px"
    height: "52px"
  chip:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.label-2}"
    rounded: "22px"
    padding: "0 16px"
    height: "44px"
  chip-on:
    backgroundColor: "{colors.label}"
    textColor: "{colors.ink-black}"
    rounded: "22px"
    padding: "0 16px"
    height: "44px"
  tag:
    backgroundColor: "{colors.ink-fill}"
    textColor: "{colors.label-2}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  tag-accent:
    backgroundColor: "{colors.lamplight-amber-soft}"
    textColor: "{colors.lamplight-amber}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  input-in-row:
    backgroundColor: "{colors.ink-fill}"
    textColor: "{colors.label}"
    rounded: "{rounded.sm}"
    padding: "7px 10px"
    height: "36px"
  segmented:
    backgroundColor: "{colors.ink-fill}"
    rounded: "{rounded.md}"
    padding: "2px"
  segmented-on:
    backgroundColor: "#636366"
    textColor: "{colors.label}"
    rounded: "{rounded.sm}"
    height: "40px"
  tldr-card:
    backgroundColor: "{colors.lamplight-amber-soft}"
    textColor: "{colors.label}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
---

# Design System: 洛書命理

## Overview

**Creative North Star: "Gold Leaf on Ink"（墨中一點金）**

The interface is ink: true black ground, three steps of charcoal card, and labels that fall back through white, 60% and 38% opacity. Against it there is exactly one warm colour, a lamplight amber, applied the way gold leaf is applied to a scroll — only on the stroke that matters most. The day pillar of a 八字 chart, the 命宮 of a 紫微 board, the active tab, the primary action, the one-line conclusion of a report section. Everything else stays in grey so the gold keeps its meaning.

Structurally it is an Apple-native app, not a mystic poster. System fonts, grouped lists, 44px touch targets, segmented controls, frosted sticky bars, an iOS toggle, a bottom tab bar on phones and a translucent sidebar on desktop. Familiarity is deliberate: the charts are dense and technical, so the chrome stays recognisable and quiet, and the cultural character lives in the content (干支, 星曜, 卦) and in the restraint of the single accent. Components feel native and restrained — no ornament, no decorative gradients, no custom fonts or CDN.

Density is mobile-first and medium: a 390–430px single column with a 20px gutter, cards separated by 12px, content that reads conclusion-first with evidence folded underneath.

**Key Characteristics:**
- Near-monochrome dark ground; light theme mirrors Apple system light.
- One accent colour, identical in both themes.
- Depth by tonal layering and inset rings, not shadows.
- iOS-native controls and grouped-list rhythm.
- System font stack; tabular numerals for years and counts.
- Conclusion first (TL;DR card), evidence collapsed below.

## Colors

Ink greys carry all structure; lamplight amber is the only voice.

### Primary
- **Lamplight Amber**（燈火金）(#e3a857): the single accent. Primary buttons, links, icons in rows, active tab and chip-adjacent states, focus rings, the day pillar and 命宮 highlight, progress fill, section-heading h3 in prose, TL;DR label. Same value in dark and light themes.
- **Amber Wash** (rgba(227,168,87,0.16); 0.2 in light): tinted grounds — TL;DR card, accent tags, step-number discs, model pill.
- **Amber Line** (rgba(227,168,87,0.45); 0.6 in light): secondary rings — opposite/trine palaces, accent stat cards, the middle tier of the three-level significance meter.
- **Amber Ink** (#1a1206): text on solid amber.

### Neutral
- **Ink Black** (#000000): page ground (dark). Desktop wide-screen ground is #0a0a0a.
- **Ink Card / Card 2 / Card 3** (#1c1c1e / #2c2c2e / #3a3a3c): three tonal layers — card, pressed or nested surface, highlighted surface.
- **Ink Fill** (rgba(118,118,128,0.24)): input grounds, segmented track, neutral tags, chart tracks.
- **Separator** (rgba(84,84,88,0.6)): 0.5px hairlines between rows and table lines.
- **Label / Label 2 / Label 3** (#fff / 60% / 38%): primary, secondary, tertiary text. Body prose uses 88% white.
- **Paper White / Paper Card / Paper Card 2 / Paper Label** (#fff / #f2f2f7 / #e5e5ea / #1c1c1e): the light theme counterparts, following Apple system light.

### Status
- **Signal Green** (#30d158; #34c759 light): toggle on, "ok" pill only.
- **Warn Coral** (#ff8a80): warning pill only.

### Named Rules
**The One Gold Rule.** Lamplight amber is the only hue in the chrome. If two things on a screen are amber, ask which one is the real point; status green and coral are reserved for status pills and the toggle, never decoration.

**The Grey Does the Work Rule.** Hierarchy comes from the label ladder (100 / 60 / 38%) and the card ladder, not from new colours. Charts encode tiers with amber-to-grey steps plus height or count, never colour alone.

## Typography

**Display Font:** system UI (-apple-system / SF Pro Text, with PingFang HK → TC → SC, Noto Sans TC, Microsoft JhengHei; under `:lang(zh-Hans)` the stack leads with PingFang SC, Noto Sans SC, Microsoft YaHei)
**Body Font:** same stack
**Label/Mono Font:** same stack; `font-variant-numeric: tabular-nums` for years, ages and counts

**Character:** One native family at several weights — the type disappears into the platform so 干支 glyphs and numbers read cleanly. No web fonts are loaded.

### Hierarchy
- **Display** (700, 34px → 40px desktop, 1.15): page title (`h1.large`).
- **Headline** (500, 30px, 1.2, 0.02em): 干支 glyphs in the four-pillar cards; 24px in the detailed chart table.
- **Title** (600, 19px, 1.3): report section titles, stat values. 17px/600 for card titles and names.
- **Body** (400, 17px, 1.45): base UI text. Rows, lede and links run at 15px.
- **Prose** (400, 16px, 1.65, 88% white): streamed AI interpretation. h1/h2 at 17px in label colour, h3/h4 at 16px in amber.
- **Label** (400, 13px, 0.04em, uppercase): group titles above lists. Meta at 12–13px in label-2; chart micro-labels at 9–11px.

### Named Rules
**The Weight Not Size Rule.** Inside a card, emphasis moves by weight (400 → 600) and label opacity before it moves by size. The scale has few steps on purpose.

## Layout

- **Phone (<768px):** single column, max 430px, centred; gutter `--pad` 20px; bottom tab bar 56px plus safe area; content padded to clear it. From 600px the column gets hairline side borders on a #f2f2f7 / #0a0a0a desk ground.
- **Tablet (768–1023px):** column widens to 720px, gutter 28px; tab bar stays; forms split into two columns.
- **Desktop (≥1024px):** 240px translucent left sidebar replaces the tab bar; content max 1200px (narrow pages 760px), gutter 32px; report becomes a 200px sticky table of contents + content (max 820px); history and 易經 pages split into two columns. ≥1280px adds a 320px right rail on the chart page.
- Wrappers (`.split`, `.form-cols`, `.report-body`) use `display: contents` on phones so the mobile layout is untouched; grid only switches on at larger breakpoints.
- Rhythm: 12px between sibling cards, 28px before a group title, 8px inside grids; card padding 18px, row padding 10px 16px.

**The Phone Is Canon Rule.** The 390–430px mobile layout and its bottom tab bar are the reference; larger breakpoints add columns, they never redesign the phone.

## Elevation & Depth

Flat by default. Depth comes from tonal steps (card → card-2 → card-3) and from **inset rings** that mark selection without lifting anything: 1px amber on the day pillar, 1.5px amber on the selected palace or current year, 1px amber-line on related palaces. Real shadows exist only where the platform uses them.

### Shadow Vocabulary
- **Segment thumb** (`0 2px 6px rgba(0,0,0,0.3)`; 0.12 light): the selected segment of a segmented control.
- **Toggle knob** (`0 2px 4px rgba(0,0,0,0.2)`): iOS switch thumb.
- **Popover** (`0 8px 24px rgba(0,0,0,0.5)`; 0.14 light): floating pickers and the selection toolbar.
- **Frosted bars** (`backdrop-filter: saturate(180%) blur(20px)` over 82–86% grounds): sticky strips, tab bar, sidebar.

**The Ring Not Lift Rule.** To highlight a chart cell or card, draw an inset ring in amber or amber-line; do not add a drop shadow.

## Shapes

Continuous, gently rounded corners on a short scale: 14px for cards, lists and primary buttons; 10px for palaces, segmented tracks and the base `--r`; 8px for inputs, segments and picker rows; 4px for code and micro badges; 18px for the top of the mobile sheet; fully round for chips (22px), tags and pills, avatars and icon buttons. Borders are rare — 0.5px hairline separators between rows and around bars; 1px borders only on pills, the 更多 sheet tiles, and accent-highlighted cards.

## Components

### Buttons
- **Shape:** 14px radius, 50px tall (52px for the main CTA), full-width `block` variant on phones.
- **Primary:** solid lamplight amber, amber-ink text, 17px/600.
- **Secondary / Ghost:** ink-card ground, amber text.
- **Small:** 38px, 11px radius, 13.5px — used for retry inside a failed report section.
- **Text button / Icon button:** amber text or icon, 44px hit area; icon buttons are 44px circles that fill with ink-fill on press.
- **States:** press = 0.8 opacity; disabled = 0.45 opacity; focus = 2px amber outline, 2px offset.

### Chips (filter / section strip)
- **Style:** 44px pills on ink-card, label-2 text, in a horizontally scrolling strip that never wraps.
- **State:** selected inverts to white ground with black text (600). A pulsing 6px amber dot marks a section still streaming.

### Tags and Pills
- **Tag:** 12px, pill, ink-fill / label-2; accent variant uses amber wash / amber.
- **AI status pills:** 12px, 1px border; model pill in amber, ok in green, warn in coral; they are buttons that open a floating picker.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** ink-card; nested or pressed surfaces step to card-2.
- **Shadow Strategy:** none (see Elevation).
- **Internal Padding:** 18px; empty-state cards centre an icon, title and button at 28px padding.

### Grouped Lists and Rows
- iOS grouped list: rows of 52px min height, 12px gap, inset 0.5px separators starting at 50px (16px for plain rows), amber leading icon, label-2 value, label-3 chevron; press darkens to card-2.

### Inputs / Fields
- **Style:** blended into rows — ink-fill ground, no border, 8px radius, 36px, 16px text (prevents iOS zoom).
- **Focus:** 2px amber outline, 0 offset.
- **Segmented control:** ink-fill track (10px radius, 2px padding), selected segment raised with the segment-thumb shadow.
- **Toggle:** 51×31 iOS switch, green when on.

### Navigation
- **Phone/tablet:** fixed frosted tab bar, 24px icons over 10px labels; idle in 45% label, active in amber. A 更多 bottom sheet (18px top radius) lists all tools in a two-column grid.
- **Desktop:** fixed 240px frosted sidebar with brand lockup (logo, 17px/700 title, 11px subtitle); hover fills with ink-fill.
- **Top nav:** 44px row with 13px label-2 eyebrow and amber icon actions.

### Report Section (signature)
A collapsible card per AI section: amber icon, 19px title, small streaming state with a grey shimmer, then a **TL;DR card** (amber wash inside a 1px amber-line inset ring, 600 weight conclusion), followed by verdict/analysis blocks and a collapsed evidence fold. While streaming, a 2px amber caret blinks at the end of the last block; pending sections sit at 0.7 opacity with grey skeleton bars.

### Chart Boards (signature)
- **Four pillars:** four equal cards, 30px 干支, 12px 十神; the day pillar gets the amber ring and amber 十神.
- **紫微 board:** 4×4 grid of 10px-radius palaces around a 2×2 centre; major stars 13px/600, minor 10px label-2, 化 marks 9px amber (忌 inverted); 命宮 name in amber; selected palace card-3 + 1.5px amber ring, related palaces card-2 + amber-line ring.
- **Charts:** pure SVG on CSS variables so both themes follow; tiers use amber → amber-line → faded label-3.

## Do's and Don'ts

### Do:
- **Do** keep lamplight amber (#e3a857) as the only chrome hue, identical in both themes.
- **Do** build hierarchy with the label ladder (100 / 60 / 38%) and the card ladder (#1c1c1e / #2c2c2e / #3a3a3c).
- **Do** mark selection in charts with inset rings (1–1.5px amber or amber-line), not shadows.
- **Do** keep touch targets at 44px minimum and inputs at 16px text.
- **Do** keep the system font stack and tabular numerals for years, ages and counts.
- **Do** keep the phone layout canonical; add columns at 768px and 1024px, never restyle the phone.
- **Do** respect `prefers-reduced-motion` for screen fades, skeletons, shimmer and pulsing dots.

### Don't:
- **Don't** introduce a second accent colour or use status green or coral decoratively.
- **Don't** load web fonts or CDN assets.
- **Don't** add decorative gradients; the only gradients are the loading shimmer and the faint amber wash on the 河圖洛書 hero card.
- **Don't** use drop shadows for emphasis on cards or chart cells.
- **Don't** mark cards, callouts or verdicts with a thick coloured side border; use the amber wash and an inset ring. Quotes in prose take a 1px neutral rule.
- **Don't** replace native-feeling controls (grouped rows, segmented control, toggle, tab bar) with bespoke widgets.
