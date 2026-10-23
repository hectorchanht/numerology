#!/usr/bin/env python3
"""Generate packages/knowledge/src/yijing.data.ts (64 hexagrams, typed).

Sources (see attribution header in the generated file):
  1. crane1102/iching-llm (MIT) backend/iching_texts.py — 卦辭/384 爻辭/大象辭 (public-domain classical text)
  2. FENGTING2025/iching-64-hexagrams-json (MIT) hexagrams.json — pinyin/english names
  3. HeTaobaba123/iching-64-hexagrams-dataset (CC0-1.0) — trigram metadata + modern interpretations (zht/zhs/en)

Run: python3 scripts/gen-yijing-data.py   (from repo root)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = Path("/tmp/numerology-research")
sys.path.insert(0, str(RESEARCH / "iching-llm" / "backend"))
import iching_texts  # noqa: E402  (ZHOUI: 64 entries)

# --- trigram bit tables (bottom-up within trigram), ported from iching_coin.py (MIT) ---
TRIGRAM_BITS = {
    "乾": (1, 1, 1), "兌": (1, 1, 0), "離": (1, 0, 1), "震": (1, 0, 0),
    "巽": (0, 1, 1), "坎": (0, 1, 0), "艮": (0, 0, 1), "坤": (0, 0, 0),
}
# normalize simplified-variant codepoints used by the CC0 dataset
TRIGRAM_NORMALIZE = {"兑": "兌", "离": "離"}

# 五行按上卦取(古典八卦五行:乾兌金、離火、震巽木、坎水、艮坤土)。
# 數據集的 element 欄位實為上卦卦象(Heaven/Lake/…),非五行,故不用它。
TRIGRAM_ELEMENT: dict[str, str] = {
    "乾": "金", "兌": "金", "離": "火", "震": "木",
    "巽": "木", "坎": "水", "艮": "土", "坤": "土",
}

# --- 拼音勘誤 + 卦名粵拼(2026-10-23,人工核對:Wiktionary/漢典/zdic) ---
# 上游 FENGTING2025 pinyin 有三處錯:小畜/大畜 Xù 誤作 Chù,噬嗑 Kè 誤作 Hé。
PINYIN_FIX = {"小畜": "Xiǎo Xù", "大畜": "Dà Xù", "噬嗑": "Shì Kè"}
# 易經特殊讀音已按正音覆寫:乾 kin4 / 屯 zeon1 / 否 pei2 / 賁 bei3 / 解 haai6 / 畜 cuk1
JYUTPING = {
    "乾": "kin4", "坤": "kwan1", "屯": "zeon1", "蒙": "mung4", "需": "seoi1",
    "訟": "zung6", "師": "si1", "比": "bei2", "小畜": "siu2 cuk1", "履": "lei5",
    "泰": "taai3", "否": "pei2", "同人": "tung4 jan4", "大有": "daai6 jau5",
    "謙": "him1", "豫": "jyu6", "隨": "ceoi4", "蠱": "gu2", "臨": "lam4",
    "觀": "gun1", "噬嗑": "sai6 haap3", "賁": "bei3", "剝": "mok1", "復": "fuk6",
    "無妄": "mou4 mong5", "大畜": "daai6 cuk1", "頤": "ji4", "大過": "daai6 gwo3",
    "坎": "ham2", "離": "lei4", "咸": "haam4", "恆": "hang4", "遯": "deon6",
    "大壯": "daai6 zong3", "晉": "zeon3", "明夷": "ming4 ji4", "家人": "gaa1 jan4",
    "睽": "kwai4", "蹇": "gin2", "解": "haai6", "損": "syun2", "益": "jik1",
    "夬": "gwaai3", "姤": "gau3", "萃": "seoi6", "升": "sing1", "困": "kwan3",
    "井": "zeng2", "革": "gaak3", "鼎": "ding2", "震": "zan3", "艮": "gan3",
    "漸": "zim6", "歸妹": "gwai1 mui6", "豐": "fung1", "旅": "leoi5", "巽": "seon3",
    "兌": "deoi3", "渙": "wun6", "節": "zit3", "中孚": "zung1 fu1",
    "小過": "siu2 gwo3", "既濟": "gei3 zai3", "未濟": "mei6 zai3",
}

# --- 正字化:OpenCC 簡轉繁首選映射(Apache-2.0),排除歧義字 ---
def load_s2t():
    m = {}
    with open("/tmp/STCharacters.txt", encoding="utf-8") as f:
        for line in f:
            if not line.strip() or line.startswith("#"):
                continue
            k, v = line.rstrip("\n").split("\t")
            m[k] = v.split(" ")[0]
    return m

S2T_TABLE = load_s2t()
# 永不轉換:里(百里距離)/斗(北斗)/咸(咸卦卦名)/干(見下短語規則)
S2T_SKIP = set("里斗咸干")
# 經文短語規則(先於逐字映射執行)
CLASSIC_PHRASES = [("干父", "幹父"), ("干母", "幹母"), ("噬干", "噬乾")]  # 于干(水涯)保留原字
# 現代解讀短語規則
MODERN_PHRASES = [("关系", "關係")]


def s2t(s: str, phrases) -> str:
    for a, b in phrases:
        s = s.replace(a, b)
    return "".join(S2T_TABLE.get(c, c) if c not in S2T_SKIP else c for c in s)

SECTION_KEYS = {
    "zht": [("事業", "career"), ("感情姻緣", "love"), ("財運", "wealth"), ("健康", "health"), ("建議", "advice")],
    "zhs": [("事业", "career"), ("感情姻缘", "love"), ("财运", "wealth"), ("健康", "health"), ("建议", "advice")],
    "en": [("Career", "career"), ("Love & Relationships", "love"), ("Wealth & Finance", "wealth"),
           ("Health", "health"), ("Advice", "advice")],
}


def strip_tags(s: str) -> str:
    s = re.sub(r"<blockquote>\s*<p>|</p>\s*</blockquote>|</?p>", "", s)
    s = s.replace("&amp;", "&").replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", s).strip()


def parse_sections(html: str, locale: str) -> dict:
    """<h2>X</h2><p>...</p>... -> {career, love, wealth, health, advice}."""
    parts = re.split(r"<h2>(.*?)</h2>", html)
    out = {}
    for i in range(1, len(parts), 2):
        heading = strip_tags(parts[i])
        body = strip_tags(parts[i + 1]) if i + 1 < len(parts) else ""
        for want, key in SECTION_KEYS[locale]:
            if heading == want:
                out[key] = body
    return out


def ts_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def main() -> None:
    zhoui = {z["n"]: z for z in iching_texts.ZHOUI}
    assert len(zhoui) == 64, f"ZHOUI has {len(zhoui)} entries"
    j1 = {h["number"]: h for h in json.load(open(RESEARCH / "iching-json1" / "hexagrams.json"))["hexagrams"]}
    d2 = {}
    for loc in ("zht", "zhs", "en"):
        fname = {"zht": "iching-64-hexagrams.zh-hant.json", "zhs": "iching-64-hexagrams.zh.json",
                 "en": "iching-64-hexagrams.en.json"}[loc]
        d2[loc] = {h["number"]: h for h in
                   json.load(open(RESEARCH / "iching-json2" / fname))["hexagrams"]}

    entries = []
    for n in range(1, 65):
        z = zhoui[n]
        assert len(z["lines"]) == 6, f"hexagram {n} has {len(z['lines'])} lines"
        h2 = d2["zht"][n]
        up = TRIGRAM_NORMALIZE.get(h2["upper_trigram"][0], h2["upper_trigram"][0])
        lo = TRIGRAM_NORMALIZE.get(h2["lower_trigram"][0], h2["lower_trigram"][0])
        assert up in TRIGRAM_BITS and lo in TRIGRAM_BITS, f"hex {n}: bad trigrams {up}/{lo}"
        # binary lines bottom-up (for 初九/六二… labels): lower trigram bits + upper trigram bits
        bits = list(TRIGRAM_BITS[lo]) + list(TRIGRAM_BITS[up])
        name = s2t(z["name"], CLASSIC_PHRASES)
        assert name in JYUTPING, f"hex {n}: no jyutping for {name}"
        interps = {}
        for loc in ("zht", "zhs", "en"):
            secs = parse_sections(d2[loc][n]["html"], loc)
            missing = [k for k in ("career", "love", "wealth", "health", "advice") if k not in secs]
            assert not missing, f"hex {n} {loc}: missing sections {missing}"
            if loc == "zht":
                secs = {k: s2t(v, MODERN_PHRASES) for k, v in secs.items()}
                core = s2t(d2[loc][n]["core_meaning"], MODERN_PHRASES)
            else:
                core = d2[loc][n]["core_meaning"]
            interps[loc] = (core, secs)
        entries.append({
            "number": n,
            "name": name,
            "nameEn": j1[n]["english"],
            "pinyin": PINYIN_FIX.get(name, j1[n]["pinyin"]),
            "jyutping": JYUTPING[name],
            "symbol": z["symbol"],
            "upperTrigram": up,
            "lowerTrigram": lo,
            "element": TRIGRAM_ELEMENT[up],
            "yinYang": "陽" if h2["yin_yang"] == "Yang" else "陰",
            "judgment": s2t(z["judgment"], CLASSIC_PHRASES),
            "lines": [s2t(ln, CLASSIC_PHRASES) for ln in z["lines"]],
            "image": s2t(z["image"], CLASSIC_PHRASES),
            "bits": bits,
            "interps": interps,
        })

    out = []
    out.append("/**")
    out.append(" * 六十四卦知識庫(文王卦序)——生成文件,勿手改。")
    out.append(" * 生成器: scripts/gen-yijing-data.py")
    out.append(" * 來源與授權(已標註、可商用):")
    out.append(" *  1. 卦辭/384 爻辭/大象辭 — crane1102/iching-llm (MIT)")
    out.append(" *     backend/iching_texts.py,通行本《周易》公版古籍,無版權問題。")
    out.append(" *  2. 卦名拼音/英文 — FENGTING2025/iching-64-hexagrams-json (MIT)")
    out.append(" *     拼音三處勘誤(2026-10-23,人工核對漢典):小畜/大畜 Xù、噬嗑 Kè。")
    out.append(" *  2b. 卦名粵拼 jyutping — 2026-10-23 人工核對(Wiktionary/漢典),")
    out.append(" *     易經特殊讀音:乾 kin4/屯 zeon1/否 pei2/賁 bei3/解 haai6/畜 cuk1。")
    out.append(" *  3. 上下卦/五行/陰陽 + 現代解讀(事業/感情/財運/健康/建議,繁簡英)")
    out.append(" *     — HeTaobaba123/iching-64-hexagrams-dataset (CC0-1.0,公有領域)。")
    out.append(" *     繁體解讀中的簡體混用字已按內建對照表正字化;解讀為 CC0 種子文本,")
    out.append(" *     學院白話解讀日後以本站自寫版本為準。")
    out.append(" */")
    out.append("import type { Hexagram } from \"./yijing.js\";")
    out.append("")
    out.append("export const YIJING_META = {")
    out.append('  name: "六十四卦", schema: "yijing-hexagrams/1", version: "2026-10-22",')
    out.append('  sources: ["crane1102/iching-llm (MIT)", "FENGTING2025/iching-64-hexagrams-json (MIT)",')
    out.append('            "HeTaobaba123/iching-64-hexagrams-dataset (CC0-1.0)"],')
    out.append("  reviewed: false,")
    out.append('  reviewNote: "經文為公版通行本;現代解讀為 CC0 種子文本,未經逐條人工校對。",')
    out.append("} as const;")
    out.append("")
    out.append("export const HEXAGRAMS: Hexagram[] = [")
    for e in entries:
        out.append("  {")
        out.append(f"    number: {e['number']},")
        out.append(f"    name: {ts_str(e['name'])}, nameEn: {ts_str(e['nameEn'])}, pinyin: {ts_str(e['pinyin'])},")
        out.append(f"    jyutping: {ts_str(e['jyutping'])},")
        out.append(f"    symbol: {ts_str(e['symbol'])},")
        out.append(f"    upperTrigram: {ts_str(e['upperTrigram'])}, lowerTrigram: {ts_str(e['lowerTrigram'])},")
        out.append(f"    element: {ts_str(e['element'])}, yinYang: {ts_str(e['yinYang'])},")
        out.append(f"    judgment: {ts_str(e['judgment'])},")
        out.append("    lines: [")
        for ln in e["lines"]:
            out.append(f"      {ts_str(ln)},")
        out.append("    ],")
        out.append(f"    image: {ts_str(e['image'])},")
        out.append(f"    bits: [{', '.join(map(str, e['bits']))}],")
        for loc in ("zht", "zhs", "en"):
            core, secs = e["interps"][loc]
            out.append(f"    {loc}: {{")
            out.append(f"      coreMeaning: {ts_str(core)},")
            for k in ("career", "love", "wealth", "health", "advice"):
                out.append(f"      {k}: {ts_str(secs[k])},")
            out.append("    },")
        out.append("  },")
    out.append("];")
    out.append("")

    dest = ROOT / "packages" / "knowledge" / "src" / "yijing.data.ts"
    dest.write_text("\n".join(out), encoding="utf-8")
    print(f"wrote {dest} ({len(entries)} hexagrams)")


if __name__ == "__main__":
    main()
