import React, { useEffect, useRef, useState } from 'react';

// ─── Layout constants ──────────────────────────────────────────────────────
const W = 700;
const H = 200;
const NODE_R = 38;
const BLOB_R = 38;
const R_LARGE = 10;
const R_SMALL = 6;
const SPEED = 0.008;
const SHRINK_STEPS = 40;

const NODES = [
  { id: 'worker',  label: 'Worker',        x: 80,  y: 100 },
  { id: 'conv',    label: 'DataConverter', x: 270, y: 100 },
  { id: 'blob',    label: 'Blob Store',    x: 460, y: 40  },
  { id: 'history', label: 'History',       x: 620, y: 100 },
];

const ENCODE_EDGES = [
  { from: 'worker',  to: 'conv',    label: 'large payload' },
  { from: 'conv',    to: 'blob',    label: 'PUT blob'       },
  { from: 'conv',    to: 'history', label: 'tiny ref'       },
];
const DECODE_EDGES = [
  { from: 'history', to: 'conv',    label: 'tiny ref'       },
  { from: 'conv',    to: 'blob',    label: 'GET blob'       },
  { from: 'conv',    to: 'worker',  label: 'full payload'   },
];

type Mode = 'encode' | 'decode';
type Phase = 'legs' | 'shrink';

type Particle = {
  id: number;
  edgeIdx: number;
  t: number;
  label: string;
  r: number;           // current rendered radius
  labelOpacity: number; // 1 normally; fades to 0 during shrink
  large: boolean;       // whether this started as a large payload
};

let nextId = 0;

function nodePos(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function edgePath(from: string, to: string): { d: string; mx: number; my: number } {
  const f = nodePos(from);
  const t = nodePos(to);
  const cx = (f.x + t.x) / 2;
  const cy = (f.y + t.y) / 2 - 30;
  return { d: `M ${f.x} ${f.y} Q ${cx} ${cy} ${t.x} ${t.y}`, mx: cx, my: cy };
}

function bezierPoint(from: string, to: string, t: number): { x: number; y: number } {
  const f = nodePos(from);
  const tk = nodePos(to);
  const cx = (f.x + tk.x) / 2;
  const cy = (f.y + tk.y) / 2 - 30;
  const x = (1 - t) * (1 - t) * f.x + 2 * (1 - t) * t * cx + t * t * tk.x;
  const y = (1 - t) * (1 - t) * f.y + 2 * (1 - t) * t * cy + t * t * tk.y;
  return { x, y };
}

export default function PayloadFlowDemo() {
  const [mode, setMode] = useState<Mode>('encode');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('legs');
  const rafRef = useRef<number | null>(null);

  const edges = mode === 'encode' ? ENCODE_EDGES : DECODE_EDGES;

  function reset() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setParticles([]);
    setStep(0);
    setPhase('legs');
    setRunning(false);
  }

  function play() {
    reset();
    setRunning(true);
  }

  // ── Shrink phase: dot shrinks and label fades at the Blob Store node ──────
  useEffect(() => {
    if (!running || phase !== 'shrink') return;

    let progress = 0;

    function shrinkTick() {
      progress = Math.min(progress + 1 / SHRINK_STEPS, 1);
      setParticles((prev) =>
        prev.map((p) =>
          p.edgeIdx === 1
            ? {
                ...p,
                r: R_LARGE - (R_LARGE - R_SMALL) * progress,
                labelOpacity: 1 - progress,
              }
            : p
        )
      );
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(shrinkTick);
      } else {
        // Remove the shrunken blob particle before leg 3 starts
        setParticles((prev) => prev.filter((p) => p.edgeIdx !== 1));
        setPhase('legs');
        setStep(2);
      }
    }

    rafRef.current = requestAnimationFrame(shrinkTick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, phase]);

  // ── Legs phase: animate one edge at a time ────────────────────────────────
  useEffect(() => {
    if (!running || phase !== 'legs') return;
    if (step >= edges.length) {
      setRunning(false);
      return;
    }

    const edge = edges[step];
    const pid = nextId++;
    // Large dot on: encode leg 0 (Worker→Conv) and leg 1 (Conv→Blob)
    // Large dot on: decode leg 2 (Conv→Worker)
    const isLarge =
      (mode === 'encode' && step <= 1) ||
      (mode === 'decode' && step === 2);

    setParticles((prev) => [
      ...prev,
      { id: pid, edgeIdx: step, t: 0, label: edge.label, r: isLarge ? R_LARGE : R_SMALL, labelOpacity: 1, large: isLarge },
    ]);

    let localT = 0;

    function tick() {
      localT = Math.min(localT + SPEED, 1);
      setParticles((prev) =>
        prev.map((p) => (p.id === pid ? { ...p, t: localT } : p))
      );
      if (localT < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // After encode leg 1 arrives at Blob Store, pause for the shrink
        if (mode === 'encode' && step === 1) {
          setPhase('shrink');
        } else {
          // Remove the completed particle, then advance
          setParticles((prev) => prev.filter((p) => p.id !== pid));
          setStep((s) => s + 1);
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step, phase]);

  useEffect(() => { reset(); }, [mode]);

  const isBlobActive =
    phase === 'shrink' ||
    (mode === 'encode' ? particles.some((p) => p.edgeIdx === 1 && p.t > 0.5)
                       : particles.some((p) => p.edgeIdx === 1 && p.t < 0.5));

  return (
    <div style={{ margin: '2rem 0' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['encode', 'decode'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); }}
            style={{
              padding: '5px 18px',
              borderRadius: 6,
              background: 'transparent',
              color: mode === m ? 'var(--ifm-color-primary)' : 'var(--ifm-font-color-base)',
              border: 'none',
              borderBottom: mode === m ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
        <button
          onClick={play}
          disabled={running}
          style={{
            marginLeft: 'auto',
            padding: '5px 16px',
            borderRadius: 6,
            border: 'none',
            background: running ? 'var(--ifm-color-emphasis-300)' : 'var(--ifm-color-success)',
            color: running ? 'var(--ifm-color-emphasis-700)' : '#fff',
            cursor: running ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {running ? 'Animating…' : 'Play ▶'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--ifm-color-emphasis-300)',
            background: 'transparent',
            color: 'var(--ifm-font-color-base)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Reset
        </button>
      </div>

      {/* SVG diagram */}
      <div style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 10,
        background: 'var(--ifm-background-surface-color)',
        overflow: 'hidden',
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--ifm-color-emphasis-500)" />
            </marker>
            <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--ifm-color-primary)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const { d, mx, my } = edgePath(edge.from, edge.to);
            const isActive = step === i && running && phase === 'legs';
            const isDone = step > i || (phase === 'shrink' && i <= 1);
            return (
              <g key={`edge-${i}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={isDone ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)'}
                  strokeWidth={isDone ? 2.5 : 1.5}
                  strokeDasharray={isActive ? '6 4' : 'none'}
                  markerEnd={isDone ? 'url(#arrow-active)' : 'url(#arrow)'}
                  opacity={isActive || isDone ? 1 : 0.4}
                />
                <text
                  x={mx} y={my - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isDone ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-600)'}
                  fontWeight={isDone ? 600 : 400}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Blob store vertical connector */}
          <line
            x1={NODES[2].x} y1={NODES[2].y + BLOB_R}
            x2={NODES[1].x} y2={NODES[1].y - NODE_R}
            stroke="var(--ifm-color-emphasis-200)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />

          {/* Nodes */}
          {NODES.map((n) => {
            const isBlob = n.id === 'blob';
            const r = isBlob ? BLOB_R : NODE_R;
            const active = isBlob && isBlobActive;
            return (
              <g key={n.id}>
                <circle
                  cx={n.x} cy={n.y} r={r}
                  fill={active ? 'var(--ifm-color-warning-contrast-background, #fffbeb)' : 'var(--ifm-background-surface-color)'}
                  stroke={active ? 'var(--ifm-color-warning)' : 'var(--ifm-color-emphasis-400)'}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <text
                  x={n.x} y={n.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--ifm-font-color-base)"
                >
                  {n.label.includes(' ')
                    ? n.label.split(' ').map((word, wi) => (
                        <tspan key={wi} x={n.x} dy={wi === 0 ? -6 : 13}>{word}</tspan>
                      ))
                    : n.label}
                </text>
              </g>
            );
          })}

          {/* Particles */}
          {particles.map((p) => {
            const edge = edges[p.edgeIdx];
            const pos = bezierPoint(edge.from, edge.to, p.t);
            // Color flips from danger to primary halfway through the shrink
            const isRed = p.large && p.labelOpacity > 0.5;
            const color = isRed ? 'var(--ifm-color-danger)' : 'var(--ifm-color-primary)';
            return (
              <g key={p.id}>
                <circle cx={pos.x} cy={pos.y} r={p.r} fill={color} opacity={0.9} />
                {p.large && p.labelOpacity > 0 && (
                  <text
                    x={pos.x} y={pos.y - 15}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--ifm-color-danger)"
                    fontWeight={700}
                    opacity={p.labelOpacity}
                  >
                    large
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginTop: '0.6rem' }}>
        {mode === 'encode'
          ? 'Encode: large payload goes to the blob store; only a tiny reference enters Cadence history.'
          : 'Decode: worker reads the reference from history, fetches the full payload from the blob store.'}
      </p>
    </div>
  );
}
