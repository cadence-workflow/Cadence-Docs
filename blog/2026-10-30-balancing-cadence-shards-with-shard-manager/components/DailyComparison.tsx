import React, { type ReactNode, useMemo, useState } from "react";
import cluster from "../data/clusterA.json";
import { Segmented, Tooltip, formatDay, scaleLinear, useWidth } from "./chartKit";
import styles from "./charts.module.css";

export type Region = "Region 1" | "Region 2";

interface Day {
  date: string;
  phase: string;
  cv: number;
  maxOverMean: number;
  p99: number | null;
}

interface PlacedDay {
  day: Day;
  cx: number;
  cy: number;
  color: string;
}

const PHASES: Record<string, { label: string; color: string }> = {
  hashRing: { label: "Hash ring", color: "var(--before)" },
  loadAware: { label: "Load-aware placement", color: "var(--after)" },
};

const PHASE_NAMES: Record<string, string> = {
  hashRing: "Hash ring",
  loadAware: "Load-aware",
  transition: "Switch",
  evenCounts: "Even counts",
};

const DAY_SECONDS = 86400;
// Rough width of one 12px label character, to keep the right-hand phase label inside the plot.
const LABEL_CHAR_WIDTH = 6.6;
const MARGIN = { top: 40, right: 16, bottom: 34, left: 40 };

const regions = cluster.regions as Record<Region, { daily: Day[] }>;

// One y range for both regions, so switching tabs doesn't rescale the axis.
// The ratio can't go below 1×, where every host carries the same load, so the axis starts there.
const HIGHEST_RATIO = Math.max(...Object.values(regions).flatMap(({ daily }) => daily.map((day) => day.maxOverMean)));
const Y_MAX = Math.ceil((HIGHEST_RATIO + 0.05) * 2) / 2;

function noonOf(date: string): number {
  return Date.parse(`${date}T12:00:00Z`) / 1000;
}

function ratio(value: number): string {
  return `${value.toFixed(2)}×`;
}

// One dot per day on a calendar axis, with a dashed line at the hash ring's best day:
// every day after the switch sits below it.
interface DailyComparisonProps {
  region: Region;
  onRegionChange: (region: Region) => void;
  // Rendered before the region toggle, in the same row.
  controls?: ReactNode;
}

export default function DailyComparison({ region, onRegionChange, controls }: DailyComparisonProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<PlacedDay | null>(null);

  const narrow = width < 640;
  const height = narrow ? 290 : 330;
  const radius = narrow ? 4 : 5;
  const plotLeft = MARGIN.left;
  const plotRight = width - MARGIN.right;
  const plotTop = MARGIN.top;
  const plotBottom = height - MARGIN.bottom;
  const days = regions[region].daily;

  const chart = useMemo(() => {
    const first = noonOf(days[0].date);
    const last = noonOf(days[days.length - 1].date);
    const x = scaleLinear([first - DAY_SECONDS / 2, last + DAY_SECONDS / 2], [plotLeft, plotRight]);

    const y = scaleLinear([1, Y_MAX], [plotBottom, plotTop]);
    const yTicks: number[] = [];
    for (let tick = 1; tick <= Y_MAX + 1e-6; tick += 0.5) yTicks.push(tick);

    // Weekly date ticks on Mondays.
    const xTicks: number[] = [];
    for (let t = first; t <= last; t += DAY_SECONDS) {
      if (new Date(t * 1000).getUTCDay() === 1) xTicks.push(t);
    }

    const placed: PlacedDay[] = days
      .filter((day) => day.phase in PHASES)
      .map((day) => ({ day, cx: x(noonOf(day.date)), cy: y(day.maxOverMean), color: PHASES[day.phase].color }));

    const switchDays = days.filter((day) => day.phase === "transition").map((day) => noonOf(day.date));
    const switchBand =
      switchDays.length > 0
        ? { x0: x(Math.min(...switchDays) - DAY_SECONDS / 2), x1: x(Math.max(...switchDays) + DAY_SECONDS / 2) }
        : null;

    const bestHashRingDay = Math.min(...days.filter((day) => day.phase === "hashRing").map((day) => day.maxOverMean));

    // The load-aware label starts where its days start, or earlier if it would run off the right edge.
    const firstLoadAware = noonOf(days.find((day) => day.phase === "loadAware")!.date);
    const loadAwareLabelWidth = 13 + PHASES.loadAware.label.length * LABEL_CHAR_WIDTH;
    const loadAwareLabelX = Math.min(x(firstLoadAware - DAY_SECONDS / 2), plotRight - loadAwareLabelWidth);

    return { y, yTicks, x, xTicks, placed, switchBand, bestHashRingDay, loadAwareLabelX };
  }, [days, plotLeft, plotRight, plotTop, plotBottom]);

  const { y, yTicks, x, xTicks, placed, switchBand, bestHashRingDay, loadAwareLabelX } = chart;

  return (
    <div className={styles.chart} ref={ref}>
      <div className={styles.controls}>
        {controls}
        <Segmented
          label="Region"
          value={region}
          onChange={(value) => {
            onRegionChange(value);
            setHovered(null);
          }}
          options={[
            { value: "Region 1", label: "Region 1" },
            { value: "Region 2", label: "Region 2" },
          ]}
        />
      </div>

      <div className={styles.plot}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Hottest host divided by the average host, one dot per day in ${region}. Every day with load-aware placement is below the hash ring's best day, ${ratio(bestHashRingDay)}.`}
        >
          {switchBand && (
            <rect x={switchBand.x0} width={switchBand.x1 - switchBand.x0} y={plotTop} height={plotBottom - plotTop} fill="var(--card)" />
          )}

          {yTicks.map((tick) => (
            <g key={tick}>
              <line className={tick === 1 ? styles.baseline : styles.gridLine} x1={plotLeft} x2={plotRight} y1={y(tick)} y2={y(tick)} />
              <text className={styles.axisText} x={plotLeft - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {tick}×
              </text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <text key={tick} className={styles.axisText} x={x(tick)} y={plotBottom + 18} textAnchor="middle">
              {formatDay(tick)}
            </text>
          ))}

          <text className={styles.annotationStrong} x={plotLeft} y={14}>
            hottest host ÷ average host · 1× is perfectly even
          </text>

          {/* Phase labels in place of a legend: hash ring on the left, load-aware on the right. */}
          <g>
            <circle cx={plotLeft + 4} cy={plotTop - 10} r={4} fill={PHASES.hashRing.color} />
            <text className={styles.annotation} x={plotLeft + 13} y={plotTop - 10} dy="0.32em">
              {PHASES.hashRing.label}
            </text>
            <circle cx={loadAwareLabelX + 4} cy={plotTop - 10} r={4} fill={PHASES.loadAware.color} />
            <text className={styles.annotation} x={loadAwareLabelX + 13} y={plotTop - 10} dy="0.32em">
              {PHASES.loadAware.label}
            </text>
          </g>

          {/* The hash ring's best day. */}
          <line
            className={styles.referenceLine}
            x1={plotLeft}
            x2={plotRight}
            y1={y(bestHashRingDay)}
            y2={y(bestHashRingDay)}
          />
          <text className={styles.annotation} x={plotRight} y={y(bestHashRingDay) - 6} textAnchor="end">
            Best hash-ring day
          </text>

          {placed.map((dot) => (
            <circle
              key={dot.day.date}
              cx={dot.cx}
              cy={dot.cy}
              r={hovered?.day.date === dot.day.date ? radius + 1.5 : radius}
              fill={dot.color}
              stroke="var(--paper)"
              strokeWidth={2}
            />
          ))}
          {/* Hit targets bigger than the dots. */}
          {placed.map((dot) => (
            <circle
              key={`hit-${dot.day.date}`}
              cx={dot.cx}
              cy={dot.cy}
              r={11}
              fill="transparent"
              onPointerEnter={() => setHovered(dot)}
              onPointerLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {hovered && (
          <Tooltip
            x={hovered.cx}
            y={hovered.cy}
            containerWidth={width}
            title={`${formatDay(noonOf(hovered.day.date))} · ${PHASE_NAMES[hovered.day.phase]}`}
            rows={[{ key: "v", value: ratio(hovered.day.maxOverMean), label: "hottest ÷ average", swatch: hovered.color }]}
          />
        )}
      </div>

      <details className={styles.tableToggle}>
        <summary>Show daily values</summary>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Phase</th>
              <th>Hottest ÷ average</th>
              <th>CV</th>
              <th>p99 CPU</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{PHASE_NAMES[day.phase]}</td>
                <td>{ratio(day.maxOverMean)}</td>
                <td>{day.cv.toFixed(2)}</td>
                <td>{day.p99 === null ? "–" : `${day.p99.toFixed(1)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
