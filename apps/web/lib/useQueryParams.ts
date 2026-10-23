"use client";

import { useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * URL-persisted UI 狀態(filter / deeper content layer),等用戶可以 share / review。
 * Hector 2026-10-23 STANDING RULE(所有 app):filter 同深層內容一定要落 URL,
 * 唔好只收喺 useState —— 個人資料(生日等)除外,唔入 URL。
 *
 * 用法:
 *   const caseId = useQueryParam("case");            // 讀(reactive,跟 back/forward)
 *   const setParams = useSetQueryParams();
 *   setParams({ case: id }, "push");                 // 開 detail → 新增 history
 *   setParams({ q: text }, "replace");               // 打字 filter → 就地更新
 *   setParams({ case: null });                       // 刪 param
 *
 * 注意:用呢個 hook 嘅 component 上層要有 <Suspense>(useSearchParams 要求)。
 */

import { applyQueryPatch } from "./queryPatch.js";
export { applyQueryPatch };

/** 讀一個 query param(reactive)。 */
export function useQueryParam(key: string): string | null {
  return useSearchParams().get(key);
}

export type QueryPatchMode = "push" | "replace";

/** 寫 query params。push = 新增一格 history(開 detail);replace = 就地更新(打字)。 */
export function useSetQueryParams(): (patch: Record<string, string | null>, mode?: QueryPatchMode) => void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(
    (patch, mode = "replace") => {
      const url = `${pathname}${applyQueryPatch(searchParams.toString(), patch)}`;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

/**
 * Detail 開關嘅 smart back:如果係我哋 push 開嘅,用 router.back()
 * 返去列表;如果用戶直接開條分享連結入嚟,就 replace 返乾淨 URL。
 */
export function useDetailCloser(listUrl: string): { markPushed: () => void; close: () => void } {
  const router = useRouter();
  const pushedRef = useRef(false);
  return {
    markPushed: () => {
      pushedRef.current = true;
    },
    close: () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        router.back();
      } else {
        router.replace(listUrl, { scroll: false });
      }
    },
  };
}
