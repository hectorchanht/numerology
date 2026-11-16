# Lesson Notepad V1 — 規劃與進度

## 目標
洛書命理 Academy 每課內置筆記：iPad 上堂左邊讀課文、右邊即寫（文字 + Pencil 手寫），
唔使跳去外部 Notes app，零 setup friction。

## 決定（2026-11-16，Hector 拍板）
- 範圍 = V1 全套：文字筆記 + 手寫畫布（選項「文字 + 手寫畫布」）。
- Local-first：只存裝置 localStorage，不上傳、無後端、無帳戶同步。
- 無新 dependencies；跟 academy 既有 localStorage 進度 pattern。
- Pencil 定位不變：抄盤 + 註解；畫布附九宮格底做抄盤練習。

## Scope checklist
- [x] `apps/web/app/yijing/academy/notes.ts` — 純儲存 helpers（noteKey/serialize/parse 防禦解析/load/save/hasNote，try/catch 包 localStorage）
- [x] `apps/web/app/yijing/academy/LessonNotepad.tsx` — 右側 drawer（窄屏 94vw + backdrop；闊屏 clamp(340px,42vw,520px)）；文字 tab（debounce 400ms autosave、已保存時間、字數、清除需 confirm）；手寫 tab（Pointer Events 食筆壓、座標歸一化 0–1、undo、清除、九宮格底開關）
- [x] `LessonView.tsx` — masthead 掛 toggle + 面板（有筆記時 toggle 帶紅點）
- [x] `apps/web/lib/yijingStrings.ts` — 新增 15 條 academy.notes* 三語 keys
- [x] `apps/web/app/yijing/academy/page.tsx` — 課程卡「有筆記」badge（跟 progress 同一 focus-refresh 週期讀 hasNote）
- [x] `apps/web/test/lesson-notes.test.mjs` — 5 條新 test（key/round-trip/垃圾輸入/點位防禦/localStorage stub 往返）
- [x] Impeccable audit（新 UI 檔）：findings 已修（radius 改 var(--radius)、字級改 13px ramp），新檔 0 findings

## Progress log
- 2026-11-16 EXECUTE：全 scope 落地。Tests 272/272 pass（pretest tsc + node --test，含新 5 條）；production build 成功（/yijing/academy/[lesson] 17.6 kB）。本地 tree 先同 remote head b92848e 全量 sync 再落手（本地原落後 105+ 檔）。Commit: this push（sha 見 git log 本檔所在 commit）。
- 2026-11-16 VERIFY（獨立於 execute，Muse 主 session 親核）：GitHub main head = 37aaf1af（即 execute commit）；live 課頁 HTTP 200；已部署 chunk 998 含 `yijing-academy-note:`、chunk 8768 含「九宮格底」（與本地 build hash 一致）；本地重跑 `npm test` = 272/272 pass；Impeccable 重掃新檔（LessonNotepad.tsx + notes.ts）= 0 findings。全部通過。
- 2026-11-16 SHIP：V1 正式上線 https://numerology.dawnstudio.app/yijing/academy/hetu-luoshu 。剩低人手一關：Hector 喺 iPad 實機開課、Pencil 寫畫、reload 睇 persistence —— 裝置級體驗由佢確認。
- Learnings：(1) 本地 numerology checkout 可落後 remote 100+ 檔，落手前先用 head tarball 全量 sync，唔好只靠 per-file diff；(2) `npm test` pretest 對 workspace packages 嘅 built dist 做 typecheck，sync 源碼後要先 build deps，唔係會出誤導性 TS2305；(3) Pages 部署狀態可經 GitHub check-runs API 睇，push 前後都用得。

## Iteration 2（2026-11-16，Hector iPad 實機 feedback）
- Hector 確認 V1 works，兩點要改：(1) 抽屜會遮住課文 —— 要分欄並排，課文同筆記各佔一半，唔好覆蓋；(2) 筆記面板 nav/chrome 要 compact，空間留俾內容同畫布。

### 改動
- ≥900px 開筆記時：`.lesson-cols.has-notes` 變兩欄 grid（minmax(0,1fr) ×2，gap 20px），課文欄收窄，筆記欄 sticky（top 12px、高 100dvh−24px、獨立捲動），無遮罩、唔鎖頁面捲動。<900px 保留抽屜（94vw fixed + 遮罩 + 鎖捲動）。
- Compact chrome：面板 header 收成單行 51px（✎ 筆記 + 課名截尾 + `.seg.compact` 文字/手寫 + ✕）；body padding 收細；已保存時間縮成 footer 細字（同「只存此裝置」同一行）；文字 textarea 同手寫畫布改 flex 填滿成欄高度（唔再用 3/4 aspect 限高）。
- 結構：開關 state 升上 LessonView（toggle 掣留喺 masthead，紅點改用 hasNote 查）；LessonNotepad 改受控組件（open/onClose props）。畫布改用 ResizeObserver 跟實尺寸重畫（分欄/旋轉/開關都啱）；儲存 key 同形狀不變，V1 行為全保留。

### Execute 證據
- Tests：`npm test` 272/272 pass（pretest tsc 乾淨）。
- Build：`npm run build` 成功（93/93 static pages）。
- 本地 production + Playwright 三視口量度（截圖存 ~/workspace/ipad-hetu-notes/iter2/）：1194×834 課文欄 x 304–707、筆記欄 x 727–1130，各 403px，零重疊，panel position=sticky、高 810；834×1194 同 390×844 為 fixed 抽屜 94vw（預期覆蓋）。畫布於分欄模式填滿欄高（381×645 CSS px，backing store 同步）。
- Impeccable（source mode）：新 code 3 處 off-ramp 字級（12px/11px）已改返 13px ramp；LessonNotepad.tsx + notes.ts = 0 findings，globals.css 新增區塊 = 0 findings；其餘為既有 sibling advisories，無郁。
- Commit: this push。
