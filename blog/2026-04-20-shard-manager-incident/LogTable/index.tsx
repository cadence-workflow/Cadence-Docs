import React from "react";

interface LogEntry {
  message: string;
  error: string;
  level: "error" | "warn";
  count: number;
}

export const logTableData: LogEntry[] = [
  {
    message: "Subscriber not keeping up with state updates, dropping update",
    error: "null",
    level: "warn",
    count: 147405,
  },
  {
    message: "Internal service error",
    error:
      "failed to assign ephemeral shard: no active executors available for namespace: cadence-matching-staging",
    level: "error",
    count: 136876,
  },
  {
    message: "No active executors found. Cannot assign shards.",
    error: "null",
    level: "error",
    count: 296,
  },
];

export const matchingLogData: LogEntry[] = [
  {
    message: "adaptive task list scaler state changed",
    error: "null",
    level: "warn",
    count: 9056,
  },
  {
    message: "get task list partition config from db",
    error: "null",
    level: "warn",
    count: 4564,
  },
  {
    message: "Task list manager state changed",
    error: "null",
    level: "warn",
    count: 4345,
  },
  {
    message: "DBUnavailable Error",
    error: "LeaseTaskList: Cannot achieve consistency level LOCAL_SERIAL",
    level: "error",
    count: 157,
  },
];

export default function LogTable({ data }: { data: LogEntry[] }) {
  return (
    <div
      style={{
        margin: "24px 0",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "30%" }} />
          <col style={{ width: "42%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
        </colgroup>
        <thead>
          <tr>
            {["message", "error", "level", "count()"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i === 3 ? "right" : "left",
                  padding: "10px 12px",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "#64748b",
                  borderBottom: "2px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? "#fff" : "#fafbfc",
                verticalAlign: "top",
              }}
            >
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  color: "#334155",
                  fontWeight: 500,
                  wordBreak: "break-word",
                }}
              >
                {row.message}
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  color: "#475569",
                  fontSize: 12,
                  fontFamily: "monospace",
                  wordBreak: "break-word",
                }}
              >
                {row.error}
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    background:
                      row.level === "error" ? "#ef4444" : "#f59e0b",
                    color: "#fff",
                  }}
                >
                  {row.level}
                </span>
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums", // cspell:disable-line
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {row.count.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
