// @dawn-studio/pronounce — markdown → TTS-friendly plain text.
//
// A speech engine reading raw markdown aloud is painful (`**bold**` becomes
// "star star bold star star"). Strip the formatting first, keep the words:
// pass report/section markdown through this before `speak()` / `speakAll()`.

/**
 * Strip markdown formatting, keeping the readable text.
 * Code blocks are dropped entirely; links/images keep their text; headings,
 * quotes, list markers, emphasis and HTML tags are removed.
 */
export function speechText(md: string): string {
	return md
		.replace(/```[\s\S]*?```/g, " ") // fenced code blocks: drop whole
		.replace(/`([^`]*)`/g, "$1") // inline code: keep text
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt text
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
		.replace(/^#{1,6}\s+/gm, "") // headings
		.replace(/^>\s?/gm, "") // blockquotes
		.replace(/^(\s*[-*+]|\s*\d+[.)])\s+/gm, "") // list markers
		.replace(/^(\s*(-{3,}|_{3,}|\*{3,})\s*)$/gm, "") // hr
		.replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
		.replace(/(^|[^*\w])\*([^\n]+?)\*/g, "$1$2") // italic *
		.replace(/(^[^\w]|[^\\w])_([^_\n]+)_/g, "$1$2") // italic _
		.replace(/~~(.*?)~~/g, "$1") // strikethrough
		.replace(/<[^>]+>/g, " ") // HTML tags
		.replace(/[ \t]+/g, " ")
		.replace(/\n +/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
