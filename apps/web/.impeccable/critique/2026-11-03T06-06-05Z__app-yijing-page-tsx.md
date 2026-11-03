---
target: app/yijing/page.tsx
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:/Users/laichan/code/tung/numerology/apps/web/app/yijing/page.tsx"
target_fingerprint: "sha256:4726a9973a85f2beb51b14dcc6abc9293433ba56bbf7f444e033fa61d866e30d"
target_path: /Users/laichan/code/tung/numerology/apps/web/app/yijing/page.tsx
timestamp: 2026-11-03T06-06-05Z
slug: app-yijing-page-tsx
---
# Critique: /yijing (三錢起卦) — run 2, after redesign
Method: dual-agent (A: design review · B: detector + CDP)

## Heuristics (27/40, Acceptable; prev 22)
1 Status 2 — mobile mid-cast: just-cast line below fold behind tab bar; tray shows faces not value
2 Real world 3 — EN: 卦辭/爻辭 untranslated
3 Control 2 — review mode (?h=) 再占一卦 stuck (reset doesn't clear reviewMode/reviewAt)
4 Consistency 3 — zht half/full-width punctuation mix; written vs Cantonese voice
5 Error prevention 3 — readOnly question no visual change
6 Recognition 3 — 初九 not mapped to 初爻 row
7 Flexibility 3
8 Minimal 3 — amber ×5 on done screen
9 Error recovery 2 — generic providerHint blames API key on default AI
10 Help 3

## Detector
CLI 0 findings. In-page dark: .yj-faces 3.2, empty .yj-pos 3.2, placeholder 3.0. Light: 18 findings; amber text 1.7–1.9:1 (btn.secondary, pill.model), all secondary text 3.1–3.4. FP: text-occlusion ×2; nested-cards on .yj-yao intentional. Focus → body after cast. Targets <44: summaries 32px, AI pills 28px, academy link 17px.

## Priority issues
- [P1] Mobile: line being built off-screen while casting (tool.tsx:256-312). Result line under tray, compress slots / stack as progress. /impeccable layout
- [P1] Focus lost on done; reset() leaves review mode (tool.tsx:159-165). Focus result heading; clear reviewMode/reviewAt + router.replace. /impeccable harden
- [P1] Light theme contrast: amber text 1.7–1.9:1, label ladder <4.5 (system-wide; DESIGN.md amber identical both themes). Darker light-theme amber for text, deepen label-2/3, faces/placeholder label-2. /impeccable colorize
- [P1] EN core content Chinese-only (卦辭/爻辭); announce uses Chinese name. Knowledge glosses / nameEn. /impeccable clarify
- [P2] AI error copy generic (AiInterpret.tsx:99-116); settings only for custom provider; detail label-2. /impeccable clarify

## Personas
Jordan: AI toggle before casting; 初九 unmapped; classical-only after AI fail. Sam: focus lost; coin faces aria-hidden; review timestamp browser locale (tool.tsx:208). Casey: 全部自動 6px under primary, no undo.

## Minor
readOnly question unstyled; 變卦 symbol small, no changed-line hint; 互卦 fold cramped; full-width parens mix.

## Questions
全部自動 only after 3rd line? Plain-language gist before classical text? Stack as the progress indicator?
