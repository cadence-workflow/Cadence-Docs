import React, { useState } from 'react';

type Footgun = {
  icon: string;
  title: string;
  what: string;
  fix: string;
  fixCode?: string;
};

const FOOTGUNS: Footgun[] = [
  {
    icon: '🔑',
    title: 'UUID blob keys',
    what: 'Every replay of a workflow calls ToData again with the same payload. A UUID key writes a fresh blob each time and orphans the previous one. After a week in production, your blob store is full of unreachable objects.',
    fix: 'Use SHA-256 of the serialized payload as the key. The same payload always hashes to the same key, so a re-put on replay is a no-op.',
    fixCode: `key := fmt.Sprintf("%x", sha256.Sum256(data))`,
  },
  {
    icon: '⏱️',
    title: 'Blob TTL shorter than history retention',
    what: 'If you set a 7-day TTL on blobs but your Cadence namespace retains history for 30 days, a replay on day 10 will try to fetch a blob that no longer exists. The decode fails, the task retries forever.',
    fix: 'Set blob TTL ≥ your longest workflow execution lifetime, not your namespace retention period. When in doubt, use no TTL and rely on explicit cleanup.',
  },
  {
    icon: '🔌',
    title: 'Blob store treated as optional',
    what: 'The blob store is now on the critical path for every worker that processes tasks for workflows using claim-check. An outage or network blip causes decode failures and infinite task retries, not a clean workflow error.',
    fix: 'Treat blob store availability like a database dependency. Add health checks, alerts, and circuit breakers. Document the dependency in your runbook.',
  },
  {
    icon: '🔢',
    title: 'Prefix byte schema change mid-flight',
    what: 'The DataConverter uses a prefix byte (0x00 = inline, 0x01 = claim-check) to know how to decode each payload. If you change the meaning of those bytes in a new deployment, workers decoding old history events will misread the prefix and corrupt the payload.',
    fix: 'Freeze the prefix schema on day one. Add new prefix values for new behaviors; never reuse or remove existing ones. Treat it like a Protobuf field number.',
  },
  {
    icon: '🔐',
    title: 'Missing blob store credentials on workers',
    what: 'The Cadence client writes blobs during ToData (encode). Workers read them during FromData (decode). If your workers have a different IAM role or network path than your client, encodes succeed silently but every decode fails at runtime.',
    fix: 'Verify that both your Cadence client and all worker processes have read+write access to the blob store. Test this at deploy time, not at incident time.',
  },
];

export default function FootgunCards() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {FOOTGUNS.map((fg, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              border: `1px solid ${isOpen ? 'var(--ifm-color-danger)' : 'var(--ifm-color-emphasis-300)'}`,
              borderRadius: 8,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Header */}
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: isOpen
                  ? 'color-mix(in srgb, var(--ifm-color-danger) 8%, var(--ifm-background-surface-color))'
                  : 'var(--ifm-background-surface-color)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{fg.icon}</span>
              <span style={{
                flex: 1,
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--ifm-font-color-base)',
              }}>
                {fg.title}
              </span>
              <span style={{
                fontSize: 18,
                color: 'var(--ifm-color-emphasis-500)',
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                lineHeight: 1,
              }}>
                ›
              </span>
            </button>

            {/* Body */}
            {isOpen && (
              <div style={{
                padding: '0 16px 16px',
                background: 'var(--ifm-background-surface-color)',
              }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--ifm-color-danger)',
                    marginBottom: 4,
                  }}>
                    What happens
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ifm-font-color-base)', lineHeight: 1.6 }}>
                    {fg.what}
                  </p>
                </div>

                <div style={{
                  borderTop: '1px solid var(--ifm-color-emphasis-200)',
                  paddingTop: 12,
                }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--ifm-color-success)',
                    marginBottom: 4,
                  }}>
                    Fix
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ifm-font-color-base)', lineHeight: 1.6 }}>
                    {fg.fix}
                  </p>
                  {fg.fixCode && (
                    <pre style={{
                      marginTop: 10,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'var(--ifm-code-background)',
                      fontSize: 12,
                      overflowX: 'auto',
                      margin: '10px 0 0',
                    }}>
                      <code>{fg.fixCode}</code>
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
