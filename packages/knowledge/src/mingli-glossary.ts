import type { GlossaryTerm } from "./yijing.js";

/* ── 命理術語釋義(八字 × 紫微,點按釋義共用) ────────────────────────────
 * 與 YIJING_GLOSSARY 同一 GlossaryTerm 形狀 { term, zht, zhs, en }。
 * 釋義均為本站自寫(一句話、白話),不引古籍原文。
 * zht 為香港書面繁體。
 */

/** 八字 × 紫微核心術語(短釋義,供 UI 點按釋義用) */
export const MINGLI_GLOSSARY: GlossaryTerm[] = [
  /* ── 十神 ── */
  { term: "正官", zht: "剋日主而陰陽相異的十神,代表規矩、上司與正統的事業路。", zhs: "克日主而阴阳相异的十神,代表规矩、上司与正统的事业路。", en: "Direct Officer — controls Day Master with opposite polarity; rules, superiors, and the conventional career path." },
  { term: "七殺", zht: "剋日主而陰陽相同的十神,性急而有魄力;在紫微斗數中亦為十四主星之一,主開創與衝勁。", zhs: "克日主而阴阳相同的十神,性急而有魄力;在紫微斗数中亦为十四主星之一,主开创与冲劲。", en: "Seven Killings — controls Day Master with same polarity; bold and forceful; also one of the 14 Ziwei major stars, ruling pioneering drive." },
  { term: "正印", zht: "生日主而陰陽相異的十神,代表貴人、學業與庇護。", zhs: "生日主而阴阳相异的十神,代表贵人、学业与庇护。", en: "Direct Resource — nourishes Day Master with opposite polarity; mentors, study, and protection." },
  { term: "偏印", zht: "生日主而陰陽相同的十神,又名梟神,主偏門學問與冷門專長,過旺則想多做少。", zhs: "生日主而阴阳相同的十神,又名枭神,主偏门学问与冷门专长,过旺则想多做少。", en: "Indirect Resource — nourishes Day Master with same polarity; niche knowledge and unusual talents; in excess it breeds overthinking." },
  { term: "正財", zht: "日主所剋而陰陽相異的十神,代表正職收入與穩健理財。", zhs: "日主所克而阴阳相异的十神,代表正职收入与稳健理财。", en: "Direct Wealth — controlled by Day Master with opposite polarity; salary income and steady money management." },
  { term: "偏財", zht: "日主所剋而陰陽相同的十神,代表副業、投資與意外之財,來得快去得也快。", zhs: "日主所克而阴阳相同的十神,代表副业、投资与意外之财,来得快去得也快。", en: "Indirect Wealth — controlled by Day Master with same polarity; side income, investments, and windfalls — fast come, fast go." },
  { term: "食神", zht: "日主所生而陰陽相異的十神,主才華發揮、口福與安穩心態。", zhs: "日主所生而阴阳相异的十神,主才华发挥、口福与安稳心态。", en: "Eating God — produced by Day Master with opposite polarity; talent expressed, enjoyment of food, and an easygoing mind." },
  { term: "傷官", zht: "日主所生而陰陽相同的十神,主聰明外露與反叛創意,剋正官故與體制相沖。", zhs: "日主所生而阴阳相同的十神,主聪明外露与反叛创意,克正官故与体制相冲。", en: "Hurting Officer — produced by Day Master with same polarity; visible cleverness and rebellious creativity; clashes with Direct Officer, hence friction with institutions." },
  { term: "比肩", zht: "與日主同五行同陰陽的十神,代表兄弟姊妹、朋友與同輩競爭。", zhs: "与日主同五行同阴阳的十神,代表兄弟姐妹、朋友与同辈竞争。", en: "Friend — same element and polarity as Day Master; siblings, friends, and peer competition." },
  { term: "劫財", zht: "與日主同五行而陰陽相異的十神,主爭奪與破財,亦代表行動力與膽識。", zhs: "与日主同五行而阴阳相异的十神,主争夺与破财,亦代表行动力与胆识。", en: "Rob Wealth — same element but opposite polarity to Day Master; rivalry and money loss, but also drive and daring." },
  /* ── 十二宮 ── */
  { term: "命宮", zht: "紫微斗數十二宮之首,看先天性格與一生格局的主軸。", zhs: "紫微斗数十二宫之首,看先天性格与一生格局的主轴。", en: "Life palace — the first of the 12 Ziwei palaces; innate character and the axis of one's life pattern." },
  { term: "兄弟", zht: "看兄弟姊妹緣分與合夥關係的宮位,部分流派亦看母親。", zhs: "看兄弟姐妹缘分与合伙关系的宫位,部分流派亦看母亲。", en: "Siblings palace — sibling bonds and partnerships; mother in some schools." },
  { term: "夫妻", zht: "看配偶特質與婚姻互動模式的宮位。", zhs: "看配偶特质与婚姻互动模式的宫位。", en: "Spouse palace — partner traits and marriage dynamics." },
  { term: "子女", zht: "看子女緣分、晚輩與創作產出的宮位。", zhs: "看子女缘分、晚辈与创作产出的宫位。", en: "Children palace — children, juniors, and creative output." },
  { term: "財帛", zht: "看賺錢能力與理財手法的宮位,重「如何得財」多於存款數字。", zhs: "看赚钱能力与理财手法的宫位,重「如何得财」多于存款数字。", en: "Wealth palace — earning ability and money habits; more about how wealth comes than the balance itself." },
  { term: "疾厄", zht: "看先天體質弱點與健康走勢的宮位。", zhs: "看先天体质弱点与健康走势的宫位。", en: "Health palace — constitutional weak spots and health trends." },
  { term: "遷移", zht: "看外出運、在外人緣與離鄉發展吉凶的宮位。", zhs: "看外出运、在外人缘与离乡发展吉凶的宫位。", en: "Travel palace — luck away from home, popularity outside, and relocation prospects." },
  { term: "僕役", zht: "又名交友宮,看朋友、下屬與人際網絡的宮位。", zhs: "又名交友宫,看朋友、下属与人际网络的宫位。", en: "Servants palace (Friends) — friends, subordinates, and one's network." },
  { term: "官祿", zht: "又名事業宮,看事業方向、職場表現與名聲的宮位。", zhs: "又名事业宫,看事业方向、职场表现与名声的宫位。", en: "Career palace — career direction, workplace performance, and reputation." },
  { term: "田宅", zht: "看置業運、居住環境與家族資產的宮位。", zhs: "看置业运、居住环境与家族资产的宫位。", en: "Property palace — real-estate luck, living environment, and family assets." },
  { term: "福德", zht: "看精神生活、嗜好與晚年福分的宮位,亦是財帛的氣數位。", zhs: "看精神生活、嗜好与晚年福分的宫位,亦是财帛的气数位。", en: "Blessings palace — inner life, hobbies, and later-year comfort; the qi position of wealth." },
  { term: "父母", zht: "看父母緣分、長輩提攜與早年家境的宮位。", zhs: "看父母缘分、长辈提携与早年家境的宫位。", en: "Parents palace — parents, elder mentors, and early family background." },
  /* ── 十四主星(七殺見十神條) ── */
  { term: "紫微", zht: "十四主星之首,帝星,主領導、尊貴與掌控全局的能力。", zhs: "十四主星之首,帝星,主领导、尊贵与掌控全局的能力。", en: "Ziwei — chief of the 14 major stars, the Emperor star; leadership, dignity, and command." },
  { term: "天機", zht: "主星之一,主智謀、變動與策劃,坐命者多思多慮。", zhs: "主星之一,主智谋、变动与策划,坐命者多思多虑。", en: "Tianji — a major star of strategy, change, and planning; a thinking, restless placement." },
  { term: "太陽", zht: "主星之一,中天之主,主光明、名聲與為人付出,利男性貴人。", zhs: "主星之一,中天之主,主光明、名声与为人付出,利男性贵人。", en: "Taiyang — the Sun; light, reputation, and selfless giving; favors male mentors." },
  { term: "武曲", zht: "主星之一,財星,主剛毅、執行力與理財,有將星之性。", zhs: "主星之一,财星,主刚毅、执行力与理财,有将星之性。", en: "Wuqu — the wealth star; resolve, execution, and money sense; a general's temperament." },
  { term: "天同", zht: "主星之一,福星,主和氣、享受與安逸,逢煞則意志消沉。", zhs: "主星之一,福星,主和气、享受与安逸,逢煞则意志消沉。", en: "Tiantong — the fortune star; harmony, enjoyment, and ease; weakens under affliction." },
  { term: "廉貞", zht: "主星之一,次桃花星,主原則、操守與情感濃烈,亦主官非風險。", zhs: "主星之一,次桃花星,主原则、操守与情感浓烈,亦主官非风险。", en: "Lianzhen — principles, integrity, and intense feelings; also carries legal-risk overtones." },
  { term: "天府", zht: "主星之一,南斗之首,庫星,主守成、儲蓄與管理才能。", zhs: "主星之一,南斗之首,库星,主守成、储蓄与管理才能。", en: "Tianfu — head of the Southern Dipper, the treasury star; conservation, saving, and management." },
  { term: "太陰", zht: "主星之一,月亮,主柔和、內斂與不動產,利女性貴人。", zhs: "主星之一,月亮,主柔和、内敛与不动产,利女性贵人。", en: "Taiyin — the Moon; gentleness, reserve, and property; favors female mentors." },
  { term: "貪狼", zht: "主星之一,第一桃花星,主慾望、才藝與多角化發展,亦是解厄之星。", zhs: "主星之一,第一桃花星,主欲望、才艺与多角化发展,亦是解厄之星。", en: "Tanlang — desire, artistry, and diversification; the chief romance star, also a problem-solver." },
  { term: "巨門", zht: "主星之一,暗星,主口才、是非與研究,開口得財亦招口舌。", zhs: "主星之一,暗星,主口才、是非与研究,开口得财亦招口舌。", en: "Jumen — the dark star; eloquence, gossip, and research; speech earns money but invites dispute." },
  { term: "天相", zht: "主星之一,印星,主輔佐、協調與服務熱忱,為人排難解紛。", zhs: "主星之一,印星,主辅佐、协调与服务热忱,为人排难解纷。", en: "Tianxiang — the seal star; assisting, mediating, and devoted service." },
  { term: "天梁", zht: "主星之一,蔭星,主清高、庇蔭與逢凶化吉,有老大哥格局。", zhs: "主星之一,荫星,主清高、庇荫与逢凶化吉,有老大哥格局。", en: "Tianliang — the sheltering star; nobility, protection, and turning danger into safety." },
  { term: "破軍", zht: "主星之一,耗星,主破壞與重建,先破後立,適合開創不適合守成。", zhs: "主星之一,耗星,主破坏与重建,先破后立,适合开创不适合守成。", en: "Pojun — the consuming star; destruction then rebuilding; suited to pioneering, not conserving." },
  /* ── 四化 ── */
  { term: "化祿", zht: "四化之一,主緣分、順利與財祿增加,是星曜的吉化。", zhs: "四化之一,主缘分、顺利与财禄增加,是星曜的吉化。", en: "Hua Lu — one of the Four Transformations; more affinity, smoothness, and wealth; the auspicious change." },
  { term: "化權", zht: "四化之一,主掌權、企圖心與競爭力提升,亦主爭執。", zhs: "四化之一,主掌权、企图心与竞争力提升,亦主争执。", en: "Hua Quan — power, ambition, and competitiveness; can also bring contention." },
  { term: "化科", zht: "四化之一,主名聲、文憑與貴人解厄,吉而不驟。", zhs: "四化之一,主名声、文凭与贵人解厄,吉而不骤。", en: "Hua Ke — reputation, credentials, and rescue by mentors; gentle rather than dramatic luck." },
  { term: "化忌", zht: "四化之一,主阻礙、虧欠與執念,是四化中唯一的凶化。", zhs: "四化之一,主阻碍、亏欠与执念,是四化中唯一的凶化。", en: "Hua Ji — obstruction, unpaid emotional debts, and obsession; the only inauspicious one of the four." },
  /* ── 核心概念 ── */
  { term: "大運", zht: "八字每十年一步的運程,看該階段人生的主旋律。", zhs: "八字每十年一步的运程,看该阶段人生的主旋律。", en: "Major luck cycle — each step spans ten years; the theme of that life stage." },
  { term: "流年", zht: "每一年的干支運程,與大運疊加看當年吉凶。", zhs: "每一年的干支运程,与大运叠加看当年吉凶。", en: "Annual luck — the stem-branch of each year, read together with the major cycle." },
  { term: "大限", zht: "紫微斗數每十年一步的運限,相當於八字的大運。", zhs: "紫微斗数每十年一步的运限,相当于八字的大运。", en: "Decadal luck — Ziwei's ten-year periods, the counterpart of BaZi major cycles." },
  { term: "命主", zht: "由命宮地支推出的星曜,輔助看先天性格傾向。", zhs: "由命宫地支推出的星曜,辅助看先天性格倾向。", en: "Life ruler — a star derived from the Life palace's branch; a secondary read on innate character." },
  { term: "身主", zht: "由生年地支推出的星曜,輔助看後天努力方向。", zhs: "由生年地支推出的星曜,辅助看后天努力方向。", en: "Body ruler — a star derived from the birth-year branch; a secondary read on acquired effort." },
  { term: "身宮", zht: "與命宮同盤的另一重心,看中年以後人生重心的轉移。", zhs: "与命宫同盘的另一重心,看中年以后人生重心的转移。", en: "Body palace — the chart's second center of gravity; where life's focus shifts after middle age." },
  { term: "三方四正", zht: "本宮加對宮與三合兩宮,四個宮位合看一件事的完整格局。", zhs: "本宫加对宫与三合两宫,四个宫位合看一件事的完整格局。", en: "Three-directions-four-orthogonals — a palace plus its opposite and trine palaces, read together for the full picture." },
  { term: "空宮", zht: "宮內無主星的宮位,判斷時借對宮主星來參考。", zhs: "宫内无主星的宫位,判断时借对宫主星来参考。", en: "Empty palace — a palace with no major stars; borrow the opposite palace's stars for interpretation." },
  { term: "借星", zht: "空宮取對宮主星來用的技法,力量打折但方向可參考。", zhs: "空宫取对宫主星来用的技法,力量打折但方向可参考。", en: "Star borrowing — using the opposite palace's stars for an empty palace; weaker, but directionally useful." },
  { term: "日主", zht: "八字中出生日的天干,代表命主本人,是全盤論斷的基準點。", zhs: "八字中出生日的天干,代表命主本人,是全盘论断的基准点。", en: "Day Master — the day stem of a BaZi chart; the self, and the reference point for the whole reading." },
  { term: "月令", zht: "出生月份的地支,決定季節氣候,是判斷日主旺衰的首要依據。", zhs: "出生月份的地支,决定季节气候,是判断日主旺衰的首要依据。", en: "Month branch — the earthly branch of the birth month; sets the season and is the primary gauge of Day Master strength." },
  { term: "調候", zht: "依季節冷暖燥濕取用神的技法,寒命取暖、熱命取涼。", zhs: "依季节冷暖燥湿取用神的技法,寒命取暖、热命取凉。", en: "Climate balancing — choosing the favorable element by seasonal temperature; warm the cold chart, cool the hot one." },
  { term: "用神", zht: "命局最需要的五行,用來補救失衡,是論命的抓手。", zhs: "命局最需要的五行,用来补救失衡,是论命的抓手。", en: "Useful god — the element the chart needs most to restore balance; the handle of the reading." },
  { term: "喜用神", zht: "用神與喜神的合稱,泛指對命局有利的五行。", zhs: "用神与喜神的合称,泛指对命局有利的五行。", en: "Favorable elements — the useful god plus the pleasing god; collectively, the elements that help the chart." },
  { term: "忌神", zht: "對命局有害的五行,大運流年逢之多有阻滯。", zhs: "对命局有害的五行,大运流年逢之多有阻滞。", en: "Taboo god — the element that harms the chart; its luck cycles bring obstruction." },
  { term: "神煞", zht: "附在干支上的吉凶符號(如天乙貴人、桃花),作輔助參考,不作主論。", zhs: "附在干支上的吉凶符号(如天乙贵人、桃花),作辅助参考,不作主论。", en: "Symbolic stars — auxiliary markers on stems and branches (e.g. 天乙貴人); supporting detail, never the main argument." },
  { term: "空亡", zht: "旬中落空的兩個地支,所臨宮位或十神主缺失、落空或緣分薄。", zhs: "旬中落空的两个地支,所临宫位或十神主缺失、落空或缘分薄。", en: "Void — the two branches missing from the ten-day cycle; whatever it touches turns out hollow or thin." },
  { term: "納音", zht: "六十甲子配五行之音(如海中金),古法論命的五行取象之一。", zhs: "六十甲子配五行之音(如海中金),古法论命的五行取象之一。", en: "Na Yin — the elemental 'sound' of each of the 60 stem-branch pairs (e.g. 海中金); an old-school elemental image." },
  { term: "刑", zht: "地支間的一種不利關係(如子卯刑),主摩擦、糾結與付出無報。", zhs: "地支间的一种不利关系(如子卯刑),主摩擦、纠结与付出无报。", en: "Punishment — a harsh branch interaction (e.g. 子卯); friction, entanglement, and thankless effort." },
  { term: "沖", zht: "地支六沖(如子午沖),主變動、衝突與人事物的大洗牌。", zhs: "地支六冲(如子午冲),主变动、冲突与人事物的洗牌。", en: "Clash — the six branch clashes (e.g. 子午); upheaval, conflict, and reshuffling." },
  { term: "合", zht: "干支間的相合(如六合、三合),主結合、和好與力量匯聚。", zhs: "干支间的相合(如六合、三合),主结合、和好与力量汇聚。", en: "Combination — stems and branches joining (e.g. 六合, 三合); union, reconciliation, pooled strength." },
  { term: "會", zht: "三合會局(如亥卯未會木),三支齊聚一方之氣,是力量最強的合。", zhs: "三合会局(如亥卯未会木),三支齐聚一方之气,是力量最强的合。", en: "Assembly — the triple-branch gatherings (e.g. 亥卯未 → wood); the strongest form of combination." },
  { term: "天干", zht: "甲乙丙丁戊己庚辛壬癸十個符號,主外顯、主動的力量。", zhs: "甲乙丙丁戊己庚辛壬癸十个符号,主外显、主动的力量。", en: "Heavenly stems — the ten 甲乙丙丁戊己庚辛壬癸 symbols; outward, active forces." },
  { term: "地支", zht: "子丑寅卯辰巳午未申酉戌亥十二個符號,主內藏、靜態的根基。", zhs: "子丑寅卯辰巳午未申酉戌亥十二个符号,主内藏、静态的根基。", en: "Earthly branches — the twelve 子丑寅卯辰巳午未申酉戌亥 symbols; hidden, structural roots." },
  { term: "十神", zht: "以日主為基準,十天干配陰陽得出的十種關係(正官七殺等),論六親與心性的總框架。", zhs: "以日主为基准,十天干配阴阳得出的十种关系(正官七杀等),论六亲与心性的总框架。", en: "Ten Gods — the ten stem relationships measured from the Day Master; the framework for people and character." },
  { term: "格局", zht: "命局的結構定式(如正官格、從財格),先定格局再論喜忌。", zhs: "命局的结构定式(如正官格、从财格),先定格局再论喜忌。", en: "Chart structure — the named pattern of a chart (e.g. 正官格); establish it before judging favorable elements." },
  { term: "旺衰", zht: "日主得令得地與否的強弱評估,是取用神的第一步。", zhs: "日主得令得地与否的强弱评估,是取用神的第一步。", en: "Strength — how strong the Day Master is (seasonal command, rootedness); step one of choosing the useful god." },
];
