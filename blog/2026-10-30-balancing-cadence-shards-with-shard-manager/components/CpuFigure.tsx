import React, { type ReactNode, useState } from "react";
import { Figure } from "./Essay";
import { Segmented } from "./chartKit";
import HostSpread, { type Region } from "./HostSpread";
import DailyComparison from "./DailyComparison";
import styles from "./charts.module.css";

type View = "overTime" | "daily";

const VIEW_ORDER: View[] = ["overTime", "daily"];

const VIEWS: Record<View, { title: string; subtitle: string; caption: string }> = {
  overTime: {
    title: "CPU per Matching host, one production cluster",
    subtitle:
      "The hottest, average and coldest host at each moment. The lines turn from orange to blue when load-aware placement is switched on. Hover for values.",
    caption: "Aug 28 to Sep 28, 2026. The cluster runs 11 or 12 Matching hosts.",
  },
  daily: {
    title: "How much hotter the hottest host ran, day by day",
    subtitle:
      "Each dot is one day's average of how much hotter the hottest host was than the average one. The dashed line is the hash ring's best day.",
    caption: "Every day in the data, Aug 28 to Sep 28, 2026.",
  },
};

// Renders one piece per view in the same grid cell, with only the active one visible,
// so the slot is as tall as its tallest version and nothing below it moves.
function Stack({ view, render }: { view: View; render: (v: View) => ReactNode }) {
  return (
    <span className={styles.viewStack}>
      {VIEW_ORDER.map((v) => (
        <span key={v} className={v === view ? undefined : styles.viewHidden} aria-hidden={v === view ? undefined : true}>
          {render(v)}
        </span>
      ))}
    </span>
  );
}

// The data has two regions. The figure shows one to keep it simple.
const REGION: Region = "Region 1";

// The host spread over time and its daily summary as two views of one figure.
// The view toggle sits above the title, so it never moves when switching.
export default function CpuFigure() {
  const [view, setView] = useState<View>("overTime");

  return (
    <Figure
      title={<Stack view={view} render={(v) => VIEWS[v].title} />}
      subtitle={<Stack view={view} render={(v) => VIEWS[v].subtitle} />}
      caption={<Stack view={view} render={(v) => VIEWS[v].caption} />}
      controls={
        <div className={styles.controls}>
          <Segmented<View>
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: "overTime", label: "CPU usage" },
              { value: "daily", label: "CPU imbalance" },
            ]}
          />
        </div>
      }
    >
      <Stack
        view={view}
        render={(v) => (v === "overTime" ? <HostSpread region={REGION} /> : <DailyComparison region={REGION} />)}
      />
    </Figure>
  );
}
