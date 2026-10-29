import React, { useState } from "react";
import { Figure } from "./Essay";
import { Segmented } from "./chartKit";
import HostSpread, { type Region } from "./HostSpread";
import DailyComparison from "./DailyComparison";

type View = "overTime" | "daily";

const VIEWS: Record<View, { title: string; subtitle: string; caption: string }> = {
  overTime: {
    title: "CPU per Matching host, one production cluster",
    subtitle:
      "Each band runs from the coldest to the hottest host at that moment. The line is the average host. Hover for values.",
    caption: "Aug 28 to Sep 28, 2026. Each region runs 11 or 12 Matching hosts.",
  },
  daily: {
    title: "How much hotter the hottest host ran, day by day",
    subtitle:
      "Each dot is one day's average of how much hotter the hottest host was than the average one. The dashed line is the hash ring's best day.",
    caption: "Every day in the data, Aug 28 to Sep 28, 2026.",
  },
};

// The host spread over time and its daily summary as two views of one figure.
// The region choice carries over when switching views.
export default function CpuFigure() {
  const [view, setView] = useState<View>("overTime");
  const [region, setRegion] = useState<Region>("Region 1");
  const { title, subtitle, caption } = VIEWS[view];

  const viewToggle = (
    <Segmented<View>
      label="View"
      value={view}
      onChange={setView}
      options={[
        { value: "overTime", label: "CPU usage" },
        { value: "daily", label: "CPU imbalance" },
      ]}
    />
  );

  return (
    <Figure title={title} subtitle={subtitle} caption={caption}>
      {view === "overTime" ? (
        <HostSpread region={region} onRegionChange={setRegion} controls={viewToggle} />
      ) : (
        <DailyComparison region={region} onRegionChange={setRegion} controls={viewToggle} />
      )}
    </Figure>
  );
}
