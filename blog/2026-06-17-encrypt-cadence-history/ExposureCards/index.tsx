import React, { useState } from 'react';

type Card = {
  icon: string;
  title: string;
  what: string;
  canContain: string;
  action: string;
};

const CARDS: Card[] = [
  {
    icon: '🔍',
    title: 'Search attributes',
    what: 'Key/value pairs indexed in the Cadence visibility store so workflows can be listed and filtered in the UI and CLI.',
    canContain: 'Any value your code writes to them. Teams sometimes populate search attributes with customer IDs, order states, or environment labels that qualify as regulated data under HIPAA or PCI.',
    action: 'Audit every search attribute your workflows write. If any field carries PHI or payment data, move that data to the encrypted payload and use a non-identifying surrogate (an opaque ID) as the search attribute value.',
  },
  {
    icon: '📋',
    title: 'Memo',
    what: 'Free-form metadata attached to a workflow at start time. Queryable but not indexed. Stored using the default JSON DataConverter unless you explicitly override it.',
    canContain: 'Arbitrary structured data. Memo is sometimes used for human-readable context (order summary, customer tier) that can carry PII if populated carelessly.',
    action: 'Either avoid putting sensitive data in memo, or wrap the memo serialization path with the same encryption DataConverter you use for payloads. This requires explicit wiring in the client options.',
  },
  {
    icon: '🪪',
    title: 'Workflow IDs and run IDs',
    what: 'Structural routing identifiers visible everywhere: history, the Cadence UI, CLI output, logs, and metrics.',
    canContain: 'If your workflow ID scheme encodes customer or user identifiers (for example: order-12345-user-6789), those IDs are visible in all of the above surfaces.',
    action: 'Use opaque UUIDs or hash-derived identifiers for workflow IDs. Keep the mapping between business keys and workflow IDs in your own data layer, not in the ID itself.',
  },
  {
    icon: '📋',
    title: 'Task list names',
    what: 'Worker routing metadata stored in every scheduled activity and decision event in workflow history.',
    canContain: 'Usually not sensitive. However, task list names sometimes encode environment tiers, team names, or internal service names that you may prefer not to expose.',
    action: 'Use generic routing names (payment-workers, data-processing) rather than names that reveal internal topology or customer segmentation.',
  },
  {
    icon: '❌',
    title: 'Error messages',
    what: 'Workflow and activity failure messages are stored in history failure events outside the payload field. The DataConverter does not intercept them.',
    canContain: 'If your error construction code includes field values in message strings (for example: "failed to process order for alice@example.com"), those strings are plaintext in history.',
    action: 'Treat error messages as structured data. Use error codes or generic descriptions. Log field-level detail separately with proper redaction controls.',
  },
  {
    icon: '📊',
    title: 'Application logs and metrics',
    what: 'Entirely separate from Cadence history. Logs and metrics go to your own backend (Datadog, Splunk, CloudWatch, Prometheus).',
    canContain: 'Anything your code logs or emits as metrics, including arguments, return values, and intermediate state that may carry PII.',
    action: 'Apply field-level redaction or structured logging with scrubbing at your logging layer. This is outside Cadence and requires a separate control.',
  },
];

export default function ExposureCards() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {CARDS.map((card, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              border: `1px solid ${isOpen ? 'var(--ifm-color-danger)' : 'var(--ifm-color-emphasis-300)'}`,
              borderRadius: 8,
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
          >
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
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{card.icon}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--ifm-font-color-base)' }}>
                {card.title}
              </span>
              <span style={{
                fontSize: 18,
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
                padding: '0 16px 16px',
                background: 'var(--ifm-background-surface-color)',
              }}>
                <Section label="What it is" color="var(--ifm-color-emphasis-600)" text={card.what} />
                <Section label="Can contain" color="var(--ifm-color-warning)" text={card.canContain} />
                <Section label="What to do" color="var(--ifm-color-success)" text={card.action} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color,
        marginBottom: 4,
      }}>
        {label}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ifm-font-color-base)', lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  );
}
