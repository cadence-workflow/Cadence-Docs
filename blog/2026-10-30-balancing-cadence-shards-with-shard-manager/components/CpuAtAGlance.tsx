import React from "react";
import { ThemedComponent } from "@docusaurus/theme-common";
import essayStyles from "./essay.module.css";
import wideLight from "../img/shard-manager-matching-host-cpu.png";
import wideDark from "../img/shard-manager-matching-host-cpu-dark.png";
import narrowLight from "../img/shard-manager-matching-host-cpu-narrow.png";
import narrowDark from "../img/shard-manager-matching-host-cpu-narrow-dark.png";

// The top of the post shows the busiest and the average host as a picture rather than a live
// chart, so search engines index it. Each theme has its own export, and phones get a narrower
// one so the labels stay readable.
const IMAGES = {
  light: { wide: wideLight, narrow: narrowLight },
  dark: { wide: wideDark, narrow: narrowDark },
};
// The exports' size in CSS pixels. The files are twice that, for high-density screens.
const WIDE_SIZE = { width: 637, height: 226 };
const NARROW_SIZE = { width: 368, height: 226 };
// Phones, where the post's column is narrower than about 530px.
const NARROW_MEDIA = "(max-width: 560px)";
const ALT =
  "Line chart of CPU per Matching host over one month. Before Shard Manager, the busiest host runs well above the average host and peaks above 3 cores. After Shard Manager's load-aware placement is switched on, the busiest host drops to just above the average.";

export default function CpuAtAGlance() {
  return (
    <figure className={essayStyles.figure}>
      <ThemedComponent>
        {({ theme, className }) => (
          <picture className={className}>
            <source media={NARROW_MEDIA} srcSet={IMAGES[theme].narrow} {...NARROW_SIZE} />
            <img
              src={IMAGES[theme].wide}
              alt={ALT}
              {...WIDE_SIZE}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </picture>
        )}
      </ThemedComponent>
      <figcaption className={essayStyles.caption}>CPU per Matching host in a production cluster.</figcaption>
    </figure>
  );
}
