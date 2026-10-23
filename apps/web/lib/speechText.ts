/**
 * 把 markdown 轉成適合朗讀的純文字:去掉格式符號,保留文字內容。
 * 供章節朗讀(TTS)用——語音引擎讀到 `**` 等符號會好怪。
 */
export function speechText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // 代碼塊整段去掉
    .replace(/`([^`]*)`/g, "$1") // 行內代碼留文字
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // 圖片 → alt 文字
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 連結 → 文字
    .replace(/^#{1,6}\s+/gm, "") // 標題 #
    .replace(/^>\s?/gm, "") // 引用 >
    .replace(/^(\s*[-*+]|\s*\d+[.)])\s+/gm, "") // 列表符號
    .replace(/^(\s*(-{3,}|_{3,}|\*{3,})\s*)$/gm, "") // 分隔線
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // 粗體
    .replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1$2") // 斜體 *
    .replace(/(^|[^\w])_([^_\n]+)_/g, "$1$2") // 斜體 _
    .replace(/~~(.*?)~~/g, "$1") // 刪除線
    .replace(/<[^>]+>/g, " ") // HTML 標籤
    .replace(/[ \t]+/g, " ")
    .replace(/\n +/g, "\n") // 換行後的殘留空格
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 易經多音字 TTS 糾音:語音引擎遇到多音字多數讀常用音,同易經讀音唔同,
 * 代入同音常用字等佢讀啱。讀音全部對過 Wiktionary / 漢典:
 * 乾 qián/kin4(非 gān/gon1) 屯 zhūn/zeon1(非 tún/tyun4) 否 pǐ/pei2(非 fǒu/fau2)
 * 賁 bì/bei3(非 bēn/ban1) 解 xiè/haai6(非 jiě/gaai2;《周易正義》解卦有兩音,呢度跟站內拼音 Xiè)
 * 畜 xù/cuk1(小畜/大畜,非 chù/cuk3)
 */
const YIJING_SPEECH_FIX: Record<string, { cmn: string; yue: string }> = {
  "乾": { cmn: "錢", yue: "堅" },
  "屯": { cmn: "諄", yue: "樽" },
  "否": { cmn: "匹", yue: "痞" },
  "賁": { cmn: "幣", yue: "臂" },
  "解": { cmn: "謝", yue: "亥" },
  "畜": { cmn: "蓄", yue: "速" },
};

/** 易經文本 TTS 前糾音:按語言代入同音字。非中文文本唔受影響。 */
export function fixYijingSpeech(text: string, lang: "zh-HK" | "zh-CN"): string {
  const key = lang === "zh-HK" ? "yue" : "cmn";
  let out = text;
  for (const [ch, sub] of Object.entries(YIJING_SPEECH_FIX)) {
    if (out.includes(ch)) out = out.split(ch).join(sub[key]);
  }
  return out;
}
