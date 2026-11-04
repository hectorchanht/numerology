import type { BirthInput } from "@numerology/engine";

export type Calendar = "solar" | "lunar";

/** 表單產出的出生信息:陽曆 BirthInput,外加曆法標記(農曆時由服務端轉陽曆)。 */
export type BirthFormValue = BirthInput & {
  calendar?: Calendar;
  isLeapMonth?: boolean;
  /** 用戶自定命盤名稱(選填,本機歷史用,不入 POST body)。 */
  name?: string;
};
