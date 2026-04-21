import React, { useState, useEffect, useCallback, useRef } from "react";

const STEPS = [
  {
    label: "1",
    description: "1. Matching instances send heartbeats to Shard Manager",
  },
  {
    label: "2",
    description: "2. Shard Manager responds with shard assignments",
  },
  { label: "3", description: "3. Shard Manager pushes routing map to Frontend" },
  { label: "4", description: "4. Frontend receives client request" },
  {
    label: "5",
    description: "5. Frontend routes directly to Matching Instance 2 → TL3",
  },
];

const STEP_PAUSE_MS = 600;
const LOOP_PAUSE_MS = 1500;

// Layout constants
const W = 720;
const H = 340;

// Box positions
const SM = { x: 480, y: 50, w: 200, h: 50 };
const FE = { x: 40, y: 10, w: 200, h: 110 };
const M1 = { x: 40, y: 250, w: 180, h: 70 };
const M2 = { x: 270, y: 250, w: 180, h: 70 };
const M3 = { x: 500, y: 250, w: 180, h: 70 };

// Connection endpoints
const smLeft = { x: SM.x, y: SM.y + SM.h / 2 };
const smBot = { x: SM.x + SM.w / 2, y: SM.y + SM.h };
const feRight = { x: FE.x + FE.w, y: FE.y + 18 };
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

const ROUTING_ENTRIES = [
  { tl: "TL1,2", inst: "M1" },
  { tl: "TL3,4", inst: "M2" },
  { tl: "TL5,6", inst: "M3" },
];

function RoutingMap({ visible }: { visible: boolean }) {
  const x = FE.x + 10;
  const y = FE.y + 30;
  const rowH = 18;
  const colW = 80;

  if (!visible) {
    return (
      <text
        x={FE.x + FE.w / 2}
        y={FE.y + 70}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
        fontStyle="italic"
        fill="#94a3b8"
      >
        routing map empty
      </text>
    );
  }

  return (
    <g>
      {/* Header */}
      <text
        x={x + 4}
        y={y + 12}
        fontSize={10}
        fontFamily="system-ui, sans-serif"
        fontWeight={700}
        fill="#64748b"
      >
        TaskList
      </text>
      <text
        x={x + colW + 4}
        y={y + 12}
        fontSize={10}
        fontFamily="system-ui, sans-serif"
        fontWeight={700}
        fill="#64748b"
      >
        Owner
      </text>
      <line
        x1={x}
        y1={y + 16}
        x2={x + FE.w - 20}
        y2={y + 16}
        stroke="#cbd5e1"
        strokeWidth={0.5}
      />
      {/* Rows */}
      {ROUTING_ENTRIES.map((entry, i) => {
        const ry = y + 20 + i * rowH;
        return (
          <g key={i}>
            <text
              x={x + 4}
              y={ry + 10}
              fontSize={10}
              fontFamily="monospace"
              fill="#334155"
            >
              {entry.tl}
            </text>
            <text
              x={x + colW + 4}
              y={ry + 10}
              fontSize={10}
              fontFamily="monospace"
              fontWeight={600}
              fill="#1d4ed8"
            >
              → {entry.inst}
            </text>
          </g>
        );
      })}
    </g>
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

type StepButtonVariant = "primary" | "secondary" | "ghost";

function StepButton({
  onClick,
  disabled = false,
  variant,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant: StepButtonVariant;
  children: React.ReactNode;
}) {
  const baseStyle: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "system-ui, sans-serif",
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: 36,
    transition: "background 0.15s ease, color 0.15s ease",
  };
  const variantStyles: Record<StepButtonVariant, React.CSSProperties> = {
    primary: {
      background: disabled ? "#e2e8f0" : "#3b82f6",
      color: disabled ? "#94a3b8" : "#fff",
      border: "1px solid transparent",
    },
    secondary: {
      background: "#fff",
      color: "#334155",
      border: "1px solid #cbd5e1",
    },
    ghost: {
      background: "transparent",
      color: disabled ? "#94a3b8" : "#475569",
      border: "1px solid transparent",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
}

export default function ArchitectureFlow() {
  const [stepIdx, setStepIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // playToken is used as a React `key` on the animation components so that
  // re-clicking the current step (or resuming auto-play) always re-mounts
  // the animation and replays it from the start.
  const [playToken, setPlayToken] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const handleStepDone = useCallback(() => {
    if (!isAutoPlaying) return;
    const isLastStep = stepIdx === STEPS.length - 1;
    const pauseMs = isLastStep ? LOOP_PAUSE_MS : STEP_PAUSE_MS;
    timerRef.current = setTimeout(() => {
      setStepIdx((idx) => (idx + 1) % STEPS.length);
      setPlayToken((t) => t + 1);
    }, pauseMs);
  }, [isAutoPlaying, stepIdx]);

  const goToStep = useCallback(
    (idx: number) => {
      clearTimer();
      setIsAutoPlaying(false);
      setStepIdx(idx);
      setPlayToken((t) => t + 1);
    },
    [clearTimer]
  );

  const handlePrev = useCallback(() => {
    if (stepIdx > 0) goToStep(stepIdx - 1);
  }, [stepIdx, goToStep]);

  const handleNext = useCallback(() => {
    goToStep((stepIdx + 1) % STEPS.length);
  }, [stepIdx, goToStep]);

  const handleToggleAutoPlay = useCallback(() => {
    clearTimer();
    setIsAutoPlaying((playing) => !playing);
    // Always bump playToken so resuming replays the current step animation
    // and the auto-play loop picks up immediately.
    setPlayToken((t) => t + 1);
  }, [clearTimer]);

  // Derived rendering state
  const isHeartbeatLinesShown = stepIdx === 0 || stepIdx === 1;
  const isSMtoFEHighlighted = stepIdx === 2;
  const isFEtoM2Highlighted = stepIdx === 4;
  const isSMHighlighted = stepIdx <= 2;
  const isFEHighlighted = stepIdx === 3;
  const isM1Highlighted = stepIdx <= 1;
  const isM2Highlighted = stepIdx <= 1 || stepIdx === 4;
  const isM3Highlighted = stepIdx <= 1;
  const isRoutingMapVisible = stepIdx >= 3;
  const isTL3Highlighted = stepIdx === 4;

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
          x1={smLeft.x}
          y1={smLeft.y}
          x2={feRight.x}
          y2={feRight.y}
          highlight={isSMtoFEHighlighted}
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
          highlight={isFEtoM2Highlighted}
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
          highlight={isHeartbeatLinesShown}
        />
        <DashedLine
          x1={m2Hb.x}
          y1={m2Hb.y}
          x2={smBot.x}
          y2={smBot.y}
          highlight={isHeartbeatLinesShown}
        />
        <DashedLine
          x1={m3Hb.x}
          y1={m3Hb.y}
          x2={smBot.x}
          y2={smBot.y}
          highlight={isHeartbeatLinesShown}
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
          highlight={isSMHighlighted}
        />

        {/* Frontend */}
        <Box
          x={FE.x}
          y={FE.y}
          w={FE.w}
          h={FE.h}
          label="Frontend Service"
          highlight={isFEHighlighted}
        />
        <RoutingMap visible={isRoutingMapVisible} />

        {/* Matching Instances */}
        <Box
          x={M1.x}
          y={M1.y}
          w={M1.w}
          h={M1.h}
          label="Matching Instance 1"
          highlight={isM1Highlighted}
        />
        <TaskListBoxes parent={M1} labels={["TL1", "TL2"]} />

        <Box
          x={M2.x}
          y={M2.y}
          w={M2.w}
          h={M2.h}
          label="Matching Instance 2"
          highlight={isM2Highlighted}
        />
        <TaskListBoxes
          parent={M2}
          labels={["TL3", "TL4"]}
          highlightIdx={isTL3Highlighted ? 0 : undefined}
        />

        <Box
          x={M3.x}
          y={M3.y}
          w={M3.w}
          h={M3.h}
          label="Matching Instance 3"
          highlight={isM3Highlighted}
        />
        <TaskListBoxes parent={M3} labels={["TL5", "TL6"]} />

        {/* Step 1a: heartbeat dots from all matching instances to SM */}
        {stepIdx === 0 && (
          <HeartbeatDots
            key={`hb-${playToken}`}
            duration={1200}
            onDone={handleStepDone}
          />
        )}

        {/* Step 1b: SM responds back to matching instances */}
        {stepIdx === 1 && (
          <HeartbeatDots
            key={`hb-rev-${playToken}`}
            reverse
            duration={1800}
            onDone={handleStepDone}
          />
        )}

        {/* Step 2: dot from SM to FE */}
        {stepIdx === 2 && (
          <AnimatedDot
            key={`sm-fe-${playToken}`}
            x1={smLeft.x}
            y1={smLeft.y}
            x2={feRight.x}
            y2={feRight.y}
            color="#3b82f6"
            duration={1200}
            onDone={handleStepDone}
          />
        )}

        {/* Step 3: envelope enters from left to FE */}
        {stepIdx === 3 && (
          <AnimatedEnvelope
            key={`req-${playToken}`}
            x1={-20}
            y1={feLeft.y}
            x2={feLeft.x}
            y2={feLeft.y}
            duration={1000}
            onDone={handleStepDone}
          />
        )}

        {/* Step 4: envelope from FE to M2/TL3 */}
        {stepIdx === 4 && (
          <AnimatedEnvelope
            key={`route-${playToken}`}
            x1={feBot.x}
            y1={feBot.y}
            x2={tl3Center.x}
            y2={tl3Center.y}
            duration={1200}
            onDone={handleStepDone}
          />
        )}
      </svg>

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <StepButton
            onClick={handlePrev}
            disabled={stepIdx === 0}
            variant="ghost"
          >
            Prev
          </StepButton>
          {STEPS.map((s, i) => (
            <StepButton
              key={s.label}
              onClick={() => goToStep(i)}
              variant={i === stepIdx ? "primary" : "secondary"}
            >
              {s.label}
            </StepButton>
          ))}
          <StepButton onClick={handleNext} variant="primary">
            Next
          </StepButton>
          <div style={{ marginLeft: "auto" }}>
            <StepButton
              onClick={handleToggleAutoPlay}
              variant={isAutoPlaying ? "primary" : "secondary"}
            >
              {isAutoPlaying ? "⏸ Pause" : "▶ Auto-play"}
            </StepButton>
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#475569",
            fontFamily: "system-ui, sans-serif",
            minHeight: 20,
          }}
        >
          {STEPS[stepIdx].description}
        </div>
      </div>
    </div>
  );
}
