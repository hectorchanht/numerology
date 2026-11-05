// AUTO-GENERATED from data/ziwei-geju.json — 內聯為 TS 模組,免運行時 fs 讀取。
// 若需更新數據,改 data/ziwei-geju.json 後重新生成本文件。
const ZIWEI_GEJU_DATA = {
  "meta": {
    "tier": "classical",
    "name": "紫微斗數格局規則表(命宮條件 DSL,供引擎判格)",
    "schema": "rules[]:{id,name,all:[{op,stars,palace?,branches?,brightness?}],verdict,cite} ; op=samePalace|inSanFang|inPalace|noMajor ; 星名用 iztro 簡體名 ; brightness?:string[]=所列每顆星嘅 iztro 亮度須屬其中(例 [\"庙\",\"旺\"]),可用於 samePalace/inPalace/inSanFang ; inPalace 容許 stars:[] 配 branches 只限制命宮地支",
    "source": "明・羅洪先(傳)《紫微斗數全書》(維基文庫 zh.wikisource:紫微斗數全書/卷一、卷二、卷三)之〈斗數骨髓賦〉〈定貴局〉〈命宮〉。",
    "version": "1",
    "reviewed": false,
    "reviewNote": "只收《全書》有原文者,原文已對照維基文庫;條件為本站機械化簡寫,未經人工逐條校對。DSL 擴充:brightness(亮度限定)、inPalace 空 stars 配 branches(限命宮地支)。日月並明 / 火貪 / 鈴貪用庙旺限定(原文「日月反背」「居陷地則喪命夭折」之反面)。機月同梁以 inPalace 空 stars 限寅申(卷三骨髓賦注「命在寅申方論」)。馬頭帶箭:〈定貴局〉注云「馬頭帶劍 謂馬有刃是也不是居午格」,與卷三〈天同〉條「天同貪羊陀居午位丙戌…為馬頭帶箭富且貴」相左;本站取卷三說(天同+擎羊居午命宮),「丙戌生人」條件 DSL 未能表達,骨髓賦「馬頭帶劍非夭折則主刑傷」為另一說,故註於此。命無正曜:原文有「夭折孤貧」(骨髓賦)同「富貴全美」(卷三)兩說,故判「中」。"
  },
  "rules": [
    {
      "id": "zifu-tonggong",
      "name": "紫府同宫",
      "all": [
        {
          "op": "inPalace",
          "stars": [
            "紫微",
            "天府"
          ],
          "palace": "命宫"
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
        },
        {
          "op": "inPalace",
          "stars": [],
          "palace": "命宫",
          "branches": [
            "寅",
            "申"
          ]
        }
      ],
      "verdict": "中",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:機月同梁作吏人;卷三骨髓賦注:命在寅申方論"
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
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:府相同來會命宮全家食祿(格名「府相朝垣」見〈定貴局〉目,注文僅「見前批注」,取意於此句)"
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
          ],
          "brightness": [
            "庙",
            "旺"
          ]
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷一〈斗數骨髓賦〉:日月並明佐九重於堯殿;廟旺限定取〈定貧賤局〉「日月藏輝」注(日月反背)之反面"
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
          "palace": "命宫",
          "brightness": [
            "庙",
            "旺"
          ]
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
          "palace": "命宫",
          "brightness": [
            "庙",
            "旺"
          ]
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
            "天同",
            "擎羊"
          ],
          "palace": "命宫",
          "branches": [
            "午"
          ]
        }
      ],
      "verdict": "吉",
      "cite": "《紫微斗數全書》卷三〈論諸星同垣各司所宜分別富貴貧賤夭壽〉:為馬頭帶箭富且貴"
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
      "verdict": "中",
      "cite": "《紫微斗數全書》卷三〈談星要論〉:財官二宮有吉星拱照富貴全美;卷一〈斗數骨髓賦〉另有「夭折孤貧」之說"
    }
  ]
};

export default ZIWEI_GEJU_DATA;
