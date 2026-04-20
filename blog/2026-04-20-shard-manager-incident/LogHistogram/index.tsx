import React, { useState, useMemo } from "react";
import styles from "./styles.module.css";

interface Bucket {
  time: string;
  error: number;
  warn: number;
}

interface Props {
  data: Bucket[];
  title?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatTimeWithSeconds(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const s = d.getUTCSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

export default function LogHistogram({ data, title }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { allMinutes, maxTotal } = useMemo(() => {
    if (data.length === 0) return { allMinutes: [], maxTotal: 0 };

    // Build a complete minute range including gaps
    const firstTime = new Date(data[0].time).getTime();
    const lastTime = new Date(data[data.length - 1].time).getTime();
    const dataMap = new Map(data.map((b) => [b.time, b]));

    const minutes: Bucket[] = [];
    let max = 0;
    for (let t = firstTime; t <= lastTime; t += 30000) {
      const d = new Date(t);
      const sec = Math.floor(d.getUTCSeconds() / 30) * 30;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(sec).padStart(2, "0")}Z`;
      const bucket = dataMap.get(key) || { time: key, error: 0, warn: 0 };
      minutes.push(bucket);
      const total = bucket.error + bucket.warn;
      if (total > max) max = total;
    }
    return { allMinutes: minutes, maxTotal: max };
  }, [data]);

  if (allMinutes.length === 0) return null;

  // Y-axis ticks: pick ~4 nice round values
  const yTicks = useMemo(() => {
    if (maxTotal === 0) return [];
    const step = Math.pow(10, Math.floor(Math.log10(maxTotal)));
    const niceStep = maxTotal / step > 5 ? step * 2 : step;
    const ticks: number[] = [];
    for (let v = 0; v <= maxTotal; v += niceStep) {
      ticks.push(v);
    }
    if (ticks[ticks.length - 1] < maxTotal) ticks.push(ticks[ticks.length - 1] + niceStep);
    return ticks;
  }, [maxTotal]);

  const yMax = yTicks.length > 0 ? yTicks[yTicks.length - 1] : maxTotal;

  // Pick ~5 tick labels evenly spaced
  const tickCount = 5;
  const tickIndices: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    tickIndices.push(Math.round((i / (tickCount - 1)) * (allMinutes.length - 1)));
  }

  return (
    <div className={styles.container}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#e74c3c" }} />
          error
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#f5a623" }} />
          warn
        </span>
      </div>
      <div className={styles.chartArea}>
        <div className={styles.yAxis}>
          {yTicks.map((v) => (
            <div
              key={v}
              className={styles.yTick}
              style={{ bottom: `${(v / yMax) * 100}%` }}
            >
              <span className={styles.yLabel}>{formatCount(v)}</span>
            </div>
          ))}
        </div>
        <div className={styles.barsArea}>
          {yTicks.map((v) => (
            <div
              key={`grid-${v}`}
              className={styles.yGridLine}
              style={{ bottom: `${(v / yMax) * 100}%` }}
            />
          ))}
          <div className={styles.bars}>
            {allMinutes.map((bucket, i) => {
              const total = bucket.error + bucket.warn;
              const heightPct = yMax > 0 ? (total / yMax) * 100 : 0;
              const effectiveHeight = total > 0 && heightPct < 1.5 ? 1.5 : heightPct;
              const errorPct = total > 0 ? (bucket.error / total) * 100 : 0;
              const warnPct = total > 0 ? (bucket.warn / total) * 100 : 0;
              const isHovered = hoveredIdx === i;

              return (
                <div
                  key={bucket.time}
                  className={`${styles.barWrapper} ${isHovered ? styles.barHovered : ""}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHovered && (
                    <div className={styles.tooltip}>
                      <div className={styles.tooltipTime}>{formatTimeWithSeconds(bucket.time)}</div>
                      <div className={styles.tooltipRow}>
                        <span className={styles.legendDot} style={{ background: "#e74c3c" }} />
                        error <strong>{total > 0 ? bucket.error.toLocaleString() : "0"}</strong>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span className={styles.legendDot} style={{ background: "#f5a623" }} />
                        warn <strong>{total > 0 ? bucket.warn.toLocaleString() : "0"}</strong>
                      </div>
                    </div>
                  )}
                  <div className={styles.bar} style={{ height: `${effectiveHeight}%` }}>
                    <div
                      className={styles.barSegment}
                      style={{ height: `${errorPct}%`, background: "#e74c3c" }}
                    />
                    <div
                      className={styles.barSegment}
                      style={{ height: `${warnPct}%`, background: "#f5a623" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.xAxis}>
            {tickIndices.map((idx, ti) => {
              const isLast = ti === tickIndices.length - 1;
              const isFirst = ti === 0;
              return (
                <span
                  key={idx}
                  className={styles.xLabel}
                  style={{
                    left: `${(idx / (allMinutes.length - 1)) * 100}%`,
                    transform: isLast ? "translateX(-100%)" : isFirst ? "none" : "translateX(-50%)",
                  }}
                >
                  {formatTime(allMinutes[idx].time)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
