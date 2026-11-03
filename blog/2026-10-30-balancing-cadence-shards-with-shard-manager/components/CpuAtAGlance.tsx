import React, { useId, useMemo } from "react";
import cluster from "../data/clusterA.json";
import { formatDay, scaleLinear, useWidth } from "./chartKit";
import styles from "./charts.module.css";
import essayStyles from "./essay.module.css";

// [time, coldest, q1, average, q3, hottest, hosts], CPU in cores.
type Sample = number[];

const timeline = cluster.timeline;
// The same region as CpuFigure.
const samples = (cluster.regions as Record<string, { spread: Sample[] }>)["Region 1"].spread;

const AVERAGE = 3;
const HOTTEST = 5;
const MARGIN = { top: 40, right: 8, bottom: 24, left: 48 };
// Bigger than the shared legend dot, so both halves of the split dot are easy to see.
const LEGEND_DOT_SIZE = { width: 12, height: 12 };

const Y_MAX = Math.ceil(Math.max(...samples.map((s) => s[HOTTEST])) * 2) / 2;

function coresLabel(cores: number): string {
  if (cores === 0) return "0";
  return cores === 1 ? "1 core" : `${cores} cores`;
}

// A small, static version of CpuFigure for the top of the post: the hottest and the
// average host, with the gap between them shaded. It has no title, so it reads as part
// of the intro rather than the start of a section.
export default function CpuAtAGlance() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const gradientId = useId().replace(/:/g, "");
  const narrow = width < 640;
  const height = narrow ? 200 : 230;
  const plotLeft = MARGIN.left;
  const plotRight = width - MARGIN.right;
  const plotTop = MARGIN.top;
  const plotBottom = height - MARGIN.bottom;

  const chart = useMemo(() => {
    const x = scaleLinear([samples[0][0], samples[samples.length - 1][0]], [plotLeft, plotRight]);
    const y = scaleLinear([0, Y_MAX], [plotBottom, plotTop]);
    const point = (sample: Sample, index: number) => `${x(sample[0]).toFixed(1)},${y(sample[index]).toFixed(1)}`;

    const hottestPath = `M${samples.map((s) => point(s, HOTTEST)).join("L")}`;
    const averagePath = `M${samples.map((s) => point(s, AVERAGE)).join("L")}`;
    const gapPath = `${hottestPath}L${[...samples].reverse().map((s) => point(s, AVERAGE)).join("L")}Z`;

    // Hard color stops: hash ring until onboarding, neutral during the switch, then load-aware.
    const offsetOf = (t: number) => Math.min(1, Math.max(0, (x(t) - plotLeft) / (plotRight - plotLeft)));
    const stops = [offsetOf(timeline.shardManagerAt), offsetOf(timeline.loadAwareAt)];

    const yTicks: number[] = [];
    for (let tick = 0; tick <= Y_MAX; tick++) yTicks.push(tick);

    return { x, y, hottestPath, averagePath, gapPath, stops, yTicks };
  }, [plotLeft, plotRight, plotTop, plotBottom]);

  const { x, y, hottestPath, averagePath, gapPath, stops, yTicks } = chart;
  const switchX = x(timeline.loadAwareAt);

  return (
    <figure className={essayStyles.figure}>
      <div className={styles.chart} ref={ref}>
        <div className={styles.legend}>
          {/* Half orange, half blue: the line's color before and after Shard Manager. */}
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ ...LEGEND_DOT_SIZE, background: "linear-gradient(90deg, var(--before) 50%, var(--after) 50%)" }}
            />
            p99 CPU
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ ...LEGEND_DOT_SIZE, background: "var(--ink)" }} />
            Average CPU
          </span>
        </div>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="CPU on the hottest and the average Matching host over one month. The hottest host drops to just above the average after Shard Manager's load-aware placement is switched on."
        >
          <defs>
            {(["line", "wash"] as const).map((kind) => {
              const suffix = kind === "wash" ? "-wash" : "";
              return (
                <linearGradient
                  key={kind}
                  id={`${gradientId}-${kind}`}
                  gradientUnits="userSpaceOnUse"
                  x1={plotLeft}
                  x2={plotRight}
                  y1={0}
                  y2={0}
                >
                  <stop offset={0} stopColor={`var(--before${suffix})`} />
                  <stop offset={stops[0]} stopColor={`var(--before${suffix})`} />
                  <stop offset={stops[0]} stopColor={kind === "wash" ? "var(--card)" : "var(--neutral)"} />
                  <stop offset={stops[1]} stopColor={kind === "wash" ? "var(--card)" : "var(--neutral)"} />
                  <stop offset={stops[1]} stopColor={`var(--after${suffix})`} />
                  <stop offset={1} stopColor={`var(--after${suffix})`} />
                </linearGradient>
              );
            })}
          </defs>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                className={tick === 0 ? styles.baseline : styles.gridLine}
                x1={plotLeft}
                x2={plotRight}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className={styles.axisText} x={plotLeft - 6} y={y(tick)} dy="0.32em" textAnchor="end">
                {coresLabel(tick)}
              </text>
            </g>
          ))}

          <path d={gapPath} fill={`url(#${gradientId}-wash)`} />
          <line className={styles.referenceLine} x1={switchX} x2={switchX} y1={plotTop - 6} y2={plotBottom} />
          <path d={averagePath} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeLinejoin="round" />
          <path d={hottestPath} fill="none" stroke={`url(#${gradientId}-line)`} strokeWidth={1.5} strokeLinejoin="round" />

          <text className={styles.annotation} x={plotLeft} y={plotTop - 10}>
            Before Shard Manager
          </text>
          <text className={styles.annotation} x={switchX + 6} y={plotTop - 10}>
            After Shard Manager
          </text>

          <text className={styles.axisText} x={plotLeft} y={plotBottom + 16}>
            {formatDay(samples[0][0])}
          </text>
          <text className={styles.axisText} x={switchX} y={plotBottom + 16} textAnchor="middle">
            {formatDay(timeline.loadAwareAt)}
          </text>
          <text className={styles.axisText} x={plotRight} y={plotBottom + 16} textAnchor="end">
            {formatDay(samples[samples.length - 1][0])}
          </text>
        </svg>
      </div>
      <figcaption className={essayStyles.caption}>
        CPU per Matching host in a production cluster.
      </figcaption>
    </figure>
  );
}
