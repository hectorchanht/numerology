// AUTO-GENERATED from data/heluo-ggz.json — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/heluo-ggz.json 後重新生成本文件。
const HELUO_GGZ_DATA = {
  "meta": {
    "name": "《河洛理數 範衍 廣象徹微初集》後半可驗證規則:金鎖銀匙取數、範衍衍法、廣象徹微四象積數",
    "schema": "jinsuoYinshi:{rule,nayinAdd,buNumber,examples} ; fanyan:{chou,calendar} ; guangxiang:{values,example,counts}",
    "source": "《故宮珍本叢刊》影印明刻本 GGZBCK405《河洛理數 範衍 廣象徹微初集》(Wikimedia Commons,公有領域;raw_pdf/河洛理數GGZBCK405範衍廣象徹微.pdf,MinerU doc:b0a02d7)。page = PDF 頁。範衍題辭錢一本萬曆丙午(1606)。",
    "version": "0.1.0",
    "reviewed": false,
    "reviewNote": "只錄取數規則同書中算例,唔錄參評詩、範衍贊辭、廣象卦辭。卷七八字提綱、合婚、神煞屬通行子平/八宅表,唔重複收。金鎖銀匙詩表 OCR 太亂,未錄鍵值。"
  },
  "jinsuoYinshi": {
    "page": [
      218,
      225
    ],
    "rule": "金鎖銀匙:只用年柱納音、日支、時支。二千為基;由日支順數至時支(兩頭計)乘一百,同支作十三;再加日支、時支序數(子 1 … 亥 12);納音水、火加 27,土加 50,木、金不加;再加部數(水 1、火 2、木 3、金 4、土 5),入該納音之部查詩。逆數以時支逆數至日支代百位(順逆和恆為 14)。大運以運支代時支;流年以運支、太歲支代日、時。",
    "base": 2000,
    "nayinAdd": {
      "水": 27,
      "火": 27,
      "土": 50,
      "木": 0,
      "金": 0
    },
    "buNumber": {
      "水": 1,
      "火": 2,
      "木": 3,
      "金": 4,
      "土": 5
    },
    "layout": {
      "page": 218,
      "rule": "詩表上層男命、中層女命、下層大運流年;缺詩作凶看。"
    },
    "examples": [
      {
        "page": 219,
        "pillars": [
          "乙卯",
          "戊子",
          "壬戌",
          "壬寅"
        ],
        "nayin": "水",
        "result": 2542,
        "reverse": 2942
      },
      {
        "page": 220,
        "pillars": [
          "丙寅",
          "戊戌",
          "壬戌",
          "辛丑"
        ],
        "nayin": "火",
        "result": 2442,
        "reverse": 3042
      },
      {
        "page": 222,
        "pillars": [
          "壬子",
          "癸丑",
          "己卯",
          "己巳"
        ],
        "nayin": "木",
        "result": 2313,
        "printed": 3313,
        "erratum": "書中將二千加三百誤作「一千三百」再連前二千,得三千三百一十,查三三一三;按規則應為 2313(已核原圖)。"
      },
      {
        "page": 222,
        "pillars": [
          "壬申",
          "己酉",
          "戊申",
          "庚申"
        ],
        "nayin": "金",
        "result": 3322
      },
      {
        "page": 224,
        "pillars": [
          "庚午",
          "癸未",
          "癸亥",
          "乙卯"
        ],
        "nayin": "土",
        "result": 2571,
        "reverse": 2971
      }
    ]
  },
  "fanyan": {
    "page": [
      262,
      264
    ],
    "rule": "範衍衍法:九籌各記 1–9,擲後見數 k 定疇;k = 1–8 依次為五行、五事、八政、五紀、皇極、三德、稽疑、庶徵,k = 9(全見)為嚮福、k = 0(全不見)為威極,同屬福極。每疇章數 = C(9,k),共 512 章 = 2^9。",
    "chou": [
      {
        "k": 1,
        "name": "五行",
        "chapters": 9,
        "page": 265
      },
      {
        "k": 2,
        "name": "五事",
        "chapters": 36,
        "page": 273
      },
      {
        "k": 3,
        "name": "八政",
        "chapters": 84,
        "page": 286
      },
      {
        "k": 4,
        "name": "五紀",
        "chapters": 126,
        "page": 311
      },
      {
        "k": 5,
        "name": "皇極",
        "chapters": 126,
        "page": 357
      },
      {
        "k": 6,
        "name": "三德",
        "chapters": 84,
        "page": 398
      },
      {
        "k": 7,
        "name": "稽疑",
        "chapters": 36,
        "page": 420
      },
      {
        "k": 8,
        "name": "庶徵",
        "chapters": 9,
        "page": 431
      },
      {
        "k": 9,
        "name": "福極·嚮福",
        "chapters": 1,
        "page": 446
      },
      {
        "k": 0,
        "name": "福極·威極",
        "chapters": 1,
        "page": 446
      }
    ],
    "calendar": {
      "page": 450,
      "rule": "一章管九時辰;四章三日;四百八十章三百六十日;五百一十二章四千六百零八時,即閏年三百八十四日。冬至起初一章,夏至起建一章。",
      "hoursPerChapter": 9,
      "hoursPerDay": 12,
      "year": {
        "chapters": 480,
        "days": 360
      },
      "leapYear": {
        "chapters": 512,
        "days": 384
      }
    }
  },
  "guangxiang": {
    "page": [
      459,
      483
    ],
    "rule": "廣象徹微:四象各有數(元/太陽 1、會/少陰 2、運/少陽 3、世/太陰 4),四畫成一卦,卦數為四畫之積,256 卦得 25 種數。年月日時取支序(子 1)或干序(甲 1)除 4 之餘(0 作 4)定四畫。",
    "values": {
      "元": 1,
      "會": 2,
      "運": 3,
      "世": 4
    },
    "counts": {
      "page": 470,
      "values": {
        "12": 24,
        "16": 19,
        "24": 28
      }
    },
    "example": {
      "page": 482,
      "pillars": [
        "甲子",
        "丁丑",
        "壬寅",
        "辛亥"
      ],
      "branch": {
        "xiang": [
          "元",
          "會",
          "運",
          "世"
        ],
        "product": 24
      },
      "stem": {
        "xiang": [
          "元",
          "世",
          "元",
          "世"
        ],
        "product": 16
      }
    }
  }
} as const;
export default HELUO_GGZ_DATA;
