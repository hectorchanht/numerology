"use client";

import { useState } from "react";
import { Seg } from "@/components/ui";
import { useScript } from "@/lib/i18n";
import BodyDiagram from "./BodyDiagram";
import OrganDiagram from "./OrganDiagram";

/**
 * 人體對應圖組:外觀(說卦八部位)同內臟(五行五臟)兩幅圖一掣切換。
 * 選中一卦:外觀圖亮佢管嘅部位,內臟圖亮佢嗰行嘅臟。
 */

/** 五行 → 臟腑(標準臟腑配屬:木肝膽、火心小腸、土脾胃、金肺大腸、水腎膀胱) */
export const ORGAN_BY_ELEMENT: Record<string, { zang: string; fu: string }> = {
  木: { zang: "肝", fu: "膽" },
  火: { zang: "心", fu: "小腸" },
  土: { zang: "脾", fu: "胃" },
  金: { zang: "肺", fu: "大腸" },
  水: { zang: "腎", fu: "膀胱" },
};

export default function BodyMaps({
  activeBody,
  selName,
  selElement,
}: {
  activeBody: string | null;
  selName: string | null;
  selElement: string | null;
}) {
  const { zT } = useScript();
  const [view, setView] = useState<"outer" | "inner">("outer");
  const organ = selElement ? ORGAN_BY_ELEMENT[selElement] : null;

  return (
    <div>
      <div style={{ marginBottom: "0.4rem" }}>
        <Seg
          value={view}
          onChange={setView}
          options={[
            { value: "outer", label: zT("外觀") },
            { value: "inner", label: zT("內臟") },
          ]}
        />
      </div>
      {view === "outer" ? (
        <>
          <BodyDiagram active={activeBody} />
          <p
            className="muted"
            style={{ fontSize: "0.8rem", textAlign: "center", margin: "0.35rem 0 0" }}
          >
            {zT("記法:企喺度由頭數落腳——乾首、離目、坎耳、兌口、艮手、坤腹、巽股、震足。天在上,乾係頭;雷行於下,震係足。")}
          </p>
        </>
      ) : (
        <>
          <OrganDiagram active={organ ? organ.zang : null} />
          {selName && organ && (
            <p style={{ fontSize: "0.85rem", textAlign: "center", margin: "0.35rem 0 0", fontWeight: 700 }}>
              {zT(`${selName}・${selElement} → 臟 ${organ.zang}、腑 ${organ.fu}`)}
            </p>
          )}
          <p
            className="muted"
            style={{ fontSize: "0.8rem", textAlign: "center", margin: "0.3rem 0 0" }}
          >
            {zT("記法:五臟照五行——肝木、心火、脾土、肺金、腎水。邊卦屬邊行,就管嗰一臟。")}
          </p>
        </>
      )}
    </div>
  );
}
