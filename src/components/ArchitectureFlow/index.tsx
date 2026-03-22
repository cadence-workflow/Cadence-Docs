import React, { useState, useEffect, useCallback, useRef } from "react";

const STEP_LABELS: Record<number, string> = {
  0: "1a. Matching instances send heartbeats to Shard Manager",
  0.5: "1b. Shard Manager responds with shard assignments",
  1: "2. Shard Manager pushes routing map to Frontend",
  2: "3. Frontend receives client request",
  3: "4. Frontend routes directly to Matching Instance 2 → TL3",
};

// Layout constants
const W = 720;
const H = 370;

// Box positions
const SM = { x: 480, y: 20, w: 200, h: 50 };
const FE = { x: 40, y: 130, w: 180, h: 50 };
const M1 = { x: 40, y: 280, w: 180, h: 70 };
const M2 = { x: 270, y: 280, w: 180, h: 70 };
const M3 = { x: 500, y: 280, w: 180, h: 70 };

// Connection endpoints
const smOut = { x: SM.x, y: SM.y + SM.h / 2 };
const smBot = { x: SM.x + SM.w / 2, y: SM.y + SM.h };
const feTop = { x: FE.x + FE.w / 2, y: FE.y };
const feBot = { x: FE.x + FE.w / 2, y: FE.y + FE.h };
const feLeft = { x: FE.x, y: FE.y + FE.h / 2 };
const m1Top = { x: M1.x + M1.w / 2, y: M1.y };
const m2Top = { x: M2.x + M2.w / 2, y: M2.y };
const m3Top = { x: M3.x + M3.w / 2, y: M3.y };

// Heartbeat endpoints (from matching instance top-right area toward SM)
const m1Hb = { x: M1.x + M1.w - 20, y: M1.y };
const m2Hb = { x: M2.x + M2.w - 20, y: M2.y };
const m3Hb = { x: M3.x + M3.w / 2, y: M3.y };

// TL3 center inside M2
const tl3Center = { x: M2.x + 45, y: M2.y + 45 };

// Steps: 0=heartbeats, 1=push, 2=request, 3=route, then pause and loop
const PAUSE_MS = 1200;

function Box({
  x,
  y,
  w,
  h,
  label,
  color = "#e8eef4",
  stroke = "#94a3b8",
  highlight = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color?: string;
  stroke?: string;
  highlight?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={highlight ? "#dbeafe" : color}
        stroke={highlight ? "#3b82f6" : stroke}
        strokeWidth={highlight ? 2 : 1.5}
      />
      <text
        x={x + w / 2}
        y={y + (h > 60 ? 18 : h / 2 + 1)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13}
        fontFamily="system-ui, sans-serif"
        fontWeight={600}
        fill="#1e293b"
      >
        {label}
      </text>
    </g>
  );
}

function TaskListBoxes({
  parent,
  labels,
  highlightIdx,
}: {
  parent: typeof M1;
  labels: [string, string];
  highlightIdx?: number;
}) {
  const bw = 60;
  const bh = 26;
  const gap = 16;
  const startX = parent.x + (parent.w - bw * 2 - gap) / 2;
  const by = parent.y + 30;

  return (
    <>
      {labels.map((lbl, i) => {
        const bx = startX + i * (bw + gap);
        const hl = highlightIdx === i;
        return (
          <g key={lbl}>
            <rect
              x={bx}
              y={by}
              width={bw}
              height={bh}
              rx={4}
              fill={hl ? "#bfdbfe" : "#f8fafc"}
              stroke={hl ? "#2563eb" : "#cbd5e1"}
              strokeWidth={hl ? 2 : 1}
            />
            <text
              x={bx + bw / 2}
              y={by + bh / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontFamily="system-ui, sans-serif"
              fontWeight={500}
              fill={hl ? "#1d4ed8" : "#475569"}
            >
              {lbl}
            </text>
          </g>
        );
      })}
    </>
  );
}

function DashedLine({
  x1,
  y1,
  x2,
  y2,
  highlight = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  highlight?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={highlight ? "#3b82f6" : "#cbd5e1"}
      strokeWidth={highlight ? 2 : 1.5}
      strokeDasharray={highlight ? "none" : "6 4"}
    />
  );
}

function AnimatedDot({
  x1,
  y1,
  x2,
  y2,
  color,
  radius = 7,
  duration,
  onDone,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  radius?: number;
  duration: number;
  onDone?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onDoneRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const cx = x1 + (x2 - x1) * progress;
  const cy = y1 + (y2 - y1) * progress;

  return <circle cx={cx} cy={cy} r={radius} fill={color} opacity={0.9} />;
}

function Envelope({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 8}, ${y - 6})`}>
      <rect
        width={16}
        height={12}
        rx={2}
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth={1}
      />
      <polyline
        points="0,0 8,7 16,0"
        fill="none"
        stroke="#d97706"
        strokeWidth={1}
      />
    </g>
  );
}

function AnimatedEnvelope({
  x1,
  y1,
  x2,
  y2,
  duration,
  onDone,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  duration: number;
  onDone?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onDoneRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const cx = x1 + (x2 - x1) * progress;
  const cy = y1 + (y2 - y1) * progress;

  return <Envelope x={cx} y={cy} />;
}

// Heartbeat dots traveling between matching instances and SM
function HeartbeatDots({
  duration,
  reverse = false,
  onDone,
}: {
  duration: number;
  reverse?: boolean;
  onDone?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onDoneRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  const sources = [m1Hb, m2Hb, m3Hb];
  const assignments = [["TL1", "TL2"], ["TL3", "TL4"], ["TL5", "TL6"]];
  const color = reverse ? "#6366f1" : "#10b981";

  return (
    <>
      {sources.map((src, i) => {
        const fromX = reverse ? smBot.x : src.x;
        const fromY = reverse ? smBot.y : src.y;
        const toX = reverse ? src.x : smBot.x;
        const toY = reverse ? src.y : smBot.y;
        const cx = fromX + (toX - fromX) * progress;
        const cy = fromY + (toY - fromY) * progress;
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={5}
              fill={color}
              opacity={0.85}
            />
            {reverse && (() => {
              const label = assignments[i].join(", ");
              const tw = label.length * 6.5 + 8;
              const th = 16;
              return (
                <g>
                  <rect
                    x={cx + 8}
                    y={cy - th / 2}
                    width={tw}
                    height={th}
                    rx={3}
                    fill="#eef2ff"
                    stroke="#c7d2fe"
                    strokeWidth={1}
                  />
                  <text
                    x={cx + 8 + tw / 2}
                    y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontFamily="system-ui, sans-serif"
                    fontWeight={600}
                    fill="#4338ca"
                  >
                    {label}
                  </text>
                </g>
              );
            })()}
          </g>
        );
      })}
    </>
  );
}

export default function ArchitectureFlow() {
  const [step, setStep] = useState(0);
  const [looping, setLooping] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceTo = useCallback((next: number) => {
    setStep(next);
  }, []);

  // Auto-start and loop
  useEffect(() => {
    if (!looping) return;
    // Start at step 0
    setStep(0);
  }, [looping]);

  // After step 3 animation completes, pause then loop back to 0
  const handleStepDone = useCallback(
    (completedStep: number) => {
      if (!looping) return;
      const nextSteps: Record<number, number> = {
        0: 0.5,
        0.5: 1,
        1: 2,
        2: 3,
      };
      const next = nextSteps[completedStep];
      if (next !== undefined) {
        advanceTo(next);
      } else {
        // completedStep === 3, pause then restart
        timerRef.current = setTimeout(() => {
          setStep(-1);
          requestAnimationFrame(() => setStep(0));
        }, PAUSE_MS);
      }
    },
    [looping, advanceTo]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Heartbeat connection lines (from matching instances toward SM)
  const showHeartbeatLines = step === 0 || step === 0.5;

  return (
    <div
      style={{
        margin: "24px 0",
        padding: "16px",
        background: "#f8fafc",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", maxWidth: 720 }}
      >
        {/* Connections: SM to FE */}
        <DashedLine
          x1={smOut.x}
          y1={smOut.y}
          x2={feTop.x}
          y2={feTop.y}
          highlight={step === 1}
        />

        {/* Connections: FE to matching instances */}
        <DashedLine
          x1={feBot.x}
          y1={feBot.y}
          x2={m1Top.x}
          y2={m1Top.y}
        />
        <DashedLine
          x1={feBot.x}
          y1={feBot.y}
          x2={m2Top.x}
          y2={m2Top.y}
          highlight={step === 3}
        />
        <DashedLine
          x1={feBot.x}
          y1={feBot.y}
          x2={m3Top.x}
          y2={m3Top.y}
        />

        {/* Heartbeat lines: matching instances to SM */}
        <DashedLine
          x1={m1Hb.x}
          y1={m1Hb.y}
          x2={smBot.x}
          y2={smBot.y}
          highlight={showHeartbeatLines}
        />
        <DashedLine
          x1={m2Hb.x}
          y1={m2Hb.y}
          x2={smBot.x}
          y2={smBot.y}
          highlight={showHeartbeatLines}
        />
        <DashedLine
          x1={m3Hb.x}
          y1={m3Hb.y}
          x2={smBot.x}
          y2={smBot.y}
          highlight={showHeartbeatLines}
        />

        {/* Shard Manager */}
        <Box
          x={SM.x}
          y={SM.y}
          w={SM.w}
          h={SM.h}
          label="Shard Manager"
          color="#dbeafe"
          stroke="#3b82f6"
          highlight={step === 0 || step === 0.5 || step === 1}
        />

        {/* Frontend */}
        <Box
          x={FE.x}
          y={FE.y}
          w={FE.w}
          h={FE.h}
          label="Frontend Service"
          highlight={step === 2}
        />

        {/* Matching Instances */}
        <Box
          x={M1.x}
          y={M1.y}
          w={M1.w}
          h={M1.h}
          label="Matching Instance 1"
          highlight={step === 0 || step === 0.5}
        />
        <TaskListBoxes parent={M1} labels={["TL1", "TL2"]} />

        <Box
          x={M2.x}
          y={M2.y}
          w={M2.w}
          h={M2.h}
          label="Matching Instance 2"
          highlight={step === 0 || step === 0.5 || step === 3}
        />
        <TaskListBoxes
          parent={M2}
          labels={["TL3", "TL4"]}
          highlightIdx={step === 3 ? 0 : undefined}
        />

        <Box
          x={M3.x}
          y={M3.y}
          w={M3.w}
          h={M3.h}
          label="Matching Instance 3"
          highlight={step === 0 || step === 0.5}
        />
        <TaskListBoxes parent={M3} labels={["TL5", "TL6"]} />

        {/* Step 0: heartbeat dots from all matching instances to SM */}
        {step === 0 && (
          <HeartbeatDots
            duration={1200}
            onDone={() => handleStepDone(0)}
          />
        )}

        {/* Step 0.5: SM responds back to matching instances */}
        {step === 0.5 && (
          <HeartbeatDots
            reverse
            duration={1800}
            onDone={() => handleStepDone(0.5)}
          />
        )}

        {/* Step 1: dot from SM to FE */}
        {step === 1 && (
          <AnimatedDot
            x1={smOut.x}
            y1={smOut.y}
            x2={feTop.x}
            y2={feTop.y}
            color="#3b82f6"
            duration={1200}
            onDone={() => handleStepDone(1)}
          />
        )}

        {/* Step 2: envelope enters from left to FE */}
        {step === 2 && (
          <AnimatedEnvelope
            x1={-20}
            y1={feLeft.y}
            x2={feLeft.x}
            y2={feLeft.y}
            duration={1000}
            onDone={() => handleStepDone(2)}
          />
        )}

        {/* Step 3: envelope from FE to M2/TL3 */}
        {step === 3 && (
          <AnimatedEnvelope
            x1={feBot.x}
            y1={feBot.y}
            x2={tl3Center.x}
            y2={tl3Center.y}
            duration={1200}
            onDone={() => handleStepDone(3)}
          />
        )}
      </svg>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 12,
        }}
      >
        <button
          onClick={() => setLooping((v) => !v)}
          style={{
            padding: "8px 20px",
            background: looping ? "#64748b" : "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {looping ? "Pause" : "Play"}
        </button>
        <span
          style={{
            fontSize: 13,
            color: "#475569",
            fontFamily: "system-ui, sans-serif",
            minHeight: 20,
          }}
        >
          {step >= 0 ? STEP_LABELS[step] ?? "" : ""}
        </span>
      </div>
    </div>
  );
}
