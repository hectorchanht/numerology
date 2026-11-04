# Agrippa 數字刻度表與七十二天使

資料:`packages/knowledge/data/agrippa-scales.json`;驗證:`packages/knowledge/test/agrippa-scales.test.mjs`。
來源係 Agrippa《神秘哲學三書》1651 英譯本(公共領域,Wikisource 頁面),十二宮天使名用 1533 拉丁初版核對。

## 刻度表(Book II 第 4–14 章)

Agrippa 將每個數 1–12 寫成一張「刻度」(scale):由原型界(神名)落到智性界、天界、元素界、人體(小宇宙)同冥界,每層列出剛好 n 項嘅對應。十一冇刻度表;十二有卡巴拉同奧菲斯兩張。

機械檢查:
- 每行項目數 = 該數。
- 每個神名嘅希伯來字母數 = 該數,例如 שדי 3、אלוה ודעת 8、יהוה צבאות 9。十數嘅「collected」名 = יהוה + יהו + יה + י。
- 十二旗 = יהוה 四個字母嘅 12 個唔同排列。
- 七數、十數、十二數嘅行星、輝耀、星座次序同 Book I 對應表同 `agrippa-cabala.json` 一致。

### 原文錯誤同修正

- 九數:Elohim Gibor 印成 אלהים גיבור(10 個字母),要寫 גבור 先係 9 個。
- 十二數:「Holy, Blessed is He」OCR 得 11 個字母,要寫 הקדוש 先夠 12。
- 十二旗:OCR 將 יוהה 印咗兩次、漏咗 ויהה;補返唯一欠缺嘅排列。
- 水瓶座天使:Wikisource 寫 Gabriel / Gabiel,1533 版係 Gambiel,即 Cambiel。
- 七數嘅金星金屬係銅,Book I 第 28 章就寫銀同黃銅/紅銅,書內唔一致,記入 `variance`。

### 1(第 4 章,djvu 頁 203)

神名:name of one simple letter

| 界 | 項目 | 內容 |
|---|---|---|
| 原型界 | one divine essence | God |
| 智性界 | one supreme intelligence | soul of the world |
| 天界 | one king of stars | Sun |
| 元素界 | one subject of all virtues | philosophers' stone |
| 小宇宙(人) | first living, last dying | heart |
| 冥界 | one prince of rebellion | Lucifer |

### 2(第 5 章,djvu 頁 206)

神名:names of God of two letters

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | two intelligible substances | angel · soul |
| 天界 | two great lights | Sun · Moon |
| 元素界 | two elements producing a living soul | earth · water |
| 小宇宙(人) | two principal seats of the soul | heart · brain |
| 冥界 | two chief devils | Behemoth · Leviathan |
| 冥界 | two threats to the damned | weeping · gnashing of teeth |

### 3(第 6 章,djvu 頁 209)

神名:Shaddai `שדי`

| 界 | 項目 | 內容 |
|---|---|---|
| 原型界 | three persons | Father · Son · Holy Ghost |
| 智性界 | three hierarchies of angels | supreme · middle · lowest |
| 智性界 | three degrees of the blessed | innocents · martyrs · confessors |
| 天界 | three quaternions of signs | movable · fixed · common |
| 天界 | three quaternions of houses | angles · succedent · cadent |
| 天界 | three lords of the triplicities | diurnal · nocturnal · partaking |
| 元素界 | three degrees of elements | simple · compound · thrice compound |
| 小宇宙(人) | three parts of man | head · breast · belly |
| 冥界 | three furies | Alecto · Megaera · Tisiphone |
| 冥界 | three infernal judges | Minos · Aeacus · Rhadamanthus |
| 冥界 | three degrees of the damned | wicked · apostates · infidels |

### 4(第 7 章,djvu 頁 213–214)

神名:Tetragrammaton `יהוה`

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | four triplicities of angelic choirs | Seraphim/Cherubim/Thrones · Dominations/Powers/Virtues · Principalities/Archangels/Angels · Innocents/Martyrs/Confessors |
| 智性界 | four angels of the corners of the world | Michael · Raphael · Gabriel · Uriel |
| 智性界 | four rulers of the elements | Seraph · Cherub · Tharsis · Ariel |
| 智性界 | four holy living creatures | lion · eagle · man · calf |
| 智性界 | four evangelists | Mark · John · Matthew · Luke |
| 智性界 | four triplicities of the tribes | Dan/Asher/Naphtali · Judah/Issachar/Zebulun · Manasseh/Benjamin/Ephraim · Reuben/Simeon/Gad |
| 智性界 | four triplicities of apostles | Matthias/Peter/James the elder · Simon/Bartholomew/Matthew · John/Philip/James the younger · Thaddeus/Andrew/Thomas |
| 天界 | four triplicities of signs | Aries/Leo/Sagittarius · Gemini/Libra/Aquarius · Cancer/Scorpio/Pisces · Taurus/Virgo/Capricorn |
| 天界 | stars and planets by element | Mars, Sun · Jupiter, Venus · Saturn, Mercury · fixed stars, Moon |
| 天界 | qualities of the celestial elements | light · diaphanousness · agility · solidity |
| 元素界 | four elements | fire · air · water · earth |
| 元素界 | four qualities | heat · moisture · cold · dryness |
| 元素界 | four seasons | summer · spring · winter · autumn |
| 元素界 | four corners of the world | east · west · north · south |
| 元素界 | four kinds of mixed bodies | animals · plants · metals · stones |
| 元素界 | four kinds of animals | walking · flying · swimming · creeping |
| 元素界 | in plants | seeds · flowers · leaves · roots |
| 元素界 | in metals | gold, iron · copper, tin · quicksilver · lead, silver |
| 元素界 | in stones | bright and burning · light and transparent · clear and congealed · heavy and dark |
| 小宇宙(人) | four elements of man | mind · spirit · soul · body |
| 小宇宙(人) | four powers of the soul | intellect · reason · phantasy · sense |
| 小宇宙(人) | four judiciary powers | faith · science · opinion · experience |
| 小宇宙(人) | four moral virtues | justice · temperance · prudence · fortitude |
| 小宇宙(人) | senses | sight · hearing · taste and smell · touch |
| 小宇宙(人) | four elements of the body | spirit · flesh · humours · bones |
| 小宇宙(人) | fourfold spirit | animal · vital · generative · natural |
| 小宇宙(人) | four humours | choler · blood · phlegm · melancholy |
| 小宇宙(人) | four complexions | violence · nimbleness · dullness · slowness |
| 冥界 | four princes of devils in the elements | Samael · Azazel · Azael · Mahazael |
| 冥界 | four infernal rivers | Phlegethon · Cocytus · Styx · Acheron |
| 冥界 | four princes of spirits at the corners | Oriens · Paymon · Egyn · Amaymon |

### 5(第 8 章,djvu 頁 217)

神名:Elion `אליון`;Elohim `אלהים`;Jhesu (name of Christ) `יהשוה`

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | five intelligible substances | spirits of the first hierarchy (gods) · second hierarchy (intelligences) · third hierarchy (angels sent) · souls of celestial bodies · heroes, blessed souls |
| 天界 | five wandering stars, lords of the terms | Saturn · Jupiter · Mars · Venus · Mercury |
| 元素界 | five kinds of corruptible things | water · air · fire · earth · mixed body |
| 元素界 | five kinds of mixed bodies | animal · plant · metal · stone · plant-animal |
| 小宇宙(人) | five senses | taste · hearing · seeing · touching · smelling |
| 冥界 | five corporeal torments | deadly bitterness · horrible howling · terrible darkness · unquenchable heat · piercing stink |

### 6(第 9 章,djvu 頁 219)

神名:El Gibor `אל גבור`;Eloha `אלוהים`

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | six orders of angels not sent to inferiors | Cherubim · Thrones · Dominations · Powers · Virtues |
| 天界 | six planets wandering in latitude | Saturn · Jupiter · Mars · Venus · Mercury · Moon |
| 元素界 | six substantial qualities of elements | rest · thinness · sharpness · dullness · thickness · motion |
| 小宇宙(人) | six degrees of men | intellect · memory · sense · motion · life · essence |
| 冥界 | six devils, authors of calamities | Acteus · Megalesius · Ormenus · Lycus · Nicon · Mimon |

### 7(第 10 章,djvu 頁 230–231)

神名:Ararita `אראריתא`;Asher Eheieh `אשר אהיה`

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | seven angels before God | Zaphiel · Zadkiel · Camael · Raphael · Haniel · Michael · Gabriel |
| 天界 | seven planets | Saturn · Jupiter · Mars · Sun · Venus · Mercury · Moon |
| 元素界 | birds | lapwing · eagle · vulture · swan · dove · stork · owl |
| 元素界 | fish | cuttlefish · dolphin · pike · sea-calf · thymallus · mullet · sea-cat |
| 元素界 | animals | mole · hart · wolf · lion · goat · ape · cat |
| 元素界 | metals | lead · tin · iron · gold · copper · quicksilver · silver |
| 元素界 | stones | onyx · sapphire · diamond · carbuncle · emerald · agate · crystal |
| 小宇宙(人) | seven integral members | right foot · head · right hand · heart · privy members · left hand · left foot |
| 小宇宙(人) | seven holes of the head | right ear · left ear · right nostril · right eye · left nostril · mouth · left eye |
| 冥界 | seven habitations of the infernals (R. Joseph of Castile) | hell · gates of death · shadow of death · pit of destruction · clay of death · perdition · depth of the earth |

### 8(第 11 章,djvu 頁 233)

神名:Eloha Vaddaath `אלוה ודעת`;Jehovah Vedaath `יהוה ודעת`

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | eight rewards of the blessed | inheritance · incorruption · power · victory · vision of God · grace · a kingdom · joy |
| 天界 | eight visible heavens | starry heaven · Saturn · Jupiter · Mars · Sun · Venus · Mercury · Moon |
| 元素界 | eight particular qualities | dryness of earth · coldness of water · moisture of air · heat of fire · heat of air · moisture of water · dryness of fire · coldness of earth |
| 小宇宙(人) | eight kinds of blessed men | peacemakers · hungering after righteousness · meek · persecuted for righteousness · pure in heart · merciful · poor in spirit · mourners |
| 冥界 | eight rewards of the damned | prison · death · judgement · wrath of God · darkness · indignation · tribulation · anguish |

### 9(第 12 章,djvu 頁 235)

神名:Jehovah Sabaoth `יהוה צבאות`;Jehovah Zidkenu `יהוה צדקנו`;Elohim Gibor `אלהים גבור`

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | nine choirs of angels | Seraphim · Cherubim · Thrones · Dominations · Powers · Virtues · Principalities · Archangels · Angels |
| 智性界 | nine angels ruling the heavens | Metatron · Ophaniel · Zaphkiel · Zadkiel · Camael · Raphael · Haniel · Michael · Gabriel |
| 天界 | nine movable spheres | primum mobile · starry heaven · Saturn · Jupiter · Mars · Sun · Venus · Mercury · Moon |
| 元素界 | nine stones of the choirs | sapphire · emerald · carbuncle · beryl · onyx · chrysolite · jasper · topaz · sardis |
| 小宇宙(人) | nine senses inward and outward | memory · cogitative · imaginative · common sense · hearing · seeing · smelling · tasting · touching |
| 冥界 | nine orders of devils | false gods · lying spirits · vessels of iniquity · revengers of wickedness · jugglers · aerial powers · furies · sifters (triers) · tempters (ensnarers) |

### 10(第 13 章,djvu 頁 239)

神名:Jehovah collected `יהוהיהויהי`;Jehovah extended `יוד הא ואו הא`;Elohim Sabaoth `אלהים צבאות`

| 界 | 項目 | 內容 |
|---|---|---|
| 原型界 | ten names of God | Eheieh · Yah / Iod Jehovah · Jehovah Elohim · El · Elohim Gibor · Eloha · Jehovah Sabaoth · Elohim Sabaoth · Shaddai · Adonai Melech |
| 智性界 | ten orders (Dionysius) | Seraphim · Cherubim · Thrones · Dominations · Powers · Virtues · Principalities · Archangels · Angels · blessed souls |
| 智性界 | ten orders (tradition) | Haioth ha-Kodesh · Ophanim · Aralim · Hashmalim · Seraphim · Malachim · Elohim · Bene Elohim · Cherubim · Issim |
| 智性界 | ten angels ruling | Metatron · Jophiel · Zaphkiel · Zadkiel · Camael · Raphael · Haniel · Michael · Gabriel · soul of Messiah |
| 天界 | ten spheres | Rashith ha-Gilgalim (primum mobile) · Mazloth (zodiac) · Shabbathai (Saturn) · Tzedek (Jupiter) · Madim (Mars) · Shemesh (Sun) · Nogah (Venus) · Kokab (Mercury) · Levanah (Moon) · Holem Yesodoth (elements) |
| 元素界 | ten animals consecrated to the gods | dove · lizard · dragon · eagle · horse · lion · man · genitals · bull · lamb |
| 小宇宙(人) | ten inward parts of man | spirit · brain · spleen · liver · gall · heart · kidneys · lungs · genitals · matrix |
| 冥界 | ten orders of the damned | false gods · lying spirits · vessels of iniquity · revengers of wickedness · jugglers · aerial powers · furies · sifters (triers) · tempters (ensnarers) · wicked souls bearing rule |

### 12(第 14 章,djvu 頁 243–244)

神名:Holy, Blessed is He `הקדוש ברוך הוא`;Father, Son, Holy Ghost `אב בן ורוח הקדש`

| 界 | 項目 | 內容 |
|---|---|---|
| 智性界 | twelve orders of blessed spirits | Seraphim · Cherubim · Thrones · Dominations · Powers · Virtues · Principalities · Archangels · Angels · Innocents · Martyrs · Confessors |
| 智性界 | twelve angels ruling the signs | Malchidiel · Asmodel · Ambriel · Muriel · Verchiel · Hamaliel · Zuriel · Barbiel · Adnachiel · Hanael · Cambiel · Barchiel |
| 智性界 | twelve tribes | Dan · Reuben · Judah · Manasseh · Asher · Simeon · Issachar · Benjamin · Naphtali · Gad · Zebulun · Ephraim |
| 智性界 | twelve prophets | Malachi · Haggai · Zechariah · Amos · Hosea · Micah · Jonah · Obadiah · Zephaniah · Nahum · Habakkuk · Joel |
| 智性界 | twelve apostles | Matthias · Thaddeus · Simon · John · Peter · Andrew · Bartholomew · Philip · James the elder · Thomas · Matthew · James the younger |
| 天界 | twelve signs | Aries · Taurus · Gemini · Cancer · Leo · Virgo · Libra · Scorpio · Sagittarius · Capricorn · Aquarius · Pisces |
| 元素界 | twelve months | March · April · May · June · July · August · September · October · November · December · January · February |
| 元素界 | twelve plants | sang (bloodwort) · upright vervain · bending vervain · comfrey · lady's seal · calamint · scorpion-grass · mugwort · pimpernel · dock · dragonwort · aristolochia |
| 元素界 | twelve stones | sardonyx · carnelian · topaz · chalcedony · jasper · emerald · beryl · amethyst · jacinth · chrysoprase · crystal · sapphire |
| 小宇宙(人) | twelve principal members | head · neck · arms · breast · heart · belly · kidneys · genitals · hams · knees · legs · feet |
| 冥界 | twelve degrees of the damned | false gods · lying spirits · vessels of iniquity · revengers of wickedness · jugglers · aerial powers · furies · sifters (triers) · tempters (ensnarers) · witches · apostates · infidels |

### 十二(奧菲斯)

| 界 | 項目 | Aries | Taurus | Gemini | Cancer | Leo | Virgo | Libra | Scorpio | Sagittarius | Capricorn | Aquarius | Pisces |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 智性界 | twelve deities | Pallas | Venus | Phoebus | Mercury | Jupiter | Ceres | Vulcan | Mars | Diana | Vesta | Juno | Neptune |
| 元素界 | twelve consecrated birds | owl | dove | cock | ibis | eagle | sparrow | goose | magpie | daw | heron | peacock | swan |
| 元素界 | twelve consecrated beasts | she-goat | he-goat | bull | dog | hart | sow | ass | wolf | hind | lion | sheep | horse |
| 元素界 | twelve consecrated trees | olive | myrtle | laurel | hazel | aesculus (oak) | apple | box | dogwood | palm | pine | buckthorn | elm |
| 小宇宙(人) | twelve members | head | neck | arms | breast | heart | belly | kidneys | genitals | hams | knees | legs | feet |

## 七十二天使(Shem ha-Mephorash,Book III 第 25 章)

《出埃及記》14:19、14:20、14:21 三節經文各有 72 個希伯來字母。第 k 個名 = 第 19 節第 k 個字母 + 第 20 節倒數第 k 個字母 + 第 21 節第 k 個字母;字尾形改寫成普通形。天使名 = 三字母組 + יה(-iah)或 + אל(-el)。

Wikisource 嘅 72 名表冇希伯來字,所以三字母組係由經文推算,唔係抄錄。test 逐個重新推算,亦核對 Agrippa 拼法嘅字尾同 יה / אל 對應。第 13 個 1651 印成 Ieiazel(同第 40 個重複),三字母組 יזל 顯示應該係 Iezalel。

| # | 名 | 三字母 | 全名 |
|---|---|---|---|
| 1 | Vehuiah | והו | והויה |
| 2 | Ieliel | ילי | יליאל |
| 3 | Sitael | סיט | סיטאל |
| 4 | Elemiah | עלמ | עלמיה |
| 5 | Mahasiah | מהש | מהשיה |
| 6 | Lelahel | ללה | ללהאל |
| 7 | Achaiah | אכא | אכאיה |
| 8 | Cahethel | כהת | כהתאל |
| 9 | Haziel | הזי | הזיאל |
| 10 | Aladiah | אלד | אלדיה |
| 11 | Lauiah | לאו | לאויה |
| 12 | Hahaiah | ההע | ההעיה |
| 13 | Ieiazel | יזל | יזלאל |
| 14 | Mebahel | מבה | מבהאל |
| 15 | Hariel | הרי | הריאל |
| 16 | Hakamiah | הקמ | הקמיה |
| 17 | Leviah | לאו | לאויה |
| 18 | Caliel | כלי | כליאל |
| 19 | Leuuiah | לוו | לוויה |
| 20 | Pahaliah | פהל | פהליה |
| 21 | Nelchael | נלכ | נלכאל |
| 22 | Ieiaiel | ייי | יייאל |
| 23 | Melahel | מלה | מלהאל |
| 24 | Hahuiah | חהו | חהויה |
| 25 | Nithhaiah | נתה | נתהיה |
| 26 | Haaiah | האא | האאיה |
| 27 | Ierathel | ירת | ירתאל |
| 28 | Seehiah | שאה | שאהיה |
| 29 | Reiiel | ריי | רייאל |
| 30 | Omael | אומ | אומאל |
| 31 | Lecabel | לכב | לכבאל |
| 32 | Vasariah | ושר | ושריה |
| 33 | Iehuiah | יחו | יחויה |
| 34 | Lehahiah | להח | להחיה |
| 35 | Chavakiah | כוק | כוקיה |
| 36 | Monadel | מנד | מנדאל |
| 37 | Aniel | אני | אניאל |
| 38 | Haamiah | חעמ | חעמיה |
| 39 | Rehael | רהע | רהעאל |
| 40 | Ieiazel | ייז | ייזאל |
| 41 | Hahahel | ההה | הההאל |
| 42 | Michael | מיכ | מיכאל |
| 43 | Vevaliah | וול | ווליה |
| 44 | Ielahiah | ילה | ילהיה |
| 45 | Sealiah | סאל | סאליה |
| 46 | Ariel | ערי | עריאל |
| 47 | Asaliah | עשל | עשליה |
| 48 | Mihael | מיה | מיהאל |
| 49 | Vehuel | והו | והואל |
| 50 | Daniel | דני | דניאל |
| 51 | Hahasiah | החש | החשיה |
| 52 | Imamiah | עממ | עממיה |
| 53 | Nanael | ננא | ננאאל |
| 54 | Nithael | נית | ניתאל |
| 55 | Mebahiah | מבה | מבהיה |
| 56 | Poiel | פוי | פויאל |
| 57 | Nemamiah | נממ | נממיה |
| 58 | Ieialel | ייל | יילאל |
| 59 | Harahel | הרח | הרחאל |
| 60 | Mizrael | מצר | מצראל |
| 61 | Umabel | ומב | ומבאל |
| 62 | Iahhel | יהה | יההאל |
| 63 | Annauel | ענו | ענואל |
| 64 | Mehekiel | מחי | מחיאל |
| 65 | Damabiah | דמב | דמביה |
| 66 | Meniel | מנק | מנקאל |
| 67 | Eiael | איע | איעאל |
| 68 | Habuiah | חבו | חבויה |
| 69 | Roehel | ראה | ראהאל |
| 70 | Iibamiah | יבמ | יבמיה |
| 71 | Haiaiel | היי | הייאל |
| 72 | Mumiah | מומ | מומיה |
