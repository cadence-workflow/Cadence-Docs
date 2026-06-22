import React, { useEffect, useRef, useState } from 'react';

// ─── Layout ────────────────────────────────────────────────────────────────
const W = 700;
const H = 180;
const NODE_R = 36;

const NODES = [
  { id: 'worker',  label: 'Worker',        x: 80,  y: 90 },
  { id: 'conv',    label: 'DataConverter', x: 280, y: 90 },
  { id: 'key',     label: 'Key',           x: 280, y: 30 },
  { id: 'history', label: 'History',       x: 560, y: 90 },
];

type Mode = 'encode' | 'decode' | 'missing-key';

const EDGES: Record<Mode, { from: string; to: string; label: string; danger?: boolean }[]> = {
  encode: [
    { from: 'worker',  to: 'conv',    label: 'plaintext' },
    { from: 'key',     to: 'conv',    label: 'AES key' },
    { from: 'conv',    to: 'history', label: 'encrypted blob' },
  ],
  decode: [
    { from: 'history', to: 'conv',    label: 'encrypted blob' },
    { from: 'key',     to: 'conv',    label: 'AES key' },
    { from: 'conv',    to: 'worker',  label: 'plaintext' },
  ],
  'missing-key': [
    { from: 'history', to: 'conv',    label: 'encrypted blob' },
    { from: 'conv',    to: 'worker',  label: 'decode error', danger: true },
  ],
};

const MODE_LABELS: Record<Mode, string> = {
  encode: 'Encode',
  decode: 'Decode',
  'missing-key': 'Missing key',
};

const SPEED = 0.009;
let nextId = 0;

type Particle = {
  id: number;
  edgeIdx: number;
  t: number;
  danger: boolean;
  encrypted: boolean; // determines color/shape
};

function nodePos(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function edgePath(from: string, to: string) {
  const f = nodePos(from);
  const t = nodePos(to);
  const cx = (f.x + t.x) / 2;
  const cy = (f.y + t.y) / 2 - 20;
  return {
    d: `M ${f.x} ${f.y} Q ${cx} ${cy} ${t.x} ${t.y}`,
    mx: cx,
    my: cy - 4,
  };
}

function bezierPoint(from: string, to: string, t: number) {
  const f = nodePos(from);
  const tk = nodePos(to);
  const cx = (f.x + tk.x) / 2;
  const cy = (f.y + tk.y) / 2 - 20;
  return {
    x: (1 - t) ** 2 * f.x + 2 * (1 - t) * t * cx + t ** 2 * tk.x,
    y: (1 - t) ** 2 * f.y + 2 * (1 - t) * t * cy + t ** 2 * tk.y,
  };
}

export default function EncryptionFlowDemo() {
  const [mode, setMode] = useState<Mode>('encode');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);

  const edges = EDGES[mode];

  function reset() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setParticles([]);
    setStep(0);
    setRunning(false);
  }

  function play() { reset(); setRunning(true); }

  useEffect(() => { reset(); }, [mode]);

  useEffect(() => {
    if (!running) return;
    if (step >= edges.length) { setRunning(false); return; }

    const edge = edges[step];
    const pid = nextId++;
    // A particle is "encrypted" (square-ish, blue) when carrying ciphertext
    const encrypted = edge.label === 'encrypted blob';
    const danger = !!edge.danger;

    setParticles((prev) => [...prev, { id: pid, edgeIdx: step, t: 0, danger, encrypted }]);

    let localT = 0;
    function tick() {
      localT = Math.min(localT + SPEED, 1);
      setParticles((prev) => prev.map((p) => p.id === pid ? { ...p, t: localT } : p));
      if (localT < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setParticles((prev) => prev.filter((p) => p.id !== pid));
        setStep((s) => s + 1);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step]);

  const keyActive = particles.some((p) => {
    const edge = edges[p.edgeIdx];
    return edge && (edge.from === 'key' || edge.to === 'key');
  });

  const isMissingKey = mode === 'missing-key';

  return (
    <div style={{ margin: '2rem 0' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['encode', 'decode', 'missing-key'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '5px 16px',
              borderRadius: 6,
              background: 'transparent',
              color: mode === m ? 'var(--ifm-color-primary)' : 'var(--ifm-font-color-base)',
              border: 'none',
              borderBottom: mode === m ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {MODE_LABELS[m]}
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
          {running ? 'Animating...' : 'Play \u25B6'}
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

      {/* SVG */}
      <div style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 10,
        background: 'var(--ifm-background-surface-color)',
        overflow: 'hidden',
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          <defs>
            <marker id="enc-arrow" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0,8 3,0 6" fill="var(--ifm-color-emphasis-500)" />
            </marker>
            <marker id="enc-arrow-done" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0,8 3,0 6" fill="var(--ifm-color-primary)" />
            </marker>
            <marker id="enc-arrow-danger" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
              <polygon points="0 0,8 3,0 6" fill="var(--ifm-color-danger)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const { d, mx, my } = edgePath(edge.from, edge.to);
            const isDone = step > i;
            const isActive = step === i && running;
            const isDanger = !!edge.danger;
            const stroke = isDanger && isDone
              ? 'var(--ifm-color-danger)'
              : isDone
              ? 'var(--ifm-color-primary)'
              : 'var(--ifm-color-emphasis-300)';
            const marker = isDanger && isDone
              ? 'url(#enc-arrow-danger)'
              : isDone
              ? 'url(#enc-arrow-done)'
              : 'url(#enc-arrow)';
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isDone ? 2.5 : 1.5}
                  strokeDasharray={isActive ? '6 4' : 'none'}
                  markerEnd={marker}
                  opacity={isActive || isDone ? 1 : 0.4}
                />
                <text
                  x={mx} y={my}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isDanger && isDone ? 'var(--ifm-color-danger)' : isDone ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-600)'}
                  fontWeight={isDone ? 600 : 400}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((n) => {
            const isKey = n.id === 'key';
            const isMissing = isKey && isMissingKey;
            const isActive = isKey && keyActive;
            // Hide key node in missing-key mode
            if (isMissing) {
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={NODE_R * 0.7}
                    fill="var(--ifm-background-surface-color)"
                    stroke="var(--ifm-color-danger)"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                  />
                  <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle"
                    fontSize={9} fontWeight={600} fill="var(--ifm-color-danger)">
                    No key
                  </text>
                </g>
              );
            }
            if (isKey) {
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={NODE_R * 0.7}
                    fill={isActive ? 'var(--ifm-color-warning-contrast-background, #fffbeb)' : 'var(--ifm-background-surface-color)'}
                    stroke={isActive ? 'var(--ifm-color-warning)' : 'var(--ifm-color-emphasis-400)'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fontWeight={600} fill="var(--ifm-font-color-base)">
                    {n.label}
                  </text>
                </g>
              );
            }
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={NODE_R}
                  fill="var(--ifm-background-surface-color)"
                  stroke="var(--ifm-color-emphasis-400)"
                  strokeWidth={1.5}
                />
                <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={10} fontWeight={600} fill="var(--ifm-font-color-base)">
                  {n.label.includes(' ')
                    ? n.label.split(' ').map((w, wi) => (
                        <tspan key={wi} x={n.x} dy={wi === 0 ? -6 : 13}>{w}</tspan>
                      ))
                    : n.label}
                </text>
              </g>
            );
          })}

          {/* Particles */}
          {particles.map((p) => {
            const edge = edges[p.edgeIdx];
            if (!edge) return null;
            const pos = bezierPoint(edge.from, edge.to, p.t);
            if (p.danger) {
              // Render as an X for error
              const s = 6;
              return (
                <g key={p.id}>
                  <line x1={pos.x - s} y1={pos.y - s} x2={pos.x + s} y2={pos.y + s}
                    stroke="var(--ifm-color-danger)" strokeWidth={2.5} strokeLinecap="round" />
                  <line x1={pos.x + s} y1={pos.y - s} x2={pos.x - s} y2={pos.y + s}
                    stroke="var(--ifm-color-danger)" strokeWidth={2.5} strokeLinecap="round" />
                </g>
              );
            }
            if (p.encrypted) {
              // Render as a small square (locked payload)
              const s = 7;
              return (
                <rect key={p.id}
                  x={pos.x - s} y={pos.y - s} width={s * 2} height={s * 2}
                  rx={2}
                  fill="var(--ifm-color-primary)"
                  opacity={0.9}
                />
              );
            }
            // Plaintext: circle
            return (
              <circle key={p.id}
                cx={pos.x} cy={pos.y} r={7}
                fill="var(--ifm-color-success)"
                opacity={0.9}
              />
            );
          })}
        </svg>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginTop: '0.6rem' }}>
        {mode === 'encode' && 'Encode: plaintext JSON is wrapped with AES-256-GCM; only an opaque blob enters Cadence history.'}
        {mode === 'decode' && 'Decode: the worker presents the key, the DataConverter verifies the GCM tag, and plaintext is returned.'}
        {mode === 'missing-key' && 'Missing key: without the AES key, FromData returns an error on every attempt. The task retries indefinitely.'}
      </p>
    </div>
  );
}
