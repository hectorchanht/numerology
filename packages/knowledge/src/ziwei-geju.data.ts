// AUTO-GENERATED from data/ziwei-geju.json — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/ziwei-geju.json 後重新生成本文件。
const ZIWEI_GEJU_DATA = {
  "meta": {
    "tier": "classical",
    "name": "紫微斗數格局規則表(命宮條件 DSL,供引擎判格)",
    "schema": "rules[]:{id,name,all:[{op,stars,palace?,branches?}],verdict,cite} ; op=samePalace|inSanFang|inPalace|noMajor ; 星名用 iztro 簡體名",
    "source": "明・羅洪先(傳)《紫微斗數全書》(維基文庫 zh.wikisource:紫微斗數全書/卷一、卷二、卷三)之〈斗數骨髓賦〉〈定貴局〉〈命宮〉。",
    "version": "1",
    "reviewed": false,
    "reviewNote": "只收《全書》有原文者,原文已對照維基文庫;條件為本站機械化簡寫(庙旺、寅申限定等原文附帶條件未入 DSL),未經人工逐條校對。「馬頭帶箭」原文多作「馬頭帶劍」,午宮擎羊取卷三〈天同〉條「天同貪羊陀居午位…馬頭帶箭」。"
  },
  "rules": [
    {
      "id": "zifu-tonggong",
      "name": "紫府同宫",
      "all": [
        {
          "op": "samePalace",
          "stars": [
            "紫微",
            "天府"
          ]
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:紫府同宮終身福厚"
    },
    {
      "id": "jiyue-tongliang",
      "name": "机月同梁",
      "all": [
        {
          "op": "inSanFang",
          "stars": [
            "天机",
            "太阴",
            "天同",
            "天梁"
          ]
        }
      ],
      "verdict": "中",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:機月同梁作吏人"
    },
    {
      "id": "shapolang",
      "name": "杀破狼",
      "all": [
        {
          "op": "inSanFang",
          "stars": [
            "七杀",
            "破军",
            "贪狼"
          ]
        }
      ],
      "verdict": "中",
      "cite": "《紫微斗數全書》卷二〈命宮〉:只恐三方殺破狼"
    },
    {
      "id": "fuxiang-chaoyuan",
      "name": "府相朝垣",
      "all": [
        {
          "op": "inSanFang",
          "stars": [
            "天府",
            "天相"
          ]
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:府相同來會命宮全家食祿"
    },
    {
      "id": "riyue-bingming",
      "name": "日月并明",
      "all": [
        {
          "op": "inSanFang",
          "stars": [
            "太阳",
            "太阴"
          ]
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:日月並明佐九重於堯殿"
    },
    {
      "id": "junchen-qinghui",
      "name": "君臣庆会",
      "all": [
        {
          "op": "inPalace",
          "stars": [
            "紫微",
            "左辅",
            "右弼"
          ],
          "palace": "命宫"
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷一〈定貴局〉:紫微左右同守命"
    },
    {
      "id": "huotan",
      "name": "火贪",
      "all": [
        {
          "op": "inPalace",
          "stars": [
            "贪狼",
            "火星"
          ],
          "palace": "命宫"
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:貪狼火星居廟旺名鎮諸邦"
    },
    {
      "id": "lingtan",
      "name": "铃贪",
      "all": [
        {
          "op": "inPalace",
          "stars": [
            "贪狼",
            "铃星"
          ],
          "palace": "命宫"
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:貪鈴並守將相之名"
    },
    {
      "id": "matou-daijian",
      "name": "马头带箭",
      "all": [
        {
          "op": "inPalace",
          "stars": [
            "擎羊"
          ],
          "palace": "命宫",
          "branches": [
            "午"
          ]
        }
      ],
      "verdict": "中",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:馬頭帶劍非夭折則主刑傷"
    },
    {
      "id": "ming-wu-zhengyao",
      "name": "命无正曜",
      "all": [
        {
          "op": "noMajor",
          "palace": "命宫"
        }
      ],
      "verdict": "凶",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:命無正曜夭折孤貧"
    }
  ]
};

export default ZIWEI_GEJU_DATA;
