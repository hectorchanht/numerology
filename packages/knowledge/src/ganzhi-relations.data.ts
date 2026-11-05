// AUTO-GENERATED from data/ganzhi-relations.json — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/ganzhi-relations.json 後重新生成本文件。
const GANZHI_RELATIONS_DATA = {
  "meta": {
    "tier": "classical",
    "name": "干支關係規則表:天干五合/相沖、地支六合/三合/三會/六沖/六害/三刑/相破",
    "schema": "ganHe,zhiLiuHe,zhiSanHe,zhiSanHui:{pair|members,hua} ; ganChong,zhiChong,zhiHai,zhiPo:[a,b] ; zhiXing:{members,kind} ; cite:{關係:出處}",
    "source": "明・萬民英《三命通會》卷二(維基文庫 zh.wikisource:三命通會/卷二)之〈論十干合〉〈論十干化氣〉〈論支元六合〉〈論支元三合〉〈論六害〉〈論三刑〉〈論沖擊〉。三會、天干相沖、相破三項卷二無獨立篇名,屬命理通行說法,逐項於 cite 註明。",
    "version": "1",
    "reviewed": false,
    "reviewNote": "篇名已對照維基文庫卷二目錄;組合內容為通行規則,未逐句校對原文。"
  },
  "ganHe": [
    {
      "pair": [
        "甲",
        "己"
      ],
      "hua": "土"
    },
    {
      "pair": [
        "乙",
        "庚"
      ],
      "hua": "金"
    },
    {
      "pair": [
        "丙",
        "辛"
      ],
      "hua": "水"
    },
    {
      "pair": [
        "丁",
        "壬"
      ],
      "hua": "木"
    },
    {
      "pair": [
        "戊",
        "癸"
      ],
      "hua": "火"
    }
  ],
  "ganChong": [
    [
      "甲",
      "庚"
    ],
    [
      "乙",
      "辛"
    ],
    [
      "丙",
      "壬"
    ],
    [
      "丁",
      "癸"
    ]
  ],
  "zhiLiuHe": [
    {
      "pair": [
        "子",
        "丑"
      ],
      "hua": "土"
    },
    {
      "pair": [
        "寅",
        "亥"
      ],
      "hua": "木"
    },
    {
      "pair": [
        "卯",
        "戌"
      ],
      "hua": "火"
    },
    {
      "pair": [
        "辰",
        "酉"
      ],
      "hua": "金"
    },
    {
      "pair": [
        "巳",
        "申"
      ],
      "hua": "水"
    },
    {
      "pair": [
        "午",
        "未"
      ],
      "hua": "土",
      "note": "午未合,一說化火、一說化土(日月合);此取土,異說從火。"
    }
  ],
  "zhiSanHe": [
    {
      "members": [
        "申",
        "子",
        "辰"
      ],
      "hua": "水"
    },
    {
      "members": [
        "亥",
        "卯",
        "未"
      ],
      "hua": "木"
    },
    {
      "members": [
        "寅",
        "午",
        "戌"
      ],
      "hua": "火"
    },
    {
      "members": [
        "巳",
        "酉",
        "丑"
      ],
      "hua": "金"
    }
  ],
  "zhiSanHui": [
    {
      "members": [
        "寅",
        "卯",
        "辰"
      ],
      "hua": "木"
    },
    {
      "members": [
        "巳",
        "午",
        "未"
      ],
      "hua": "火"
    },
    {
      "members": [
        "申",
        "酉",
        "戌"
      ],
      "hua": "金"
    },
    {
      "members": [
        "亥",
        "子",
        "丑"
      ],
      "hua": "水"
    }
  ],
  "zhiChong": [
    [
      "子",
      "午"
    ],
    [
      "丑",
      "未"
    ],
    [
      "寅",
      "申"
    ],
    [
      "卯",
      "酉"
    ],
    [
      "辰",
      "戌"
    ],
    [
      "巳",
      "亥"
    ]
  ],
  "zhiHai": [
    [
      "子",
      "未"
    ],
    [
      "丑",
      "午"
    ],
    [
      "寅",
      "巳"
    ],
    [
      "卯",
      "辰"
    ],
    [
      "申",
      "亥"
    ],
    [
      "酉",
      "戌"
    ]
  ],
  "zhiXing": [
    {
      "members": [
        "寅",
        "巳",
        "申"
      ],
      "kind": "无恩"
    },
    {
      "members": [
        "丑",
        "戌",
        "未"
      ],
      "kind": "恃势"
    },
    {
      "members": [
        "子",
        "卯"
      ],
      "kind": "无礼"
    },
    {
      "members": [
        "辰"
      ],
      "kind": "自刑"
    },
    {
      "members": [
        "午"
      ],
      "kind": "自刑"
    },
    {
      "members": [
        "酉"
      ],
      "kind": "自刑"
    },
    {
      "members": [
        "亥"
      ],
      "kind": "自刑"
    }
  ],
  "zhiPo": [
    [
      "子",
      "酉"
    ],
    [
      "卯",
      "午"
    ],
    [
      "辰",
      "丑"
    ],
    [
      "未",
      "戌"
    ],
    [
      "寅",
      "亥"
    ],
    [
      "巳",
      "申"
    ]
  ],
  "cite": {
    "ganHe": "《三命通會》卷二〈論十干合〉、〈論十干化氣〉",
    "ganChong": "命理通行說法(卷二〈論沖擊〉言支沖,干沖無獨立篇名)",
    "zhiLiuHe": "《三命通會》卷二〈論支元六合〉",
    "zhiSanHe": "《三命通會》卷二〈論支元三合〉",
    "zhiSanHui": "命理通行說法;卷二〈論三刑〉以「寅卯辰、巳午未、申酉戌、亥子丑」三位與三合並論,無獨立篇名",
    "zhiChong": "《三命通會》卷二〈論沖擊〉",
    "zhiHai": "《三命通會》卷二〈論六害〉",
    "zhiXing": "《三命通會》卷二〈論三刑〉",
    "zhiPo": "命理通行說法(卷二〈論沖擊〉僅泛言「沖破」,無六破獨立篇名)"
  }
};

export default GANZHI_RELATIONS_DATA;
