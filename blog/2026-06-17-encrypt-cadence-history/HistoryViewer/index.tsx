import React, { useState } from 'react';

const PLAINTEXT_EVENT = `{
  "eventId": 5,
  "eventType": "ActivityTaskScheduled",
  "activityTaskScheduledEventAttributes": {
    "activityId": "process-order",
    "activityType": { "name": "ProcessPayment" },
    "input": {
      "customerId": "cust-8821",
      "email": "alice@example.com",
      "cardLastFour": "4242",
      "orderTotal": 149.99,
      "shippingAddress": {
        "street": "123 Main St",
        "city": "San Francisco",
        "zip": "94105"
      }
    },
    "scheduleToCloseTimeout": 300,
    "taskList": { "name": "payment-workers" }
  }
}`;

const ENCRYPTED_EVENT = `{
  "eventId": 5,
  "eventType": "ActivityTaskScheduled",
  "activityTaskScheduledEventAttributes": {
    "activityId": "process-order",
    "activityType": { "name": "ProcessPayment" },
    "input": "nonce:a3f2b91c04d7...
ciphertext:8Xk2mP9vRqL0nT4s
          Yc7wDhJeNbUzOf1A
          Vg5iKlMxPtQrSwE3
          ...(AES-256-GCM)
tag:f0e1d2c3b4a59687",
    "scheduleToCloseTimeout": 300,
    "taskList": { "name": "payment-workers" }
  }
}`;

type View = 'plain' | 'encrypted';

// Highlight lines that contain sensitive data in the plaintext view
const SENSITIVE_LINES = new Set([4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

function ColoredCode({ text, view }: { text: string; view: View }) {
  const lines = text.split('\n');
  return (
    <pre style={{
      margin: 0,
      padding: '14px 16px',
      fontSize: 11,
      lineHeight: 1.7,
      overflowX: 'auto',
      background: 'transparent',
      fontFamily: 'var(--ifm-font-family-monospace)',
      color: 'var(--ifm-font-color-base)',
      whiteSpace: 'pre',
    }}>
      {lines.map((line, i) => {
        const lineNum = i + 1;
        const isSensitive = view === 'plain' && SENSITIVE_LINES.has(lineNum);
        const isEncBlob = view === 'encrypted' && (lineNum >= 8 && lineNum <= 13);
        return (
          <span
            key={i}
            style={{
              display: 'block',
              background: isSensitive
                ? 'color-mix(in srgb, var(--ifm-color-danger) 12%, transparent)'
                : isEncBlob
                ? 'color-mix(in srgb, var(--ifm-color-primary) 10%, transparent)'
                : 'transparent',
              borderLeft: isSensitive
                ? '3px solid var(--ifm-color-danger)'
                : isEncBlob
                ? '3px solid var(--ifm-color-primary)'
                : '3px solid transparent',
              paddingLeft: 6,
              marginLeft: -6,
              color: isSensitive ? 'var(--ifm-color-danger)' : 'inherit',
            }}
          >
            {line}
          </span>
        );
      })}
    </pre>
  );
}

export default function HistoryViewer() {
  const [view, setView] = useState<View>('plain');

  return (
    <div style={{ margin: '2rem 0' }}>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {(['plain', 'encrypted'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '5px 18px',
              borderRadius: 6,
              background: 'transparent',
              color: view === v ? 'var(--ifm-color-primary)' : 'var(--ifm-font-color-base)',
              border: 'none',
              borderBottom: view === v ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              textTransform: 'capitalize',
            }}
          >
            {v === 'plain' ? 'Plaintext (default)' : 'Encrypted'}
          </button>
        ))}
      </div>

      {/* Code pane */}
      <div style={{
        border: `1px solid ${view === 'plain' ? 'var(--ifm-color-danger)' : 'var(--ifm-color-primary)'}`,
        borderRadius: 8,
        background: 'var(--ifm-code-background)',
        transition: 'border-color 0.2s',
        overflow: 'hidden',
      }}>
        {/* Header bar */}
        <div style={{
          padding: '6px 14px',
          background: view === 'plain'
            ? 'color-mix(in srgb, var(--ifm-color-danger) 10%, var(--ifm-background-surface-color))'
            : 'color-mix(in srgb, var(--ifm-color-primary) 10%, var(--ifm-background-surface-color))',
          borderBottom: '1px solid var(--ifm-color-emphasis-200)',
          fontSize: 11,
          fontWeight: 700,
          color: view === 'plain' ? 'var(--ifm-color-danger)' : 'var(--ifm-color-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>{view === 'plain' ? '⚠' : '🔒'}</span>
          <span>
            {view === 'plain'
              ? 'ActivityTaskScheduled: input visible in history'
              : 'ActivityTaskScheduled: input opaque without the key'}
          </span>
        </div>
        <ColoredCode text={view === 'plain' ? PLAINTEXT_EVENT : ENCRYPTED_EVENT} view={view} />
      </div>

      <p style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginTop: '0.6rem' }}>
        {view === 'plain'
          ? 'Highlighted lines contain PII visible to anyone with history read access.'
          : 'The input field is an opaque AES-256-GCM blob. Structural metadata (event type, task list, timeouts) remains visible.'}
      </p>
    </div>
  );
}
