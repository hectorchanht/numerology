// AUTO-GENERATED from data/{jyotish,egyptian-calendar,metonic}.json — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改對應 JSON 後重新生成本文件。
const CALENDARS_DATA = {
  "jyotish": {
    "meta": {
      "name": "Jyotish:27 宿、Vimshottari 大運、Lahiri(Chitrapaksha)ayanamsa",
      "schema": "nakshatras:[{n,iast,devanagari,lord}] ; vimshottari:{order,years,total,balanceRule,yearDays,yearDaysAlt} ; ayanamsa",
      "source": "宿名、天城文、宿主:英文維基百科 Nakshatra(padas 表);運序與年數:英文維基百科 Dasha (astrology);首運餘數規則:Brihat Parashara Hora Shastra「行星大運」章 v.12–16(Santhanam 英譯,經 barbarapijan.com 轉引;章號 46 或 47 各家不同)。ayanamsa 定義:英文維基百科 Ayanamsa(Chitrapaksha:Spica 位於恆星黃經 180°)。",
      "version": "0.1.0",
      "reviewed": false,
      "reviewNote": "BPHS 無已核實的公有領域英譯,只作章節定位,不錄原文。年長 365.25 日為維基百科所列常用值,另有 360 日 savana 年一說。ayanamsa 由 Spica 位置即場計算,與官方 Lahiri 表可差數角分。",
      "tier": "classical"
    },
    "nakshatras": [
      {
        "n": 1,
        "iast": "Aśvinī",
        "devanagari": "अश्विनी",
        "lord": "Ketu"
      },
      {
        "n": 2,
        "iast": "Bharaṇī",
        "devanagari": "भरणी",
        "lord": "Venus"
      },
      {
        "n": 3,
        "iast": "Kṛttikā",
        "devanagari": "कृत्तिका",
        "lord": "Sun"
      },
      {
        "n": 4,
        "iast": "Rohiṇī",
        "devanagari": "रोहिणी",
        "lord": "Moon"
      },
      {
        "n": 5,
        "iast": "Mṛgaśīrṣā",
        "devanagari": "मृगशीर्षा",
        "lord": "Mars"
      },
      {
        "n": 6,
        "iast": "Ārdrā",
        "devanagari": "आर्द्रा",
        "lord": "Rahu"
      },
      {
        "n": 7,
        "iast": "Punarvasu",
        "devanagari": "पुनर्वसु",
        "lord": "Jupiter"
      },
      {
        "n": 8,
        "iast": "Puṣya",
        "devanagari": "पुष्य",
        "lord": "Saturn"
      },
      {
        "n": 9,
        "iast": "Āśleṣā",
        "devanagari": "आश्लेषा",
        "lord": "Mercury"
      },
      {
        "n": 10,
        "iast": "Maghā",
        "devanagari": "मघा",
        "lord": "Ketu"
      },
      {
        "n": 11,
        "iast": "Pūrva Phālgunī",
        "devanagari": "पूर्व फाल्गुनी",
        "lord": "Venus"
      },
      {
        "n": 12,
        "iast": "Uttara Phālgunī",
        "devanagari": "उत्तर फाल्गुनी",
        "lord": "Sun"
      },
      {
        "n": 13,
        "iast": "Hasta",
        "devanagari": "हस्त",
        "lord": "Moon"
      },
      {
        "n": 14,
        "iast": "Chitrā",
        "devanagari": "चित्रा",
        "lord": "Mars"
      },
      {
        "n": 15,
        "iast": "Svāti",
        "devanagari": "स्वाति",
        "lord": "Rahu"
      },
      {
        "n": 16,
        "iast": "Viśākhā",
        "devanagari": "विशाखा",
        "lord": "Jupiter"
      },
      {
        "n": 17,
        "iast": "Anurādhā",
        "devanagari": "अनुराधा",
        "lord": "Saturn"
      },
      {
        "n": 18,
        "iast": "Jyeṣṭhā",
        "devanagari": "ज्येष्ठा",
        "lord": "Mercury"
      },
      {
        "n": 19,
        "iast": "Mūla",
        "devanagari": "मूल",
        "lord": "Ketu"
      },
      {
        "n": 20,
        "iast": "Pūrva Aṣāḍhā",
        "devanagari": "पूर्वाषाढ़ा",
        "lord": "Venus"
      },
      {
        "n": 21,
        "iast": "Uttara Aṣāḍhā",
        "devanagari": "उत्तराषाढ़ा",
        "lord": "Sun"
      },
      {
        "n": 22,
        "iast": "Śravaṇa",
        "devanagari": "श्रवण",
        "lord": "Moon"
      },
      {
        "n": 23,
        "iast": "Dhaniṣṭhā",
        "devanagari": "धनिष्ठा",
        "lord": "Mars"
      },
      {
        "n": 24,
        "iast": "Śatabhiṣā",
        "devanagari": "शतभिषा",
        "lord": "Rahu"
      },
      {
        "n": 25,
        "iast": "Pūrva Bhādrapadā",
        "devanagari": "पूर्वभाद्रपदा",
        "lord": "Jupiter"
      },
      {
        "n": 26,
        "iast": "Uttara Bhādrapadā",
        "devanagari": "उत्तरभाद्रपदा",
        "lord": "Saturn"
      },
      {
        "n": 27,
        "iast": "Revatī",
        "devanagari": "रेवती",
        "lord": "Mercury"
      }
    ],
    "vimshottari": {
      "order": [
        "Ketu",
        "Venus",
        "Sun",
        "Moon",
        "Mars",
        "Rahu",
        "Jupiter",
        "Saturn",
        "Mercury"
      ],
      "years": {
        "Ketu": 7,
        "Venus": 20,
        "Sun": 6,
        "Moon": 10,
        "Mars": 7,
        "Rahu": 18,
        "Jupiter": 16,
        "Saturn": 19,
        "Mercury": 17
      },
      "total": 120,
      "balanceRule": "首運餘年 = 該宿宿主運年數 × 月亮在宿內未行之弧 / 13°20′",
      "locator": "BPHS 行星大運章 v.12–16",
      "yearDays": 365.25,
      "yearDaysAlt": 360
    },
    "ayanamsa": {
      "name": "Lahiri (Chitrapaksha)",
      "definition": "Spica(Chitra)恆星黃經 = 180°",
      "spica": "見 behenian-stars.json(Spica,α Vir,J2000 Hipparcos)",
      "checks": {
        "j2000Wikipedia": 23.84,
        "value1900": "22°27′37.7″(saravali.github.io;另有 22°27′59″、22°27′55″ 兩說)"
      }
    }
  },
  "egyptian": {
    "meta": {
      "name": "埃及民用曆(Nabonassar 紀元)與三十六 face(旬)行星主",
      "schema": "civil:{months,monthDays,epagomenal,epoch} ; faces:[{sign,rulers[3]}]",
      "source": "民用曆:365 日 = 12 × 30 + 5,不置閏(Ptolemy《天文學大成》各表通用);月名拼法依 Utrecht 大學 Almagest 曆表頁(webspace.science.uu.nl/~gent0113/astro/almagestephemeris_main.htm);紀元 Nabonassar 元年 Thoth 1 = 公元前 747 年 2 月 26 日正午(儒略曆),Almagest III.7,經英文維基百科 Nabonassar 與上述 Utrecht 頁轉引。Face 行星主:迦勒底序由白羊 0° 火星起,據英文維基百科 Decan (astrology)『Faces of the Planets』表,其出處為 William Lilly, Christian Astrology(1647)頁 104–105。",
      "version": "0.1.0",
      "reviewed": false,
      "reviewNote": "JDN 1448638 由 test 以儒略曆公式重算。月名各譯本拼法不同(Choiak / Choiach 等)。埃及旬星星名與現代星座的對應學界未定(Symons),不入庫;10° face 為希臘化時期改造。",
      "tier": "classical"
    },
    "civil": {
      "months": [
        "Thoth",
        "Phaophi",
        "Hathyr",
        "Choiach",
        "Tybi",
        "Mecheir",
        "Phamenoth",
        "Pharmouthi",
        "Pachon",
        "Payni",
        "Epeiph",
        "Mesore"
      ],
      "epagomenal": "Epagomenae",
      "monthDays": 30,
      "epagomenalDays": 5,
      "epoch": {
        "era": "Nabonassar",
        "julianDate": "-746-02-26",
        "jdn": 1448638,
        "note": "公元前 747 年 = 天文紀年 −746;正午(亞歷山大港)"
      }
    },
    "faces": [
      {
        "sign": "Aries",
        "rulers": [
          "Mars",
          "Sun",
          "Venus"
        ]
      },
      {
        "sign": "Taurus",
        "rulers": [
          "Mercury",
          "Moon",
          "Saturn"
        ]
      },
      {
        "sign": "Gemini",
        "rulers": [
          "Jupiter",
          "Mars",
          "Sun"
        ]
      },
      {
        "sign": "Cancer",
        "rulers": [
          "Venus",
          "Mercury",
          "Moon"
        ]
      },
      {
        "sign": "Leo",
        "rulers": [
          "Saturn",
          "Jupiter",
          "Mars"
        ]
      },
      {
        "sign": "Virgo",
        "rulers": [
          "Sun",
          "Venus",
          "Mercury"
        ]
      },
      {
        "sign": "Libra",
        "rulers": [
          "Moon",
          "Saturn",
          "Jupiter"
        ]
      },
      {
        "sign": "Scorpio",
        "rulers": [
          "Mars",
          "Sun",
          "Venus"
        ]
      },
      {
        "sign": "Sagittarius",
        "rulers": [
          "Mercury",
          "Moon",
          "Saturn"
        ]
      },
      {
        "sign": "Capricorn",
        "rulers": [
          "Jupiter",
          "Mars",
          "Sun"
        ]
      },
      {
        "sign": "Aquarius",
        "rulers": [
          "Venus",
          "Mercury",
          "Moon"
        ]
      },
      {
        "sign": "Pisces",
        "rulers": [
          "Saturn",
          "Jupiter",
          "Mars"
        ]
      }
    ],
    "facesOrder": [
      "Mars",
      "Sun",
      "Venus",
      "Mercury",
      "Moon",
      "Saturn",
      "Jupiter"
    ]
  },
  "metonic": {
    "meta": {
      "name": "十九年週期:Meton、金數與 epact(復活節計算)、中國四分曆章蔀紀元",
      "schema": "meton ; golden ; epact ; easter ; chinese:{lines,章,章月,章閏,蔀,紀,元}",
      "source": "Meton:Diodorus Siculus, Library XII.36.2(Loeb 第五冊,penelope.uchicago.edu);235 朔望月見 Loeb 編者注 28。金數:英文維基百科 Golden number (time),引 Explanatory Supplement to the Astronomical Ephemeris(HMSO 1961)頁 421–422。Gregorian epact:英文維基百科 Epact。復活節:Meeus/Jones/Butcher 算法,英文維基百科 Date of Easter。中國:《後漢書》志第三〈律曆下〉曆法(維基文庫 後漢書/卷93)。",
      "version": "0.1.0",
      "reviewed": false,
      "reviewNote": "epact 公式括號由維基頁重建,test 以 2026 → 11 與已知年份驗證;Meton 紀年另有公元前 433 年 6 月 28 日一說。",
      "tier": "classical"
    },
    "meton": {
      "years": 19,
      "months": 235,
      "yearBCE": 432,
      "locator": "Diodorus XII.36.2",
      "altDate": "433 BCE June 28(另一說)"
    },
    "golden": {
      "formula": "G = (Y mod 19) + 1"
    },
    "epact": {
      "formula": "E = (11G − ⌊3C/4⌋ + ⌊(8C + 5)/25⌋ + 27) mod 30,C = ⌊Y/100⌋ + 1"
    },
    "easter": {
      "algorithm": "a=Y mod 19; b=floor(Y/100); c=Y mod 100; d=floor(b/4); e=b mod 4; f=floor((b+8)/25); g=floor((b-f+1)/3); h=(19a+b-d-g+15) mod 30; i=floor(c/4); k=c mod 4; l=(32+2e+2i-h-k) mod 7; m=floor((a+11h+22l)/451); n=floor((h+l-7m+114)/31) = month; o=(h+l-7m+114) mod 31; day=o+1."
    },
    "chinese": {
      "lines": [
        "日法，四。",
        "章法，十九。",
        "章月，二百三十五。",
        "蔀法，七十六。",
        "紀法，千五百二十。",
        "元法，四千五百六十。",
        "閏七而盡，其歲十九，名之曰章。"
      ],
      "locator": "後漢書 志第三 律曆下",
      "zhang": 19,
      "zhangMonths": 235,
      "zhangLeap": 7,
      "bu": 76,
      "ji": 1520,
      "yuan": 4560
    }
  }
} as const;
export default CALENDARS_DATA;
