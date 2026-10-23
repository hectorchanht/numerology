#!/bin/sh
# 由原圖(1024² JPG,黑底 3×3 數字格)生成 logo + favicon。整張圖就係 artwork,唔裁切。
# 用法:sh scripts/make-brand-icons.sh [/tmp/numerology-logo.jpg]
# 需要 macOS sips。
set -eu
SRC="${1:-/tmp/numerology-logo.jpg}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"

sips -s format png -z 192 192 "$SRC" --out "$WEB/app/icon.png" >/dev/null        # favicon(Next App Router)
sips -s format png -z 180 180 "$SRC" --out "$WEB/app/apple-icon.png" >/dev/null  # Apple touch icon
sips -s format png -z 96 96 "$SRC" --out "$WEB/public/logo.png" >/dev/null       # header logo(28px @3x)

ls -l "$WEB/app/icon.png" "$WEB/app/apple-icon.png" "$WEB/public/logo.png"
