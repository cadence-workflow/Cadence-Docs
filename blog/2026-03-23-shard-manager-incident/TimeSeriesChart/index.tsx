import React, { useState, useRef, useCallback, useMemo } from "react";
import type { Series } from "./data";

interface Props {
  series: Series[];
  title?: string;
  height?: number;
  yLabel?: string;
  yMin0?: boolean;
}

const PAD = { top: 20, right: 20, bottom: 40, left: 50 };

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function niceYTicks(min: number, max: number): number[] {
  if (min === max) return [min - 1, min, min + 1];
  const range = max - min;
  const rawStep = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 5, 10];
  const step =
    mag * (candidates.find((c) => c * mag >= rawStep) ?? 10);
  const ticks: number[] = [];
  const start = Math.floor(min / step) * step;
  for (let v = start; v <= max + step * 0.01; v += step) {
    ticks.push(v);
  }
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export default function TimeSeriesChart({
  series,
  title,
  height = 220,
  yLabel,
  yMin0 = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Merge all timestamps to build a shared x-axis
  const allTimes = useMemo(() => {
    const set = new Set<string>();
    series.forEach((s) => s.data.forEach((d) => set.add(d.time)));
    return Array.from(set).sort();
  }, [series]);

  const { yMin, yMax, yTicks } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    series.forEach((s) =>
      s.data.forEach((d) => {
        if (d.value < lo) lo = d.value;
        if (d.value > hi) hi = d.value;
      })
    );
    if (!isFinite(lo)) {
      lo = 0;
      hi = 1;
    }
    if (yMin0) lo = 0;
    const ticks = niceYTicks(lo, hi);
    return { yMin: ticks[0], yMax: ticks[ticks.length - 1], yTicks: ticks };
  }, [series, yMin0]);

  const W = 700;
  const H = height;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xScale = useCallback(
    (i: number) => PAD.left + (i / Math.max(allTimes.length - 1, 1)) * plotW,
    [allTimes.length, plotW]
  );
  const yScale = useCallback(
    (v: number) =>
      PAD.top + plotH - ((v - yMin) / Math.max(yMax - yMin, 1)) * plotH,
    [yMin, yMax, plotH]
  );

  // Build path + lookup per series
  const seriesData = useMemo(() => {
    return series.map((s) => {
      const lookup = new Map(s.data.map((d) => [d.time, d.value]));
      const points = allTimes.map((t, i) => ({
        x: xScale(i),
        y: yScale(lookup.get(t) ?? 0),
        value: lookup.get(t) ?? 0,
        time: t,
      }));
      const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return { ...s, points, d };
    });
  }, [series, allTimes, xScale, yScale]);

  // X-axis tick labels (~6 evenly spaced)
  const xTickCount = Math.min(6, allTimes.length);
  const xTickIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < xTickCount; i++) {
      indices.push(Math.round((i / Math.max(xTickCount - 1, 1)) * (allTimes.length - 1)));
    }
    return indices;
  }, [allTimes.length, xTickCount]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const svg = svgRef.current;
      if (!svg || allTimes.length === 0) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      const rel = (mouseX - PAD.left) / plotW;
      const idx = Math.round(rel * (allTimes.length - 1));
      if (idx >= 0 && idx < allTimes.length) {
        setHoverIdx(idx);
        setMousePos({ x: e.clientX, y: e.clientY });
      } else {
        setHoverIdx(null);
        setMousePos(null);
      }
    },
    [allTimes.length, plotW]
  );

  // Tooltip position relative to container
  const tooltipStyle = useMemo((): React.CSSProperties | null => {
    if (hoverIdx === null || !mousePos || !containerRef.current) return null;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = mousePos.x - containerRect.left;
    const flipLeft = x > containerRect.width / 2;
    return {
      position: "absolute",
      top: 8,
      left: flipLeft ? undefined : x + 14,
      right: flipLeft ? containerRect.width - x + 14 : undefined,
      background: "#1e293b",
      color: "#e2e8f0",
      padding: "6px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontFamily: "system-ui, sans-serif",
      lineHeight: 1.6,
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      pointerEvents: "none" as const,
      zIndex: 10,
      whiteSpace: "nowrap" as const,
    };
  }, [hoverIdx, mousePos]);

  return (
    <div
      ref={containerRef}
      style={{
        margin: "24px 0",
        padding: "12px 16px",
        background: "#f8fafc",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        position: "relative",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setHoverIdx(null); setMousePos(null); }}
    >
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#334155",
            marginBottom: 8,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {title}
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", maxWidth: W, cursor: "crosshair" }}
      >
        {/* Grid lines */}
        {yTicks.map((v) => (
          <line
            key={v}
            x1={PAD.left}
            y1={yScale(v)}
            x2={W - PAD.right}
            y2={yScale(v)}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((v) => (
          <text
            key={`yl-${v}`}
            x={PAD.left - 8}
            y={yScale(v) + 4}
            textAnchor="end"
            fontSize={11}
            fontFamily="system-ui, sans-serif"
            fill="#94a3b8"
          >
            {v}
          </text>
        ))}

        {/* Y-axis label */}
        {yLabel && (
          <text
            x={14}
            y={PAD.top + plotH / 2}
            textAnchor="middle"
            fontSize={11}
            fontFamily="system-ui, sans-serif"
            fill="#94a3b8"
            transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}
          >
            {yLabel}
          </text>
        )}

        {/* X-axis labels */}
        {xTickIndices.map((idx) => (
          <text
            key={`xl-${idx}`}
            x={xScale(idx)}
            y={H - PAD.bottom + 20}
            textAnchor="middle"
            fontSize={11}
            fontFamily="system-ui, sans-serif"
            fill="#94a3b8"
          >
            {formatTime(allTimes[idx])}
          </text>
        ))}

        {/* Lines */}
        {seriesData.map((s) => (
          <path
            key={s.name}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
          />
        ))}

        {/* Hover crosshair + dots */}
        {hoverIdx !== null && (
          <>
            <line
              x1={xScale(hoverIdx)}
              y1={PAD.top}
              x2={xScale(hoverIdx)}
              y2={PAD.top + plotH}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            {seriesData.map((s) => (
              <circle
                key={`dot-${s.name}`}
                cx={s.points[hoverIdx].x}
                cy={s.points[hoverIdx].y}
                r={5}
                fill={s.color}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </>
        )}

        {/* Legend */}
        {seriesData.map((s, i) => (
          <g key={`leg-${s.name}`} transform={`translate(${PAD.left + i * 100}, ${H - 8})`}>
            <rect width={12} height={3} rx={1} fill={s.color} y={-2} />
            <text x={16} y={2} fontSize={11} fontFamily="system-ui, sans-serif" fill="#64748b">
              {s.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip rendered as HTML overlay outside SVG */}
      {hoverIdx !== null && tooltipStyle && (
        <div style={tooltipStyle}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            {formatTime(allTimes[hoverIdx])}
          </div>
          {seriesData.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              <span>{s.name}:</span>
              <strong>{s.points[hoverIdx].value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
