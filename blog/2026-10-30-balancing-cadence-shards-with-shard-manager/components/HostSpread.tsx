import React, { useEffect, useId, useMemo, useState } from "react";
import cluster from "../data/clusterA.json";
import { Tooltip, formatDay, formatDayTime, niceTicks, scaleLinear, useWidth } from "./chartKit";
import styles from "./charts.module.css";

export type Region = "Region 1" | "Region 2";
// [epochSeconds, min, q1, mean, q3, max, hosts]
type SpreadPoint = number[];

const MARGIN = { top: 40, right: 12, bottom: 30, left: 44 };
const Y_MAX = 3.5;
const DAY = 86400;

const regions = cluster.regions as Record<Region, { spread: SpreadPoint[] }>;
const { timeline } = cluster;

const PHASES = [
  {
    id: "hashRing",
    from: timeline.range[0],
    to: timeline.shardManagerAt,
    color: "var(--before)",
    wash: "var(--before-wash)",
  },
  {
    id: "evenCounts",
    from: timeline.shardManagerAt,
    to: timeline.loadAwareAt,
    color: "var(--neutral)",
    wash: "var(--grid)",
  },
  {
    id: "loadAware",
    from: timeline.loadAwareAt,
    to: timeline.range[1],
    color: "var(--after)",
    wash: "var(--after-wash)",
  },
];

function phaseName(t: number): string {
  if (t < timeline.shardManagerAt) return "hash ring";
  if (t < timeline.loadAwareAt) return "even shard counts";
  return "load-aware";
}

function nearestIndex(points: SpreadPoint[], t: number): number {
  let low = 0;
  let high = points.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (points[middle][0] < t) low = middle;
    else high = middle;
  }
  return t - points[low][0] < points[high][0] - t ? low : high;
}

// CpuFigure picks the region.
interface HostSpreadProps {
  region: Region;
}

export default function HostSpread({ region }: HostSpreadProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  useEffect(() => setHoverIndex(null), [region]);
  const clipPrefix = useId().replace(/:/g, "");

  const height = width < 640 ? 300 : 380;
  const plotRight = width - MARGIN.right;
  const plotBottom = height - MARGIN.bottom;
  const x = scaleLinear([timeline.range[0], timeline.range[1]], [MARGIN.left, plotRight]);
  const y = scaleLinear([0, Y_MAX], [plotBottom, MARGIN.top]);
  const points = regions[region].spread;

  const paths = useMemo(() => {
    const top = points.map((p) => `${x(p[0]).toFixed(1)},${y(p[5]).toFixed(1)}`);
    const bottom = points.map((p) => `${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).reverse();
    const mean = points.map((p) => `${x(p[0]).toFixed(1)},${y(p[3]).toFixed(1)}`);
    return {
      band: `M${top.join("L")}L${bottom.join("L")}Z`,
      max: `M${top.join("L")}`,
      mean: `M${mean.join("L")}`,
    };
  }, [points, width, height]);

  const yTicks = niceTicks(0, Y_MAX, 4);
  const xTicks: number[] = [];
  // Weekly ticks on Mondays (UTC), starting from the first Monday in range.
  const firstMonday = Math.ceil((timeline.range[0] - 4 * DAY) / (7 * DAY)) * 7 * DAY + 4 * DAY;
  for (let t = firstMonday; t <= timeline.range[1]; t += 7 * DAY) xTicks.push(t);

  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const t =
      timeline.range[0] + ((event.clientX - bounds.left) / bounds.width) * (timeline.range[1] - timeline.range[0]);
    setHoverIndex(nearestIndex(points, t));
  };
  const onKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    const start = hoverIndex ?? points.length - 1;
    setHoverIndex(Math.min(points.length - 1, Math.max(0, start + step * 8)));
  };

  const hovered = hoverIndex === null ? null : points[hoverIndex];
  const shardManagerX = x(timeline.shardManagerAt);
  const loadAwareX = x(timeline.loadAwareAt);

  return (
    <div className={styles.chart} ref={ref}>
      <div className={styles.controls}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendBox}
              style={{ background: "var(--before-wash)", boxShadow: "inset 0 2px 0 var(--before)" }}
            />
            Coldest to hottest host, hash ring
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendBox}
              style={{ background: "var(--after-wash)", boxShadow: "inset 0 2px 0 var(--after)" }}
            />
            Coldest to hottest host, load-aware
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: "var(--ink)" }} />
            Average host
          </span>
        </div>
      </div>

      {/* Tooltips are positioned in SVG coordinates, so they share this box with the SVG. */}
      <div className={styles.plot}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`CPU per Matching host, coldest to hottest host and the average, over one month. The range narrows sharply after load-aware placement is enabled.`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setHoverIndex(null)}
        >
          <defs>
            {PHASES.map((phase) => (
              <clipPath id={`${clipPrefix}-${phase.id}`} key={phase.id}>
                <rect x={x(phase.from)} y={0} width={Math.max(0, x(phase.to) - x(phase.from))} height={height} />
              </clipPath>
            ))}
          </defs>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                className={tick === 0 ? styles.baseline : styles.gridLine}
                x1={MARGIN.left}
                x2={plotRight}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className={styles.axisText} x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {tick}
              </text>
            </g>
          ))}
          <text className={styles.axisTitle} x={0} y={MARGIN.top - 16}>
            CPU usage (cores)
          </text>
          {xTicks.map((tick) => (
            <text key={tick} className={styles.axisText} x={x(tick)} y={plotBottom + 18} textAnchor="middle">
              {formatDay(tick)}
            </text>
          ))}

          {PHASES.map((phase) => (
            <g key={phase.id} clipPath={`url(#${clipPrefix}-${phase.id})`}>
              <path d={paths.band} fill={phase.wash} />
              <path d={paths.max} fill="none" stroke={phase.color} strokeWidth={1.25} strokeLinejoin="round" />
            </g>
          ))}
          <path
            d={paths.mean}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <line className={styles.marker} x1={shardManagerX} x2={shardManagerX} y1={MARGIN.top - 26} y2={plotBottom} />
          <line className={styles.marker} x1={loadAwareX} x2={loadAwareX} y1={MARGIN.top - 26} y2={plotBottom} />
          <text className={styles.annotation} x={shardManagerX - 6} y={MARGIN.top - 16} textAnchor="end">
            Shard Manager
          </text>
          <text className={styles.annotationStrong} x={loadAwareX + 6} y={MARGIN.top - 16}>
            {width < 640 ? "Load-aware" : "Load-aware placement"}
          </text>

          {hovered && (
            <g pointerEvents="none">
              <line
                className={styles.crosshair}
                x1={x(hovered[0])}
                x2={x(hovered[0])}
                y1={MARGIN.top}
                y2={plotBottom}
              />
              {[hovered[5], hovered[3], hovered[1]].map((value, index) => (
                <circle
                  key={index}
                  cx={x(hovered[0])}
                  cy={y(value)}
                  r={4}
                  fill={
                    index === 1
                      ? "var(--ink)"
                      : (PHASES.find((p) => hovered[0] >= p.from && hovered[0] < p.to)?.color ?? "var(--ink)")
                  }
                  stroke="var(--paper)"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}

          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotRight - MARGIN.left}
            height={plotBottom - MARGIN.top}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>

        {hovered && (
          <Tooltip
            x={x(hovered[0])}
            y={y(hovered[3])}
            containerWidth={width}
            title={`${formatDayTime(hovered[0])} · ${phaseName(hovered[0])}`}
            rows={[
              { key: "max", value: `${hovered[5].toFixed(2)} cores`, label: "hottest" },
              { key: "mean", value: `${hovered[3].toFixed(2)} cores`, label: "average", swatch: "var(--ink)" },
              { key: "min", value: `${hovered[1].toFixed(2)} cores`, label: "coldest" },
              { key: "hosts", value: String(hovered[6]), label: "hosts reporting" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
