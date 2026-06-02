import React, { useState, useEffect, useRef } from "react";

const PATTERNS = [
  {
    id: "compression",
    label: "Compression",
    color: "#2563eb",
    inputLabel: "JSON payload",
    inputSample: `{\n  "email": "alice@example.com",\n  "order": 149.99\n}`,
    historyLabel: "gzip bytes",
    historySample: "H4sIAAAAAAAA/6pWKkkt\nLlGyUlIqS...",
    historyNote: "Smaller, but decodable with access",
  },
  {
    id: "claimcheck",
    label: "Claim-check",
    color: "#16a34a",
    inputLabel: "JSON payload",
    inputSample: `{\n  "email": "alice@example.com",\n  "order": 149.99\n}`,
    historyLabel: "blob reference",
    historySample: `{\n  "blobRef": "s3://bucket/\n  a3f9b2c1d4e5..."\n}`,
    historyNote: "Payload lives in external storage",
  },
  {
    id: "encryption",
    label: "Encryption",
    color: "#dc2626",
    inputLabel: "JSON payload",
    inputSample: `{\n  "email": "alice@example.com",\n  "order": 149.99\n}`,
    historyLabel: "AES-256-GCM bytes",
    historySample: "3f9a1c8b4d2e...\n[nonce · ciphertext · tag]",
    historyNote: "Opaque without your key",
  },
];

type AnimPhase = "idle" | "encoding" | "traveling" | "done";

export default function PayloadFlow() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [particleX, setParticleX] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const pattern = PATTERNS[activeIdx];

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function runAnimation() {
    clearTimer();
    setPhase("encoding");
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase("traveling");
      let x = 0;
      const tick = () => {
        if (!mountedRef.current) return;
        x += 2.5;
        setParticleX(x);
        if (x < 100) {
          timerRef.current = setTimeout(tick, 16);
        } else {
          setPhase("done");
        }
      };
      timerRef.current = setTimeout(tick, 16);
    }, 600);
  }

  useEffect(() => {
    setPhase("idle");
    setParticleX(0);
    clearTimer();
  }, [activeIdx]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, []);

  const isDone = phase === "done";
  const isEncoding = phase === "encoding";

  return (
    <div
      style={{
        border: "1px solid var(--ifm-color-emphasis-300)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        background: "var(--ifm-background-surface-color)",
      }}
    >
      {/* Tab strip */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {PATTERNS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActiveIdx(i)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "2px solid",
              borderColor: i === activeIdx ? p.color : "var(--ifm-color-emphasis-300)",
              background: i === activeIdx ? p.color : "var(--ifm-background-color)",
              color: i === activeIdx ? "white" : "var(--ifm-color-content)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Flow diagram */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {/* Input box */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
              color: "var(--ifm-color-content-secondary)",
            }}
          >
            Your workflow code
          </div>
          <div
            style={{
              borderRadius: 8,
              padding: "12px 16px",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre",
              background: "var(--ifm-code-background)",
              color: "var(--ifm-color-content-secondary)",
              border: "1px solid var(--ifm-color-emphasis-200)",
            }}
          >
            <span style={{ opacity: 0.6 }}>{"// "}{pattern.inputLabel}{"\n"}</span>
            <span style={{ color: pattern.color }}>{pattern.inputSample}</span>
          </div>
        </div>

        {/* Arrow + DataConverter label */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 8px",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: isEncoding ? pattern.color : "var(--ifm-color-content-secondary)",
              textAlign: "center",
              transition: "color 0.3s",
              maxWidth: 72,
            }}
          >
            DataConverter
          </div>
          <div style={{ position: "relative", width: 72, height: 20 }}>
            {/* Track */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: 4,
                background: "var(--ifm-color-emphasis-300)",
                transform: "translateY(-50%)",
              }}
            />
            {/* Particle */}
            {phase === "traveling" && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${particleX}%`,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: pattern.color,
                  transform: "translate(-50%, -50%)",
                  transition: "left 16ms linear",
                  boxShadow: `0 0 10px ${pattern.color}`,
                }}
              />
            )}
            {/* Arrowhead */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                borderLeft: `12px solid ${isDone ? pattern.color : "var(--ifm-color-emphasis-400)"}`,
                borderTop: "8px solid transparent",
                borderBottom: "8px solid transparent",
                transition: "border-color 0.3s",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--ifm-color-content-secondary)",
              textAlign: "center",
              maxWidth: 72,
            }}
          >
            encode
          </div>
        </div>

        {/* History box */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
              color: "var(--ifm-color-content-secondary)",
            }}
          >
            Cadence history
          </div>
          <div
            style={{
              borderRadius: 8,
              padding: "12px 16px",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre",
              background: isDone ? "var(--ifm-code-background)" : "var(--ifm-color-emphasis-100)",
              color: isDone ? pattern.color : "var(--ifm-color-emphasis-400)",
              border: `1px solid ${isDone ? pattern.color : "var(--ifm-color-emphasis-200)"}`,
              transition: "all 0.3s",
            }}
          >
            <span style={{ opacity: 0.6 }}>
              {"// "}{isDone ? pattern.historyLabel : "waiting..."}{"\n"}
            </span>
            {isDone ? pattern.historySample : "···"}
          </div>
          {isDone && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: pattern.color,
                fontStyle: "italic",
              }}
            >
              {pattern.historyNote}
            </div>
          )}
        </div>
      </div>

      {/* Play button */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
        <button
          onClick={runAnimation}
          disabled={phase === "encoding" || phase === "traveling"}
          style={{
            padding: "8px 20px",
            borderRadius: 6,
            border: "none",
            background: pattern.color,
            color: "white",
            fontWeight: 600,
            fontSize: 13,
            cursor: phase === "idle" || phase === "done" ? "pointer" : "not-allowed",
            opacity: phase === "encoding" || phase === "traveling" ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {phase === "idle" ? "▶ Send payload" : phase === "done" ? "↺ Replay" : "Encoding…"}
        </button>
      </div>
    </div>
  );
}
