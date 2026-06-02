import React, { useState } from "react";

const PATTERNS = [
  {
    id: "compression",
    label: "Compression",
    icon: "🗜️",
    color: "#2563eb",
    colorRgb: "37, 99, 235",
    symptom: "Storage or bandwidth costs climbing on repetitive JSON",
    what: "gzip after JSON encode — typically 60–80% smaller. No workflow code changes. The easiest pattern to start with.",
    tradeoff: "Reduces and delays the 2 MB cap, but does not remove it.",
    docHref: "/docs/concepts/data-converter#compression",
  },
  {
    id: "claimcheck",
    label: "Claim-check",
    icon: "🔗",
    color: "#16a34a",
    colorRgb: "22, 163, 74",
    symptom: "Payloads rejected at the ~2 MB limit with no useful error",
    what: "Offloads payloads above a threshold to an external blob store (S3, GCS, MinIO, local FS). Only a tiny reference travels through Cadence history.",
    tradeoff: "The only pattern that fully removes the size constraint.",
    docHref: "/docs/concepts/data-converter#claim-check",
  },
  {
    id: "encryption",
    label: "Encryption",
    icon: "🔐",
    color: "#dc2626",
    colorRgb: "220, 38, 38",
    symptom: "PII, PHI, or credentials visible in workflow history or the Cadence UI",
    what: "AES-256-GCM wraps every payload before it reaches history. Without your key, operators see nothing readable.",
    tradeoff: "Covers history payloads only — not search attributes, memo, or logs.",
    docHref: "/docs/concepts/data-converter#encryption",
  },
];

export default function PatternCards() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
      {PATTERNS.map((p) => {
        const isOpen = openId === p.id;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => setOpenId(isOpen ? null : p.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenId(isOpen ? null : p.id);
              }
            }}
            aria-expanded={isOpen}
            style={{
              border: `2px solid ${isOpen ? p.color : "var(--ifm-color-emphasis-300)"}`,
              borderRadius: 10,
              padding: "14px 18px",
              cursor: "pointer",
              background: isOpen
                ? `rgba(${p.colorRgb}, 0.08)`
                : "var(--ifm-card-background-color, var(--ifm-background-surface-color))",
              transition: "all 0.2s",
              userSelect: "none",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{p.icon}</span>
              <a
                href={p.docHref}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: isOpen ? p.color : "var(--ifm-color-content)",
                  transition: "color 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {p.label}
              </a>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  color: "var(--ifm-color-content)",
                  flex: 1,
                  textAlign: "right",
                  paddingLeft: 12,
                }}
              >
                {p.symptom}
              </span>
              <span style={{ marginLeft: 10, color: "var(--ifm-color-content-secondary)", fontSize: 14 }}>
                {isOpen ? "▲" : "▼"}
              </span>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: `1px solid rgba(${p.colorRgb}, 0.25)`,
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 14,
                    color: "var(--ifm-color-content)",
                    lineHeight: 1.6,
                  }}
                >
                  {p.what}
                </p>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 13,
                    color: "var(--ifm-color-content-secondary)",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                  }}
                >
                  {p.tradeoff}
                </p>
                <a
                  href={p.docHref}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 6,
                    background: p.color,
                    color: "white",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  Read the docs →
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
