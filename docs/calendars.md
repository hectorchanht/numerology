# 曆法三系(Jyotish、埃及民用曆、十九年週期)

資料:`packages/knowledge/data/{jyotish,egyptian-calendar,metonic}.json`;引擎:`packages/engine/src/calendars.ts`;驗證:`packages/knowledge/test/calendars.test.mjs`、`packages/engine/test/calendars.test.mjs`。

## Jyotish

- 27 宿,每宿 13°20′;宿主按 Vimshottari 運序由 Aśvinī = Ketu 循環(test 驗證)。
- ayanamsa:Chitrapaksha 定義 Spica 恆星黃經 = 180°,以 Spica 的 J2000 座標(`behenian-stars.json`)即場歲差換算。與官方 Lahiri 表可差數角分;1990 約 23°43′、2000 約 23°51′(test 範圍)。
- 首運餘年 = 宿主運年數 × 月亮在宿內未行之弧 / 13°20′(BPHS 行星大運章 v.12–16;Santhanam 英譯有版權,只作定位)。年長取 365.25 日,另有 360 日 savana 年一說。

## 埃及民用曆

- 365 日 = 12 × 30 + 5,不置閏。紀元:Nabonassar 元年 Thoth 1 = 儒略曆公元前 747 年 2 月 26 日,JDN 1448638(Almagest III.7)。
- 交叉驗證:Nabonassar 425 年 Thoth 1 = Era Philip 元年(儒略曆公元前 324 年 11 月 12 日);887 年 Thoth 1 = 公元 139 年 7 月 20 日(Censorinus)。
- face:每宮三個 10°,迦勒底序由白羊 0° 火星起;表據 Lilly 1647,經維基百科轉引。埃及旬星星名學界未定,不入庫。

## 十九年週期

- 金數 G = (Y mod 19) + 1;Gregorian epact = (11G − ⌊3C/4⌋ + ⌊(8C + 5)/25⌋ + 27) mod 30,C = ⌊Y/100⌋ + 1;復活節用 Meeus / Jones / Butcher 算法。
- Meton:19 年 ≈ 235 朔望月(Diodorus XII.36.2;235 之數見 Loeb 編者注)。另有公元前 433 年 6 月 28 日一說。
- 中國四分曆:章法 19、章月 235、蔀 76、紀 1520、元 4560(《後漢書》志第三〈律曆下〉)。現行農曆用定氣定朔,19 年內閏月數不固定,引擎以 lunar-javascript 實數列出。
