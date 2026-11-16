import React, { useEffect, useRef, useState } from "react";
import styles from "./charts.module.css";

// Width used for the server render, before the real width is measured.
const SSR_WIDTH = 960;

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(SSR_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  return (value: number) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

export function scaleLog(domain: [number, number], range: [number, number]) {
  const linear = scaleLinear([Math.log10(domain[0]), Math.log10(domain[1])], range);
  return (value: number) => linear(Math.log10(value));
}

export function niceTicks(min: number, max: number, count = 4): number[] {
  const rawStep = (max - min) / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = magnitude * ([1, 2, 2.5, 5, 10].find((c) => c * magnitude >= rawStep) ?? 10);
  const ticks: number[] = [];
  for (let tick = Math.ceil(min / step) * step; tick <= max + step * 1e-6; tick += step) {
    ticks.push(Number(tick.toFixed(6)));
  }
  return ticks;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// All dates are formatted in UTC so the server render and the browser agree.
export function formatDay(epochSeconds: number): string {
  const date = new Date(epochSeconds * 1000);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatDayTime(epochSeconds: number): string {
  const date = new Date(epochSeconds * 1000);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${formatDay(epochSeconds)}, ${hours}:${minutes} UTC`;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={option.value === value ? styles.segmentActive : styles.segment}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export interface TooltipRow {
  key: string;
  value: string;
  label: string;
  swatch?: string;
}

interface TooltipProps {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  rows: TooltipRow[];
}

const TOOLTIP_WIDTH = 210;

export function Tooltip({ x, y, containerWidth, title, rows }: TooltipProps) {
  const flip = x + TOOLTIP_WIDTH + 24 > containerWidth;
  const left = flip ? x - TOOLTIP_WIDTH - 14 : x + 14;
  return (
    <div className={styles.tooltip} style={{ left, top: y, width: TOOLTIP_WIDTH }} role="status">
      <div className={styles.tooltipTitle}>{title}</div>
      {rows.map((row) => (
        <div key={row.key} className={styles.tooltipRow}>
          {row.swatch && <span className={styles.tooltipKey} style={{ background: row.swatch }} />}
          <span className={styles.tooltipValue}>{row.value}</span>
          <span className={styles.tooltipLabel}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

// A callout arrow from a label to a mark: a gentle curve that ends in a short straight run
// into the tip, so the arrowhead (oriented along that run) lines up with the shaft.
export function calloutArrowPath(startX: number, startY: number, tipX: number, tipY: number): string {
  const towardTip = tipX >= startX ? 1 : -1;
  const slope = tipY > startY + 2 ? 0.5 : tipY < startY - 2 ? -0.5 : 0;
  const approachLength = 9;
  const approachX = towardTip * (slope === 0 ? 1 : 0.86) * approachLength;
  const approachY = slope * approachLength;
  const bendX = tipX - approachX;
  const bendY = tipY - approachY;
  return [
    `M ${startX} ${startY}`,
    `C ${startX + towardTip * 18} ${startY}, ${bendX - approachX} ${bendY - approachY}, ${bendX} ${bendY}`,
    `L ${tipX} ${tipY}`,
  ].join(" ");
}

// Put inside an SVG's <defs> and reference with markerEnd={`url(#${id})`}.
export function ArrowheadMarker({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 2 1.5 L 8.5 5 L 2 8.5" className={styles.annotationArrowHead} />
    </marker>
  );
}
