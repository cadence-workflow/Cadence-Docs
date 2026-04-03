import React from "react";

interface LogLine {
  timestamp: string;
  message: string;
  hostname: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const s = d.getUTCSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const msgColors: Record<string, string> = {
  "Became leader": "#16a34a",
  "Leadership period ended, voluntarily resigning": "#dc2626",
};

const hostColors: Record<string, string> = {};
const HOST_PALETTE = ["#eff6ff", "#fef9ee"];

function hostColor(hostname: string): string {
  if (!(hostname in hostColors)) {
    hostColors[hostname] = HOST_PALETTE[Object.keys(hostColors).length % HOST_PALETTE.length];
  }
  return hostColors[hostname];
}

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "100px 1fr auto",
  borderBottom: "1px solid #f1f5f9",
};

const cell: React.CSSProperties = {
  padding: "6px 12px",
};

export default function LogTimeline({ data }: { data: LogLine[] }) {
  return (
    <div
      style={{
        margin: "24px 0",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        overflow: "hidden",
        display: "inline-block",
      }}
    >
      {/* Header */}
      <div
        style={{
          ...row,
          background: "#f8fafc",
          borderBottom: "2px solid #e2e8f0",
          fontWeight: 600,
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <div style={cell}>timestamp</div>
        <div style={cell}>message</div>
        <div style={cell}>hostname</div>
      </div>
      {/* Rows */}
      {data.map((item, i) => (
        <div
          key={i}
          style={{
            ...row,
            background: hostColor(item.hostname),
          }}
        >
          <div
            style={{
              ...cell,
              fontFamily: "monospace",
              fontSize: 12,
              color: "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            {formatTime(item.timestamp)}
          </div>
          <div
            style={{
              ...cell,
              color: msgColors[item.message] ?? "#334155",
              fontWeight: 500,
            }}
          >
            {item.message}
          </div>
          <div
            style={{
              ...cell,
              fontFamily: "monospace",
              fontSize: 12,
              color: "#475569",
            }}
          >
            {item.hostname}
          </div>
        </div>
      ))}
    </div>
  );
}
