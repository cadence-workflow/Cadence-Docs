import React, { useEffect, useRef, useState } from 'react';

type Row = {
  label: string;
  inlineKB: number;
  claimKB: number;
};

const ROWS: Row[] = [
  { label: 'Small signal\n(1 KB)',       inlineKB:     1, claimKB:   0.1 },
  { label: 'Activity result\n(50 KB)',   inlineKB:    50, claimKB:   0.1 },
  { label: 'JSON report\n(500 KB)',      inlineKB:   500, claimKB:   0.1 },
  { label: 'Binary blob\n(1.8 MB)',      inlineKB:  1800, claimKB:   0.1 },
  { label: 'Over the limit\n(3 MB)',     inlineKB:  3000, claimKB:   0.1 },
];

const MAX_KB = 3000;
const BAR_MAX_W = 340; // px, max bar width
const LIMIT_KB = 2048; // 2 MB
const LIMIT_X = (LIMIT_KB / MAX_KB) * BAR_MAX_W;

function kbLabel(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  if (kb < 1) return `${(kb * 1024).toFixed(0)} B`;
  return `${kb} KB`;
}

function Bar({
  kb,
  maxKb,
  color,
  animated,
}: {
  kb: number;
  maxKb: number;
  color: string;
  animated: boolean;
}) {
  const [width, setWidth] = useState(0);
  const target = Math.max((kb / maxKb) * BAR_MAX_W, 3);

  useEffect(() => {
    if (!animated) { setWidth(0); return; }
    const t = setTimeout(() => setWidth(target), 60);
    return () => clearTimeout(t);
  }, [animated, target]);

  const overLimit = kb > LIMIT_KB;

  return (
    <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          height: 18,
          width: animated ? width : target,
          background: overLimit ? 'var(--ifm-color-danger)' : color,
          borderRadius: 3,
          transition: animated ? 'width 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
          flexShrink: 0,
        }}
      />
      <span style={{
        marginLeft: 8,
        fontSize: 11,
        color: overLimit ? 'var(--ifm-color-danger)' : 'var(--ifm-color-emphasis-700)',
        fontWeight: overLimit ? 700 : 400,
        whiteSpace: 'nowrap',
      }}>
        {kbLabel(kb)}{overLimit ? ' (exceeds limit)' : ''}
      </span>
    </div>
  );
}

export default function SizeChart() {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Animate on first intersection
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ margin: '2rem 0' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--ifm-color-emphasis-500)' }} />
          Inline in history (no converter)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--ifm-color-primary)' }} />
          Claim-check (reference in history)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--ifm-color-danger)' }} />
          Exceeds 2 MB limit
        </div>
      </div>

      {/* Chart */}
      <div style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 10,
        background: 'var(--ifm-background-surface-color)',
        padding: '1.2rem 1rem',
        overflowX: 'auto',
      }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, marginBottom: 8 }}>
          <div />
          <div style={{ position: 'relative', height: 20 }}>
            {/* Limit marker label */}
            <div style={{
              position: 'absolute',
              left: LIMIT_X - 1,
              top: 0,
              borderLeft: '2px dashed var(--ifm-color-danger)',
              height: '100%',
              paddingLeft: 4,
              fontSize: 10,
              color: 'var(--ifm-color-danger)',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}>
              2 MB limit
            </div>
          </div>
        </div>

        {ROWS.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr',
              gap: 8,
              marginBottom: 14,
              position: 'relative',
            }}
          >
            {/* Row label */}
            <div style={{
              fontSize: 12,
              color: 'var(--ifm-font-color-base)',
              fontWeight: 500,
              lineHeight: 1.3,
              paddingTop: 2,
              whiteSpace: 'pre-line',
            }}>
              {row.label}
            </div>

            {/* Bars */}
            <div style={{ position: 'relative' }}>
              {/* 2 MB limit line running through bars */}
              <div style={{
                position: 'absolute',
                left: LIMIT_X,
                top: 0,
                bottom: 0,
                borderLeft: '2px dashed var(--ifm-color-danger)',
                opacity: 0.35,
              }} />

              <Bar kb={row.inlineKB} maxKb={MAX_KB} color="var(--ifm-color-emphasis-500)" animated={animated} />
              <Bar kb={row.claimKB} maxKb={MAX_KB} color="var(--ifm-color-primary)" animated={animated} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginTop: '0.6rem' }}>
        Claim-check stores only a ~100 B JSON reference in Cadence history regardless of payload size.
        The actual payload lives in the blob store.
      </p>
    </div>
  );
}
