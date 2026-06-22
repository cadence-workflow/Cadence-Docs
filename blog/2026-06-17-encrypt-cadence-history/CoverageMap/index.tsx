import React, { useState } from 'react';

type Status = 'encrypted' | 'partial' | 'exposed';

type Surface = {
  id: string;
  label: string;
  status: Status;
  detail: string;
};

const SURFACES: Surface[] = [
  {
    id: 'workflow-io',
    label: 'Workflow inputs / outputs',
    status: 'encrypted',
    detail: 'Fully encrypted. Every workflow input and result passes through ToData/FromData.',
  },
  {
    id: 'activity-io',
    label: 'Activity inputs / outputs',
    status: 'encrypted',
    detail: 'Fully encrypted. Activity parameters and return values pass through the DataConverter on both sides.',
  },
  {
    id: 'signals',
    label: 'Signal payloads',
    status: 'encrypted',
    detail: 'Fully encrypted. Signal data is serialized through the DataConverter before being written to history.',
  },
  {
    id: 'queries',
    label: 'Query responses',
    status: 'encrypted',
    detail: 'Fully encrypted. Query handler return values pass through FromData before being returned to the caller.',
  },
  {
    id: 'child-workflow',
    label: 'Child workflow inputs / outputs',
    status: 'encrypted',
    detail: 'Fully encrypted. Child workflow inputs and outputs follow the same path as top-level workflows.',
  },
  {
    id: 'search-attrs',
    label: 'Search attributes',
    status: 'exposed',
    detail: 'Not encrypted. Search attributes are indexed in the visibility store so they can be queried via the CLI and UI. They are plaintext regardless of your DataConverter.',
  },
  {
    id: 'memo',
    label: 'Memo',
    status: 'partial',
    detail: 'Uses the default JSON converter unless you explicitly wrap the memo code path separately. Not encrypted by default.',
  },
  {
    id: 'workflow-ids',
    label: 'Workflow IDs / run IDs',
    status: 'exposed',
    detail: 'Structural routing metadata. Always visible in history, the UI, and the CLI. The DataConverter does not intercept these.',
  },
  {
    id: 'task-list',
    label: 'Task list names',
    status: 'exposed',
    detail: 'Routing metadata stored in history event headers. Always visible.',
  },
  {
    id: 'timers',
    label: 'Timer durations',
    status: 'exposed',
    detail: 'Timer scheduling metadata is not intercepted by the DataConverter. Fire-after durations are stored in plaintext.',
  },
  {
    id: 'errors',
    label: 'Error messages',
    status: 'exposed',
    detail: 'Workflow and activity failure messages are stored in history events outside the payload field. The top-level message string is always visible. Stack traces are not included by default.',
  },
  {
    id: 'logs',
    label: 'Application logs / metrics',
    status: 'exposed',
    detail: 'Entirely separate from Cadence history. Logs go to your logging backend; the DataConverter does not touch them.',
  },
];

const STATUS_CONFIG: Record<Status, { label: string; bg: string; border: string; text: string }> = {
  encrypted: {
    label: 'Encrypted',
    bg: 'color-mix(in srgb, var(--ifm-color-success) 12%, var(--ifm-background-surface-color))',
    border: 'var(--ifm-color-success)',
    text: 'var(--ifm-color-success)',
  },
  partial: {
    label: 'Partial',
    bg: 'color-mix(in srgb, var(--ifm-color-warning) 12%, var(--ifm-background-surface-color))',
    border: 'var(--ifm-color-warning)',
    text: 'var(--ifm-color-warning)',
  },
  exposed: {
    label: 'Exposed',
    bg: 'color-mix(in srgb, var(--ifm-color-danger) 10%, var(--ifm-background-surface-color))',
    border: 'var(--ifm-color-danger)',
    text: 'var(--ifm-color-danger)',
  },
};

export default function CoverageMap() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{ margin: '2rem 0' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['encrypted', 'partial', 'exposed'] as Status[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 3,
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
              }} />
              <span style={{ color: 'var(--ifm-font-color-base)' }}>{cfg.label}</span>
            </div>
          );
        })}
        <span style={{ fontSize: 11, color: 'var(--ifm-color-emphasis-600)', alignSelf: 'center' }}>
          Click any row for details
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SURFACES.map((s) => {
          const cfg = STATUS_CONFIG[s.status];
          const isOpen = open === s.id;
          return (
            <div
              key={s.id}
              style={{
                border: `1px solid ${isOpen ? cfg.border : 'var(--ifm-color-emphasis-300)'}`,
                borderRadius: 7,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : s.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 14px',
                  background: isOpen ? cfg.bg : 'var(--ifm-background-surface-color)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--ifm-font-color-base)',
                }}>
                  {s.label}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: cfg.bg,
                  color: cfg.text,
                  border: `1px solid ${cfg.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {cfg.label}
                </span>
                <span style={{
                  fontSize: 16,
                  color: 'var(--ifm-color-emphasis-500)',
                  transform: isOpen ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.15s',
                  lineHeight: 1,
                }}>
                  ›
                </span>
              </button>
              {isOpen && (
                <div style={{
                  padding: '8px 14px 12px',
                  background: 'var(--ifm-background-surface-color)',
                  fontSize: 13,
                  color: 'var(--ifm-font-color-base)',
                  lineHeight: 1.6,
                  borderTop: `1px solid var(--ifm-color-emphasis-200)`,
                }}>
                  {s.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
