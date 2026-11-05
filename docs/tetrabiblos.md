# Ptolemy《Tetrabiblos》卷一:行星尊貴

資料:`packages/knowledge/data/tetrabiblos.json`;驗證:`packages/knowledge/test/tetrabiblos.test.mjs`。來源:Ashmand 1822 英譯(公共領域,archive.org)。界表由原書頁面圖片讀取。

## 行星性質

| 分類 | 行星 |
|---|---|
| 吉 | Jupiter、Venus、Moon |
| 凶 | Saturn、Mars |
| 中性 | Sun、Mercury |
| 陽性 | Sun、Saturn、Jupiter、Mars |
| 陰性 | Moon、Venus |
| 兩性 | Mercury |
| 晝 | Sun、Jupiter、Saturn |
| 夜 | Moon、Venus、Mars |
| 晝夜皆可 | Mercury |

## 宮位(domicile)同廟旺

| 行星 | 晝宮 | 夜宮 | 廟(exaltation) | 陷(fall) |
|---|---|---|---|---|
| Sun | Leo | — | Aries | Libra |
| Moon | Cancer | — | Taurus | Scorpio |
| Saturn | Aquarius | Capricorn | Libra | Aries |
| Jupiter | Sagittarius | Pisces | Cancer | Capricorn |
| Mars | Aries | Scorpio | Capricorn | Cancer |
| Venus | Taurus | Libra | Pisces | Virgo |
| Mercury | Gemini | Virgo | Virgo | Pisces |

晝宮、夜宮之分係 Ashmand 註腳(引 Whalley),唔係托勒密原文。原書冇廟旺度數。

## 三方主星

| 三方 | 晝 | 夜 |
|---|---|---|
| Aries、Leo、Sagittarius | Sun | Jupiter |
| Taurus、Virgo、Capricorn | Venus | Moon |
| Gemini、Libra、Aquarius | Saturn | Mercury |
| Cancer、Scorpio、Pisces | Venus | Moon(火星共管) |

## 埃及界

| 宮 | 各段(行星 度數) |
|---|---|
| Aries | Jupiter 6 · Venus 6 · Mercury 8 · Mars 5 · Saturn 5 |
| Taurus | Venus 8 · Mercury 6 · Jupiter 8 · Saturn 5 · Mars 3 |
| Gemini | Mercury 6 · Jupiter 6 · Venus 5 · Mars 7 · Saturn 6 |
| Cancer | Mars 7 · Venus 6 · Mercury 6 · Jupiter 7 · Saturn 4 |
| Leo | Jupiter 6 · Venus 5 · Saturn 7 · Mercury 6 · Mars 6 |
| Virgo | Mercury 7 · Venus 10 · Jupiter 4 · Mars 7 · Saturn 2 |
| Libra | Saturn 6 · Mercury 8 · Jupiter 7 · Venus 7 · Mars 2 |
| Scorpio | Mars 7 · Venus 4 · Mercury 8 · Jupiter 5 · Saturn 6 |
| Sagittarius | Jupiter 12 · Venus 5 · Mercury 4 · Saturn 5 · Mars 4 |
| Capricorn | Mercury 7 · Jupiter 7 · Venus 8 · Saturn 4 · Mars 4 |
| Aquarius | Mercury 7 · Venus 6 · Jupiter 7 · Mars 5 · Saturn 5 |
| Pisces | Venus 12 · Jupiter 4 · Mercury 3 · Mars 9 · Saturn 2 |

## 托勒密界

| 宮 | 各段(行星 度數) |
|---|---|
| Aries | Jupiter 6 · Venus 8 · Mercury 7 · Mars 5 · Saturn 4 |
| Taurus | Venus 8 · Mercury 7 · Jupiter 7 · Saturn 2 · Mars 6 |
| Gemini | Mercury 7 · Jupiter 6 · Venus 7 · Mars 6 · Saturn 4 |
| Cancer | Mars 6 · Mercury 7 · Jupiter 7 · Venus 7 · Saturn 3 |
| Leo | Saturn 6 · Mercury 7 · Venus 6 · Jupiter 6 · Mars 5 |
| Virgo | Mercury 7 · Venus 6 · Jupiter 5 · Saturn 6 · Mars 6 |
| Libra | Saturn 6 · Venus 5 · Mercury 8 · Jupiter 5 · Mars 6 |
| Scorpio | Mars 6 · Venus 8 · Jupiter 7 · Mercury 6 · Saturn 3 |
| Sagittarius | Jupiter 8 · Venus 6 · Mercury 5 · Saturn 6 · Mars 5 |
| Capricorn | Venus 6 · Mercury 6 · Jupiter 7 · Saturn 6 · Mars 5 |
| Aquarius | Saturn 6 · Mercury 6 · Venus 8 · Jupiter 5 · Mars 5 |
| Pisces | Venus 8 · Jupiter 6 · Mercury 6 · Mars 6 · Saturn 4 |

## test 驗證咗乜

- 日月各一宮、五星各兩宮,剛好分齊十二宮,同 Agrippa 黃道守護一致。
- 三方每組三宮相隔 120°;落陷係廟旺嘅對宮。
- 兩套界表每宮剛好 30°、五星各一段;埃及界五星總度數 = 書中所列 57、79、66、82、76,合共 360。
- 迦勒底界按 8、7、6、5、4 規則推出嘅日間總度數同書中一致。

## 原文問題

- 埃及界處女座最後累計數印成 50,應為 30。
- 托勒密界 Ashmand 喺幾格印咗兩種讀法,本庫取符合托勒密第 24 章規則嗰個(例如獅子土星先),其餘記入 `variants`;雙魚另一讀法加起來得 28°,係誤印。
- 迦勒底界夜間:書寫土星 66、水星 78,但按書中規則(第三三方夜間水星先)計得 75、69,未解決。

## 接入引擎(`castEphemeris`)

- 七曜地心視黃經由 `astronomy-engine`(MIT)計,回歸黃道、當日真春分;J2000 對 JPL Horizons 誤差 < 0.01°(`packages/engine/test/ephemeris.test.mjs`)。
- 鐘面時間當東八區換算 UTC,未計夏令時(1986–1991 年夏天出生要自行減一小時)。
- 每曜給出:宮度、逆行、宮主、入廟 / 入旺 / 落陷、三方主星(有經緯度先判晝夜生,否則晝夜並列)、埃及界主。
- 相位按整宮宮距計(Ptolemy 以宮論相位):六合、刑、三合、對沖;同宮唔算相位。
- 月亮另配 Agrippa 二十八月宿(由白羊 0° 起每宿 360°/28,回歸黃道;Agrippa 講「第八重天」,本站按回歸黃道處理)。
- 有經緯度時計上升點同天頂(地方恆星時 + 真黃赤交角,球面三角標準式),宮位用整宮制:上升所在宮為第 1 宮。test 用 astronomy-engine 嘅地平座標獨立驗證上升點喺東方地平線(高度 < 0.05°)、天頂喺子午線,四個地點(北京、香港、悉尼、赫爾辛基)。
- 未做:象限宮制(Porphyry、Placidus 等)、托勒密界 / 迦勒底界、恆星黃道。
- AI 只喺「多體系」一節收到呢啲事實;prompt 規定宮位只講落點,唔推宮位主事吉凶(卷三、四嘅宮位論斷未入庫)。
- 網頁週期卡顯示七曜表(位置、宮、尊貴、界主)、上升天頂、整宮相位同月宿。
