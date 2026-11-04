# 多體系交叉驗證 · 第一期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增九星、畢氏生命靈數、行星幻方三個 deterministic 體系,以「核心五行」對八字日主做交叉對照,命盤頁以圖呈現、AI 新增「多體系交叉」一節,全站文風改為通俗簡練。

**Architecture:** 計算全在 `packages/engine`(純函數、`node --test`),知識資料在 `packages/knowledge`(JSON + 內聯 `.data.ts`)。web 端在瀏覽器直接呼叫 `castCrossSystem(chart)`(與 fengshui/qimen 頁同樣在 client 用引擎)。AI 只在 `crosssystem` 一節的 user prompt 收到序列化後的對照事實。

**Tech Stack:** TypeScript monorepo(npm workspaces)、Next.js(apps/web)、lunar-javascript、iztro、node:test。

**Spec:** `docs/superpowers/specs/2026-11-04-multi-system-phase1-design.md`

## Global Constraints

- 原則 1–14 見 spec「原則」一節,每個任務都適用;尤其:AI 不得自行計數;每個顯示的數可展開計算步驟;巧合須講基率;不製造恐懼;每個圖表有文字替代。
- Locale 代號不變:`zht` / `zhs` / `en`。不新增 `yue`。
- 文風「通俗簡練」:句短、詞準、略帶古雅,不堆文言虛詞,**不用粵語口語字**(嘅、咗、喺、唔、係〔作「是」解〕、嚟、佢、啲)。en = plain, concise, slightly elevated English。
- `packages/knowledge/data/*.json` 中已存在的檔案(`greek-gematria.json`、`planetary-squares.json` 等,另一工作流持續新增)**只讀不改**。新檔若與並行工作重名,改為讀取對方版本。
- `meta.tier` 選填:`"classical" | "scholarly" | "modern" | "science"`;缺省時 UI 顯示「未分級」。
- 日期基準:生命靈數與出生星期用**民用日期**(`input.year/month/day`);九星用 `resolveBirthDateTime(input)` 校正後日期。
- 河圖配五行:1、6 水;2、7 火;3、8 木;4、9 金;5 土。主數先化簡:11→2、22→4、33→6。
- 星期守護:日=Sun、一=Moon、二=Mars、三=Mercury、四=Jupiter、五=Venus、六=Saturn。
- 修改任何 LLM prompt 前,先讀並套用 `~/.claude/prompting-best-practices.md`。
- 工作分支 `feat/multi-system-p1`,自 `main` 開;完成後合併 `main` 最新再快轉 `main`(此 repo 無 `dev`)。
- 每個任務結束:該 workspace `npm test` 全綠。引擎 / 知識庫測試讀 `dist/`,跑測試前先 `npm run build -w <pkg>`。

## Review Focus

1. 立春前後出生(如 1990-02-03 vs 1990-02-05):年九星必須換星;午夜附近有經度校正時,九星日期與民用日期不同,UI 須標明各自基準。→ Task 3 測試、Task 7 測試。
2. 舊歷史紀錄(無 `crosssystem` 節、chart 由舊版引擎產生):對照卡必須照常顯示(從 `chart.input` 重算),報告節顯示為未生成、可按需生成。→ Task 7、Task 8。
3. 紫微 `fiveElementsClass` 非預期字串(空或首字非五行):不可拋錯,該 signal 略去並在矩陣顯示「—」。→ Task 6 測試。
4. 主數生日(如 2009-11-29:兩算法得 33 vs 6):兩值並列並標「算法分歧」,五行以採用算法(按組化簡)為準。→ Task 4、Task 6 測試。
5. AI 輸出引用 `science-notes.json` 以外的研究或對照事實以外的數字。→ Task 8 prompt 測試斷言 prompt 內含「只可引用」條款與條目清單。

---

### Task 1: 知識庫型別 + 行星幻方內聯模組

**Files:**
- Modify: `packages/knowledge/src/types.ts`(`KnowledgeMeta` 加選填 `tier`;新增 `KnowledgeTier`、`Cite`)
- Create: `packages/knowledge/src/planetary-squares.data.ts`(由 `data/planetary-squares.json` 內聯,檔頭照 `qiongtong.data.ts` 寫「AUTO-GENERATED from data/…」)
- Create: `packages/knowledge/src/planetary-squares.ts`
- Modify: `packages/knowledge/src/index.ts`(export 新模組)
- Test: `packages/knowledge/test/planetary-squares-module.test.mjs`

**Interfaces:**
- Produces:
  - `type KnowledgeTier = "classical" | "scholarly" | "modern" | "science"`
  - `interface Cite { work: string; author?: string; year?: number | string; locator?: string }`
  - `interface PlanetarySquare { planet: Planet; greek: string; order: number; rows: number[][]; note?: string }`
  - `type Planet = "Saturn" | "Jupiter" | "Mars" | "Sun" | "Venus" | "Mercury" | "Moon"`
  - `planetarySquare(planet: Planet): PlanetarySquare`
  - `PLANETARY_SQUARES_META: KnowledgeMeta`

- [ ] **Step 1: 寫失敗測試** `planetary-squares-module.test.mjs`:
  - 「內聯模組與 JSON 一致」:`import { planetarySquare } from "../dist/index.js"`,對 JSON 每個 square 斷言 `deepEqual(planetarySquare(s.planet).rows, s.rows)`(防漂移)。
  - 「Saturn 即洛書」:`deepEqual(planetarySquare("Saturn").rows, [[4,9,2],[3,5,7],[8,1,6]])`。
  - 「Sun 行和 111 總和 666」。
- [ ] **Step 2:** `npm run build -w @numerology/knowledge && npm test -w @numerology/knowledge` → 新測試 FAIL(`planetarySquare` 未定義)。
- [ ] **Step 3:** 實作上述型別與模組;`planetarySquare` 找不到時拋 `Error("未知行星:" + planet)`。
- [ ] **Step 4:** 同上命令 → 全 PASS。
- [ ] **Step 5:** Commit `feat(knowledge): tier/cite types + inlined planetary squares`。

### Task 2: 畢氏數性質 + 科學條目資料

**Files:**
- Create: `packages/knowledge/data/pythagorean-numbers.json`、`packages/knowledge/src/pythagorean-numbers.data.ts`、`packages/knowledge/src/pythagorean-numbers.ts`
- Create: `packages/knowledge/data/science-notes.json`、`packages/knowledge/src/science-notes.data.ts`、`packages/knowledge/src/science-notes.ts`
- Modify: `packages/knowledge/src/index.ts`
- Test: `packages/knowledge/test/numbers-science.test.mjs`

**Interfaces:**
- Produces:
  - `interface NumberQuality { n: number; keywords: Record<"zht"|"zhs"|"en", string>; tier: KnowledgeTier; cite: Cite }`;`numberQuality(n: number): NumberQuality | undefined`(n ∈ 1–9, 11, 22, 33)
  - `interface ScienceNote { id: string; claim: Record<"zht"|"zhs"|"en", string>; relatesTo: ("personality" | "birth-timing" | "coincidence")[]; cite: Cite; reviewed: boolean }`;`SCIENCE_NOTES: ScienceNote[]`

- [ ] **Step 1: 寫失敗測試**:
  - 「1–9 與 11/22/33 皆有條目且三語非空、每條有 cite.work」。
  - 「1–9 條目 tier = classical,cite.work 含 "Theology of Arithmetic"」;「11/22/33 tier = modern」(主數屬現代算法)。
  - 「科學條目恰為 forer-1949、carlson-1985、dean-kelly-2003、look-elsewhere」,且 cite 分別含 `"118"`、`"318"`、`"175"`、`"853"`(頁碼),全部 `reviewed: false`。
  - 「.data.ts 與 JSON deepEqual」(兩檔各一)。
- [ ] **Step 2:** build + test → FAIL。
- [ ] **Step 3:** 寫資料。科學條目引用(原樣):
  - Forer, B. R. (1949). "The fallacy of personal validation." *J. Abnormal and Social Psychology* 44(1):118–123. → personality
  - Carlson, S. (1985). "A double-blind test of astrology." *Nature* 318:419–425. → personality, birth-timing
  - Dean, G. & Kelly, I. W. (2003). "Is astrology relevant to consciousness and psi?" *J. Consciousness Studies* 10(6–7):175–198. → birth-timing
  - 另加一條 `id: "look-elsewhere"`(tier science,cite:Diaconis, P. & Mosteller, F. (1989). "Methods for studying coincidences." *J. American Statistical Association* 84(408):853–861;relatesTo coincidence)——原則 9 的依據。
  - 1–9 數性質關鍵詞取自 Iamblichus(託名)《Theology of Arithmetic》(Waterfield 譯,1988),只寫關鍵詞摘要,不搬原文。meta `reviewed: false`。
- [ ] **Step 4:** build + test → PASS。
- [ ] **Step 5:** Commit `feat(knowledge): pythagorean number qualities + science notes`。

### Task 3: 九星(engine)

**Files:**
- Create: `packages/engine/src/ninestar.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/test/ninestar.test.mjs`

**Interfaces:**
- Consumes: `resolveBirthDateTime`(solartime.ts);lunar-javascript `Solar.fromYmdHms(...).getLunar().getYearNineStar()/getMonthNineStar()`(回傳物件有 `getNumber()`〔中文數字「一」…「九」〕、`getColor()`、`getWuXing()`、`getPosition()`〔卦,如「坎」〕、`getPositionDesc()`〔如「正北」〕)。
- Produces:
  - `interface NineStarInfo { number: number; name: string; wuxing: Wuxing5; gua: string; direction: string }`(`name` 如「一白」)
  - `interface NineStarResult { year: NineStarInfo; month: NineStarInfo; date: { year: number; month: number; day: number }; steps: string[] }`
  - `castNineStar(input: BirthInput): NineStarResult`

- [ ] **Step 1: 寫失敗測試**:
  - `castNineStar({year:1990,month:2,day:3,hour:12,gender:"男"}).year` → `{number:2,name:"二黑",wuxing:"土",gua:"坤",direction:"西南"}`(立春前)。
  - `1990-02-05 12:00` → year `number 1, wuxing "水"`。
  - `2024-03-01 12:00` → year `number 3`、month `number 5`。
  - `steps` 非空且含「立春」字樣。
  - 帶 `longitude` 令校正跨日時,`date` 為校正後日期(用 `1990-02-04 23:50, longitude 135` 斷言 `date.day === 5`)。
- [ ] **Step 2:** `npm run build -w @numerology/engine && npm test -w @numerology/engine` → FAIL。
- [ ] **Step 3:** 實作;中文數字轉 int 用固定表 `"一二三四五六七八九"`。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(engine): nine star (year/month) via lunar-javascript`。

### Task 4: 生命靈數(engine)

**Files:**
- Create: `packages/engine/src/lifepath.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/test/lifepath.test.mjs`

**Interfaces:**
- Produces:
  - `reduceNumber(n: number): number[]`——回傳化簡鏈(含起點與終點),終止條件:`n <= 9` 或 `n ∈ {11,22,33}`。
  - `interface LifePathResult { value: number; byComponents: number; byDigits: number; methodsAgree: boolean; steps: { components: string[]; digits: string[] } }`(`value = byComponents`)
  - `lifePath(year: number, month: number, day: number): LifePathResult`
  - `hetuWuxing(n: number): Wuxing5`(主數先化簡:11→2、22→4、33→6)

- [ ] **Step 1: 寫失敗測試**:
  - `reduceNumber(1990)` → `[1990,19,10,1]`;`reduceNumber(29)` → `[29,11]`。
  - `lifePath(1990,3,18)` → byComponents 4、byDigits 4、methodsAgree true。
  - `lifePath(2009,11,29)` → byComponents 33、byDigits 6、methodsAgree false。
  - `lifePath(1990,2,3)` → value 6。
  - `steps.components[0]` 形如 `"1990 → 19 → 10 → 1"`。
  - `hetuWuxing`:1 水、2 火、3 木、4 金、5 土、6 水、7 火、8 木、9 金、11 火、22 金、33 水。
- [ ] **Step 2:** build + test → FAIL。
- [ ] **Step 3:** 實作。按組:年、月、日各 `reduceNumber` 取末值,相加再 `reduceNumber`。全數字:所有位數相加再 `reduceNumber`。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(engine): life path number with both methods + Hetu bridge`。

### Task 5: 行星幻方定位(engine)

**Files:**
- Create: `packages/engine/src/kamea.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/test/kamea.test.mjs`

**Interfaces:**
- Consumes: Task 1 `planetarySquare(planet)`、`Planet`。
- Produces:
  - `interface KameaMark { value: number; system: "lifepath" | "ninestar"; row: number; col: number }`
  - `interface KameaResult { weekday: number; planet: Planet; order: number; rows: number[][]; lineSum: number; total: number; marks: KameaMark[]; steps: string[] }`(weekday 0 = 星期日)
  - `castKamea(year: number, month: number, day: number, marks: { value: number; system: "lifepath" | "ninestar" }[]): KameaResult`——value > n² 的 mark 略去。

- [ ] **Step 1: 寫失敗測試**:
  - `castKamea(1990,3,18,[{value:4,system:"lifepath"},{value:1,system:"ninestar"}])` → weekday 0、planet "Sun"、order 6、lineSum 111、total 666,marks 長度 2 且位置與 Sun 方陣中 4、1 所在格一致。
  - `castKamea(1990,2,3,[{value:6,system:"lifepath"},{value:2,system:"ninestar"}])` → weekday 6、planet "Saturn"、marks 為 `{value:6,row:2,col:2}`、`{value:2,row:0,col:2}`。
  - value 50 於 Sun 方陣(36 格)被略去。
- [ ] **Step 2:** build + test → FAIL。
- [ ] **Step 3:** 實作;星期用 `new Date(Date.UTC(y, m-1, d)).getUTCDay()`;lineSum = n(n²+1)/2、total = n²(n²+1)/2 計算得出(不讀 note)。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(engine): planetary kamea by birth weekday`。

### Task 6: 對照矩陣(engine)

**Files:**
- Create: `packages/engine/src/crosssystem.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/test/crosssystem.test.mjs`

**Interfaces:**
- Consumes: Task 3 `castNineStar`、Task 4 `lifePath`/`hetuWuxing`、Task 5 `castKamea`;`ChartResult`(`chart.bazi.dayMaster`、`chart.ziwei.fiveElementsClass` 如「土五局」);shishen.ts 的 `WUXING`(天干→五行)。
- Produces:
  - `type Relation = "same" | "sheng" | "ke"`
  - `wuxingRelation(a: Wuxing5, b: Wuxing5): Relation`(雙向:a 生 b 或 b 生 a 皆為 sheng;克亦然)
  - `type CrossSystemId = "bazi" | "ziwei" | "ninestar" | "lifepath"`
  - `interface CrossSignal { system: CrossSystemId; value: string; wuxing: Wuxing5; bridge?: "河圖"; tier?: KnowledgeTier; cite: Cite; steps: string[]; relation?: Relation }`(錨點 bazi 無 relation)
  - `interface CrossSystemResult { anchor: Wuxing5; signals: CrossSignal[]; distribution: Record<Wuxing5, number>; nineStar: NineStarResult; lifePath: LifePathResult; kamea: KameaResult }`
  - `castCrossSystem(chart: ChartResult): CrossSystemResult`

- [ ] **Step 1: 寫失敗測試**:
  - `wuxingRelation`:火火 same;木火、火木 sheng;水火、火水 ke;土金 sheng;木土 ke。
  - `castCrossSystem(castChart(SAMPLE_1990_03_18))`:signals 依序 bazi、ziwei、ninestar、lifepath;bazi 無 relation;lifepath `bridge === "河圖"`、wuxing 「金」(4);ninestar wuxing 「水」(一白);ziwei value 「土五局」wuxing 「土」;distribution 各值總和 = signals 數。
  - 每個 signal `steps.length > 0` 且 `cite.work` 非空。
  - `fiveElementsClass` 為 `""` 時(手動構造 chart 副本)不拋錯,signals 不含 ziwei。
  - 2009-11-29 的 lifepath signal value 含「33」與「6」及分歧標記(value 形如 `"33(全數字法 6)"`)。
- [ ] **Step 2:** build + test → FAIL。
- [ ] **Step 3:** 實作。cite / tier:bazi `{work:"淵海子平"}` classical;ziwei `{work:"紫微斗數全書"}` classical;ninestar `{work:"玄空九星(年月紫白)"}` classical;lifepath `{work:"Modern Pythagorean numerology", locator:"L. Dow Balliett (1908)"}` modern。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(engine): cross-system core-wuxing matrix`。

### Task 7: 命盤頁「多體系對照」卡(web)

**Files:**
- Create: `apps/web/components/CrossSystemCard.tsx`
- Create: `apps/web/lib/crossView.ts`(純函數:把 `CrossSystemResult` 轉為顯示用列,供測試)
- Modify: `apps/web/app/page.tsx`(在 `<WuxingChart>` 之後渲染 `<CrossSystemCard chart={ready.chart} />`)
- Modify: `apps/web/lib/i18n.ts`(新 key 三語)、`apps/web/app/globals.css`(沿用 `card viz` token,明暗模式)
- Test: `apps/web/test/crossView.test.mjs`

**Interfaces:**
- Consumes: Task 6 `castCrossSystem`、`CrossSystemResult`、`Relation`;現有 `QuoteRef` 彈窗(`apps/web/lib/quoteRef.tsx`)顯示 cite;`useLocale()`、`t()`。
- Produces: `crossRows(r: CrossSystemResult): { system: CrossSystemId; value: string; wuxing: string; relation: Relation | "anchor"; tier: KnowledgeTier | "unrated"; cite: Cite; steps: string[]; dateBasis: "civil" | "solar" }[]`;`luoshuMarks(r): { value: number; system: "ninestar-year" | "ninestar-month" | "lifepath"; row: number; col: number }[]`。

- [ ] **Step 1: 寫失敗測試** `crossView.test.mjs`:
  - 1990-03-18 樣本:`crossRows` 第一列 relation `"anchor"`;lifepath 列 `dateBasis "civil"`、ninestar 列 `dateBasis "solar"`;無 tier 時為 `"unrated"`。
  - `luoshuMarks`:年星 1 → 洛書 `[[4,9,2],[3,5,7],[8,1,6]]` 中 row 2 col 1;生命靈數 33 先化簡為 6 → row 2 col 2。
  - i18n 測試(現有 `i18n.test.mjs`)仍通過:新 key 三地齊備。
- [ ] **Step 2:** `npm test -w apps/web`(或 `node --test "test/*.test.mjs"` 於 apps/web)→ FAIL。
- [ ] **Step 3:** 實作 `crossView.ts`;再寫元件,三塊(spec §四):洛書九宮(三種標記)、對照矩陣(relation 圖示 + tier 徽章 + 點按 cite + 可展開 steps)、行星幻方(高亮 marks、標 lineSum / total)。每個 SVG 帶 `role="img"`、`aria-label`、`<title>`。矩陣下方一行說明「靈數經河圖橋接為五行」。元件內 `useMemo(() => castCrossSystem(chart), [chart])`,舊歷史紀錄同樣可算。
- [ ] **Step 4:** 測試 PASS;`npm run build -w apps/web` 成功;`next dev` 開命盤頁,截圖確認明 / 暗兩主題、手機寬度(375px)無橫向捲動。
- [ ] **Step 5:** Commit `feat(web): cross-system card (Luoshu, matrix, kamea)`。

### Task 8: AI「多體系交叉」一節

**Files:**
- Modify: `packages/ai/src/context.ts`(新增 `crossSystemFacts`)
- Modify: `packages/ai/src/prompts.ts`(`SEGMENT_TITLES.crosssystem`、`REPORT_SEGMENTS` 加一節、`buildReportSectionPrompt` 在 `seg.key === "crosssystem"` 時附事實區塊與規則、`SYSTEM_PERSONA` 擴為多體系)
- Modify: `packages/ai/src/report.ts`(`streamReportSection` 對 crosssystem 傳入事實)
- Modify: `apps/web/app/page.tsx`(`REPORT_SEGS` 在 `advice` 前加 `{ key: "crosssystem", label: t("seg.crosssystem") }`)、`apps/web/lib/basis.ts` + `apps/web/components/SectionBasis.tsx`(crosssystem 依據 = 四個 signal 的值與五行)、`apps/web/lib/i18n.ts`
- Test: `packages/ai/test/crosssystem-prompt.test.mjs`;`apps/web/test/basis.test.mjs` 加一例

**Interfaces:**
- Consumes: Task 6 `castCrossSystem`;Task 2 `SCIENCE_NOTES`。
- Produces: `crossSystemFacts(r: CrossSystemResult, locale: AiLocale): string`(Markdown,只含事實:各體系值、五行、relation、bridge、tier、cite,以及可用的宇宙幾何數:洛書行和 15 / 總和 45、所落幻方行和 / 總和;末附 `SCIENCE_NOTES` 條目 id + 一句結論 + cite)。

- [ ] **Step 0:** 讀 `~/.claude/prompting-best-practices.md` 並套用。
- [ ] **Step 1: 寫失敗測試**:
  - `SEGMENT_TITLES.crosssystem` 三語皆有;`REPORT_SEGMENTS` 含 key `crosssystem` 且位於 `advice` 之前。
  - 1990-03-18 樣本的 `buildReportSectionPrompt(caveats, seg_crosssystem, "bazi", "zht", facts)` 含事實區塊,即使 lens 為 `bazi`(多體系一節不受隔離)。
  - prompt 含條款:只可引用事實區塊內的數字與 `science-notes` 條目;巧合須講基率;經河圖橋接須明說;不以恐懼語氣談 666 / 凶星。
  - 其他節(如 `personality`)的 prompt 與 `buildCachedSystem` 輸出**不含**多體系區塊(prompt cache 不受影響)。
- [ ] **Step 2:** `npm run build -w @numerology/ai && npm test -w @numerology/ai` → FAIL。
- [ ] **Step 3:** 實作。`buildReportSectionPrompt` 新增選填第 5 參數 `extraFacts?: string`。本節要點:一句定性(幾個體系同向、哪個相反)→ 交匯 / 分歧逐點講機制 → 宇宙幾何對照(只用事實區塊的數)→ 科學角度(有相關才寫)。對照表由前端畫,AI 不重畫表格。
- [ ] **Step 4:** ai 與 web 測試 PASS;`next dev` 實跑一次 crosssystem 節(任一可用 provider),人工檢查無事實外數字。
- [ ] **Step 5:** Commit `feat(ai): cross-system report section`。

### Task 9: AI 文風改為通俗簡練

**Files:**
- Modify: `packages/ai/src/prompts.ts`(`localeDirective` 三語寫入文風定義;`STYLE_DIRECTIVES` 首條與 `STYLE_EXEMPLAR` 改寫為通俗簡練;`SYSTEM_PERSONA` 加入原則 9、10、11 各一句)
- Test: `packages/ai/test/locale.test.mjs` 加斷言

**Interfaces:** 無新增;`localeDirective(locale)` 簽名不變。

- [ ] **Step 0:** 讀 `~/.claude/prompting-best-practices.md`。
- [ ] **Step 1: 寫失敗測試**:`localeDirective("zht")` 含「通俗簡練」且不含「香港用語」;`localeDirective("zhs")` 含「通俗简练」;`localeDirective("en")` 含 `"plain"` 與 `"concise"`;`SYSTEM_PERSONA` 含「基率」與「不製造恐懼」或其簡體對應。
- [ ] **Step 2:** → FAIL。
- [ ] **Step 3:** 改寫。zht 指令明文禁止粵語口語字(列出:嘅、咗、喺、唔、嚟、佢、啲)。
- [ ] **Step 4:** → PASS(含現有 `context.test.mjs`、`tldr-prompt.test.mjs`)。
- [ ] **Step 5:** Commit `feat(ai): plain-concise house style across locales`。

### Task 10: 介面文案改為通俗簡練

**Files:**
- Modify: `apps/web/lib/i18n.ts`(zht 約 54 行含粵語字;zhs、en 同步檢視語氣)
- Test: `apps/web/test/i18n.test.mjs` 加一例

- [ ] **Step 1: 寫失敗測試**:zht 所有字串不含 `/[嘅咗喺唔嚟佢啲]/`。
- [ ] **Step 2:** → FAIL(現有約 54 行)。
- [ ] **Step 3:** 逐句改寫為通俗簡練(「係」作「是」解時改為「是」;專名、干支、星曜不改)。zhs 對應句同步。
- [ ] **Step 4:** web 測試 PASS;`npm run build -w apps/web` 成功。
- [ ] **Step 5:** Commit `refactor(web): UI copy to plain-concise style`。

### Task 11: 知識庫文件 + domain todo 清單 + 收尾

**Files:**
- Create: `docs/domains.md`(表格:體系、狀態 todo / 進行中 / 已入庫、主要出處、可否 deterministic、與洛書主軸的連結;收錄 spec §二 全部候選;已入庫:八字、紫微、易經、九星、生命靈數、行星幻方、Greek gematria;進行中:Fideler;todo:其餘及廣東話版、喜忌引擎、學院科學專區)
- Modify: `docs/knowledge-base.md`(加 `tier` / `cite` 約定與並行工作協調一段)

- [ ] **Step 1:** 寫兩份文件。
- [ ] **Step 2:** 根目錄 `npm run build && npm test` 全綠;`npm run cf:pages` 成功。
- [ ] **Step 3:** Commit `docs: domain registry + tier/cite conventions`。
- [ ] **Step 4:** `git merge main` 入分支、解衝突、再 `git checkout main && git merge --ff-only feat/multi-system-p1`。不 push。
