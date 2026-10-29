import React, { useId, useState } from "react";
import observations from "../data/placementQuality.json";
import { ArrowheadMarker, Tooltip, calloutArrowPath, scaleLog, useWidth } from "./chartKit";
import styles from "./charts.module.css";

interface Observation {
  env: string;
  region: string;
  executors: number;
  shards: number;
  currentCV: number;
  optimalCV: number;
}

// The cluster the rest of the post is about.
const FEATURED_ENV = "Cluster B";
// Rows are thin and unlabelled: the anonymized names mean nothing to readers, so only the
// featured cluster gets a callout and the rest are named on hover.
const ROW_HEIGHT = 14;
const SIDE_PADDING = 12;
const X_DOMAIN: [number, number] = [0.03, 4];
const X_TICKS = [0.05, 0.1, 0.2, 0.5, 1, 2];
const TOP = 30;
const BOTTOM = 40;

const rows = [...(observations as Observation[])].sort((a, b) => a.optimalCV - b.optimalCV);

function headroom(row: Observation): number {
  return (row.currentCV - row.optimalCV) / row.optimalCV;
}

function formatHeadroom(value: number): string {
  if (value === 0) return "0%";
  if (value < 0.0001) return "<0.01%";
  return `${(value * 100).toFixed(value < 0.1 ? 2 : 1)}%`;
}

export default function PlacementQuality() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const markerId = useId();

  const narrow = width < 640;
  const plotLeft = SIDE_PADDING;
  const plotRight = width - SIDE_PADDING;
  const plotBottom = TOP + rows.length * ROW_HEIGHT;
  const height = plotBottom + BOTTOM;
  const x = scaleLog(X_DOMAIN, [plotLeft, plotRight]);
  const rowY = (index: number) => TOP + index * ROW_HEIGHT + ROW_HEIGHT / 2;

  const hovered = hoverIndex === null ? null : rows[hoverIndex];
  const withinFivePercent = rows.filter((row) => headroom(row) <= 0.05).length;

  // One label points at both of the featured cluster's rows. Its rows are near the top and the
  // right of them is empty, since it balances easily.
  const featured = rows.flatMap((row, index) => (row.env === FEATURED_ENV ? [{ row, index }] : []));
  const arrowTips = featured.map(({ row, index }) => ({
    x: x(Math.max(row.currentCV, row.optimalCV)) + 9,
    y: rowY(index),
  }));
  const calloutX = Math.max(...arrowTips.map((tip) => tip.x)) + 44;
  const calloutY = arrowTips[0].y + 4;

  // One hit area over all rows, so a thin row is still easy to hover.
  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const top = event.currentTarget.getBoundingClientRect().top;
    const index = Math.floor((event.clientY - top) / ROW_HEIGHT);
    setHoverIndex(Math.min(rows.length - 1, Math.max(0, index)));
  };

  return (
    <div className={styles.chart} ref={ref}>
      <div className={styles.controls}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "var(--after)" }} />
            Shard Manager's placement
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendRing} />
            Best possible placement
          </span>
        </div>
      </div>

      {/* Tooltips are positioned in SVG coordinates, so they share this box with the SVG. */}
      <div className={styles.plot}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Load spread of Shard Manager's placement compared with the best possible placement for ${rows.length} environment and region snapshots. ${withinFivePercent} of ${rows.length} are within 5% of the optimum.`}
        >
          <text className={styles.axisTitle} x={plotLeft} y={14}>
            {narrow ? "load spread (log scale)" : "load spread across hosts (log scale)"}
          </text>

          {X_TICKS.map((tick) => (
            <g key={tick}>
              <line className={styles.gridLine} x1={x(tick)} x2={x(tick)} y1={TOP - 4} y2={plotBottom} />
              <text className={styles.axisText} x={x(tick)} y={plotBottom + 16} textAnchor="middle">
                {tick}
              </text>
            </g>
          ))}
          <text className={styles.axisTitle} x={plotLeft} y={height - 6}>
            ← easier to balance
          </text>
          <text className={styles.axisTitle} x={plotRight} y={height - 6} textAnchor="end">
            a few hot shards dominate →
          </text>

          {rows.map((row, index) => {
            const cy = rowY(index);
            const isHovered = hoverIndex === index;
            return (
              <g key={`${row.env}-${row.region}`}>
                {isHovered && (
                  <rect x={0} y={cy - ROW_HEIGHT / 2} width={width} height={ROW_HEIGHT} fill="var(--card)" rx={3} />
                )}
                <line
                  x1={x(row.optimalCV)}
                  x2={x(row.currentCV)}
                  y1={cy}
                  y2={cy}
                  stroke="var(--after)"
                  strokeWidth={1.5}
                />
                <circle
                  cx={x(row.currentCV)}
                  cy={cy}
                  r={4}
                  fill="var(--after)"
                  stroke="var(--paper)"
                  strokeWidth={1.5}
                />
                <circle cx={x(row.optimalCV)} cy={cy} r={4.5} fill="none" stroke="var(--ink)" strokeWidth={1.25} />
              </g>
            );
          })}

          <defs>
            <ArrowheadMarker id={markerId} />
          </defs>
          {arrowTips.map((tip, index) => (
            <path
              key={tip.y}
              className={styles.annotationArrow}
              // The first arrow runs level with the label, the second curves down from under it.
              d={calloutArrowPath(calloutX - 6, index === 0 ? tip.y : calloutY + 4, tip.x, tip.y)}
              markerEnd={`url(#${markerId})`}
            />
          ))}
          <text className={styles.calloutHalo} x={calloutX} y={calloutY}>
            <tspan className={styles.calloutTitle}>The cluster in this post</tspan>
            <tspan x={calloutX} dy="1.35em" className={styles.calloutText}>
              Region 1 and Region 2
            </tspan>
          </text>

          <rect
            x={0}
            y={TOP}
            width={width}
            height={rows.length * ROW_HEIGHT}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>

        {hovered && hoverIndex !== null && (
          <Tooltip
            x={x(Math.max(hovered.currentCV, hovered.optimalCV)) + 6}
            y={rowY(hoverIndex)}
            containerWidth={width}
            title={`${hovered.env} · ${hovered.region}`}
            rows={[
              { key: "cur", value: hovered.currentCV.toFixed(3), label: "Shard Manager spread", swatch: "var(--after)" },
              { key: "opt", value: hovered.optimalCV.toFixed(3), label: "best possible spread", swatch: "var(--ink)" },
              { key: "head", value: formatHeadroom(headroom(hovered)), label: "headroom" },
              { key: "executors", value: hovered.executors.toLocaleString("en-US"), label: "hosts" },
              { key: "shards", value: hovered.shards.toLocaleString("en-US"), label: "shards" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
