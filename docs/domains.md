# Domain 清單

每個體系一行。狀態:**已入庫**(資料在 `packages/knowledge/` 且有測試)/ **進行中** / **todo**。
「Deterministic」指能否由出生資料以固定規則重算(同一輸入永遠同一輸出)。「洛書主軸」指與洛書(= Saturn 3×3 幻方,九宮)的連結。
層級(tier)與出處(cite)約定見 `docs/knowledge-base.md`。

## 已入庫

| 體系 | 狀態 | 主要出處 | Deterministic | 與洛書主軸的連結 |
|---|---|---|---|---|
| 八字 | 已入庫 | 三命通會、滴天髓、窮通寶鑑(`qiongtong.json`);排盤由引擎 | 是 | 日主五行為對照矩陣錨點;已含干支關係、格局(簡化)、胎元命宮、小運流月、新神煞;河圖洛書同源於五行數 |
| 紫微斗數 | 已入庫 | 紫微斗數全書;安星交 iztro | 是 | 五行局五行入對照矩陣 |
| 易經 | 已入庫 | 周易(`yijing*.data.ts`)、Legge 英譯(公有領域) | 是(卦由數起) | 八卦配洛書九宮(後天八卦) |
| 九星(氣學) | 已入庫 | 九星氣學;年星 / 月星由引擎 | 是 | 即洛書九宮飛星,主軸本體 |
| 生命靈數 | 已入庫 | 畢氏數秘(現代算法)`pythagorean-numbers.json` | 是 | 經河圖數橋接五行(標 `bridge: 河圖`);數 1–9 落洛書格 |
| 行星幻方 | 已入庫 | Agrippa, De occulta philosophia II.22(1533 版核對,Moon 誤印已記)`planetary-squares.json` | 是 | Saturn 方陣即洛書;其餘方陣為洛書的高階推廣 |
| Greek gematria | 已入庫 | Fideler 等事實 + 頁碼`greek-gematria.json` | 是 | 365、729 等數的希臘字母值,與九宮 / 365 日對看 |
| Agrippa correspondences / cabala / scales | 已入庫 | Agrippa 卷 I 對應表、卷 II–III 行星神名 / 28 月宿 / 十 Sephiroth、卷 II 數字刻度表 1–12、卷 III 七十二天使(`agrippa-correspondences.json`、`agrippa-cabala.json`、`agrippa-scales.json`) | 是(查表) | 行星神名值與幻方行和 / 總和相扣;七十二天使由出埃及記 14:19–21 推算 |
| 第四本(Fourth Book) | 已入庫(行星時:引擎 `castPlanetaryHour`,需出生地緯度;週期卡 + AI 多體系事實) | 1655 Turner 英譯:地占 16 圖、Heptameron 行星時、Arbatel 七靈(`fourth-book.json`) | 是 | 行星時用迦勒底次序,與幻方行星序相同 |
| 皇極經世 | 已入庫(待校對;引擎 `castHuangji`,週期卡 + AI 多體系事實) | 邵雍《皇極經世書》:元會運世紀年、開物 / 閉物、外篇數(`huangji-jingshi.json`) | 是 | 元 = 12 × 30 × 12 × 30 = 129600 年 |
| 律呂三分損益 | 已入庫(待校對);已接引擎(`castBirthLore` 出生月律)同學院 `/harmony` | 《管子·地員》《呂氏春秋·音律》《淮南子·天文訓》(`lulu.json`) | 是 | 黃鐘 81 = 3⁴ = 九九,與九宮 3 進位相通 |
| 蒂邁歐篇數理 | 已入庫(待校對);已接學院 `/harmony` | Plato,Jowett 1871 英譯:世界靈魂音階、七重天、五正多面體、元素轉換(`timaeus.json`) | 是 | 9/8、256/243 同律呂三分損益同源 |
| Nicomachus 算術 | 已入庫(待校對);已接學院 `/harmony`、`castNumberLore` 數的分類 | D'Ooge 1926 英譯:數嘅分類、完全數、五種比、形數、十種比例、最完美比例(`nicomachus.json`) | 是 | 6:8:9:12 同律呂、蒂邁歐篇音程一致 |
| 河洛理數 | 已入庫(待校對);已接引擎(`castHeluo`)、週期卡同 AI 多體系一節 | 陳摶、邵雍題《河洛理數》卷一起例(`heluo-lishu.json`):干支取數、天地數、先後天卦、元堂、元氣、化工、大運 | 是 | 天干洛書數同八卦、地支河圖數;卦名接易經知識庫 |
| 卡巴拉(Sefer Yetzirah) | 已入庫(待校對);已接引擎(字母分類、Westcott 補表配星座 / 星期) | Sefer Yetzirah,Westcott 1893 英譯(`sefer-yetzirah.json`) | 是(查表) | 22 字母 = 3 + 7 + 12;七雙字母配七行星,與幻方行星序對看 |
| Behenian 十五恆星 | 已入庫(待校對);已接引擎(`castBirthLore` 合相 + 基率) | Agrippa I.32 名稱;J2000 座標 Hipparcos(van Leeuwen 2007,經維基百科);容許度 6°(維基百科,近代)(`behenian-stars.json`) | 是(歲差換算黃經) | 第 8 顆 Alkaid / Polaris 兩讀並列 |
| 數之學(Agrippa 數階、希伯來字母值、gematria 同值) | 已接引擎(`castNumberLore`)、首頁「數之學」卡同 AI 多體系一節 | `agrippa-scales.json`、`agrippa-correspondences.json`、`greek-gematria.json` | 是(查表) | 盤中各數(生命靈數、幻方行和 / 總和、瑪雅 Kin、河洛天地數)逐個查,附 gematria 基率 |
| 西洋占星(Tetrabiblos 卷一) | 已入庫(待校對);已接引擎(`castEphemeris`)同 AI 多體系一節 | Ptolemy,Ashmand 1822 英譯:宮位、三方、廟旺、埃及 / 托勒密 / 迦勒底界、相位(`tetrabiblos.json`);七曜位置用 astronomy-engine(對 JPL Horizons 誤差 < 0.01°) | 是(七曜宮度、尊貴、界主、整宮相位、晝夜生;有經緯度時加上升、天頂、整宮宮位) | 星期守護行星已經幻方接上;月亮位置另配 Agrippa 二十八月宿 |
| 康熙筆畫 | 已入庫 | 康熙字典筆畫(`kangxi-strokes.json`) | 是 | 姓名筆畫數化簡後可落九宮 |
| 科學筆記 | 已入庫(待校對,reviewed: false) | `science-notes.json`(同行評審條目) | 否(文獻) | 無直接連結;供報告「現代科學角度」 |
| 太玄經 729 贊 | 已入庫(首名對照維基文庫、待校對) | 揚雄《太玄經》(約 4 BCE–AD 2;`taixuan.json`) | 是(首 / 贊由數起) | 三分九天 × 81 首 × 9 贊 = 729,九宮自相乘三次 |
| 瑪雅 Tzolk'in / Haab | 已入庫(GMT 584283;Dreamspell 不計算;名稱來源 Wikipedia,待校對) | 瑪雅曆(古典期;`maya.json`) | 是 | 260 / 365 日週期;13 × 20 |
| 學院科學專區 | 已入庫(路徑 `/science`,含基率模擬器) | 同行評審研究(`science` 層) | 不適用 | 無 |

## 進行中

| 體系 | 狀態 | 主要出處 | Deterministic | 與洛書主軸的連結 |
|---|---|---|---|---|
| Fideler 系(Pythagorean / Platonic 數象) | 進行中 | Fideler, *Jesus Christ, Sun of God*(1993):只取事實與頁碼,不搬原文 | 部分(數值可重算,詮釋不可) | 729 = 27²、365 與 Timaeus 數列;與 `square729` 相連 |

## todo

| 體系 | 狀態 | 主要出處 | Deterministic | 與洛書主軸的連結 |
|---|---|---|---|---|
| 十九年七閏 / Metonic | 已入庫(待校對);已接引擎(`castMetonic`)、曆法卡、AI | Diodorus XII.36.2;金數 / epact(Explanatory Supplement 1961);Meeus 復活節;《後漢書·律曆下》章蔀紀元(`metonic.json`) | 是 | 19 年週期;19 非九宮數,僅作曆法對照;閏月以 lunar-javascript 實數驗證 |
| Iamblichus | todo | Iamblichus 畢氏傳、*Theologumena Arithmeticae* | 是 | 1–10 數象,補 Nicomachus 之後的數神學 |
| Kepler | todo | Kepler, *Harmonices Mundi*(1619) | 是(比例) | 行星比例與幻方行星序 |
| Abjad | todo | 阿拉伯字母數值傳統 | 是 | 字母數化簡後落九宮 |
| Chaldean 數秘 | todo | 迦勒底數字傳統(現代整理) | 是 | 1–8 數系,9 不用;與畢氏對比 |
| 塔羅 | todo | Rider-Waite 等(近代) | 否(抽牌) | 大阿爾卡納 22 張,與 Hebrew 字母數對看 |
| 埃及民用曆 / face | 已入庫(待校對);已接引擎(`castEgyptian`)、曆法卡、AI | Almagest III.7 Nabonassar 紀元(Era Philip、Censorinus 交叉驗證);face 行星主據 Lilly 1647(經維基百科)(`egyptian-calendar.json`) | 是 | 365 日 = 12 × 30 + 5;旬星星名學界未定,未入庫 |
| 藏曆 mewa | todo | 藏曆九宮(mewa);tyme4ts 有藏曆(RabByung)日期,可考慮引入 | 是 | 與九星同為洛書九宮,可直接對讀 |
| Jyotish 27 宿 / Vimshottari | 已入庫(待校對);已接引擎(`castJyotish`)、曆法卡(與八字大運並列)、AI | BPHS 行星大運章 v.12–16(章號 46 / 47 未定);ayanamsa 以 Spica = 180° 即場計(`jyotish.json`) | 是(需星曆) | 27 宿與 27 = 729 的立方根;宮位、分盤、antardasha 未做 |
| 巴比倫六十進制 | todo | 古巴比倫泥版 | 是 | 60 進位與 360 / 365 週期 |
| 廣東話版(yue) | todo | 本站新增語言 `yue`(粵語書面語) | 不適用 | 不適用;需先定文風,再補三語以外字串 |
| 扶抑喜忌引擎(B 方案) | 已入庫 | 滴天髓、子平真詮;本站自建 | 是(規則) | 第三期;本站簡化評分(非古籍原文),tier modern,從格只偵測不推算;補第二條對照軸 |

## 工程 todo

| 項目 | 狀態 | 範圍 / 說明 |
|---|---|---|
| 全 repo 註解 / 文件由簡體轉為繁體(zht) | 已完成 | opencc s2t + 字形統一;`README.zh-Hans.md` 例外(保留簡體)。範圍: `packages/*/src`、`apps/web` 的程式註解與既有 md 文件(如 `docs/knowledge-base.md` 既有段落)。不含 zhs 語言內容:i18n zhs 字串、資料 JSON 的 zhs 欄位、zhs 輸出指令 |
| 廣東話版(yue)locale | todo | 新增 `yue` 語言,需先定文風 |
| 扶抑喜忌引擎(B 方案) | 已入庫 | 第三期;本站簡化評分,tier modern,從格只偵測;與八字喜用神比對 |
| 學院科學專區 | 已入庫 | 路徑 `/science`,含基率模擬器 |
| 易經學院課文 zhs / en 翻譯 | todo | 第二期;現時回落 zht |
