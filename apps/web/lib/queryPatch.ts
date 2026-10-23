/**
 * 純函數:將 patch 套用到 query string 上(唔掂 router,可測試)。
 * v=null 或 "" → 刪走個 param;其他 → set。
 */
export function applyQueryPatch(
  search: string,
  patch: Record<string, string | null>,
): string {
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") sp.delete(k);
    else sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
