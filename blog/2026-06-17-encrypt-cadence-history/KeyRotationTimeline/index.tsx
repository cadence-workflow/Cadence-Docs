import React, { useState } from 'react';

type HistoryEvent = {
  id: number;
  label: string;
  eventTime: number; // 0..1 relative position on timeline
};

const EVENTS: HistoryEvent[] = [
  { id: 1, label: 'WorkflowStarted',       eventTime: 0.04 },
  { id: 2, label: 'ActivityScheduled',     eventTime: 0.15 },
  { id: 3, label: 'ActivityCompleted',     eventTime: 0.27 },
  { id: 4, label: 'SignalReceived',        eventTime: 0.38 },
  { id: 5, label: 'ActivityScheduled',     eventTime: 0.50 },
  { id: 6, label: 'ActivityCompleted',     eventTime: 0.62 },
  { id: 7, label: 'ChildWorkflowStarted',  eventTime: 0.73 },
  { id: 8, label: 'TimerFired',            eventTime: 0.84 },
  { id: 9, label: 'WorkflowCompleted',     eventTime: 0.95 },
];

// Default rotation at event 5/6 boundary
const DEFAULT_ROTATION = 0.56;

export default function KeyRotationTimeline() {
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const [keyAvailable, setKeyAvailable] = useState<'both' | 'v1-only' | 'v2-only'>('both');

  function eventStatus(ev: HistoryEvent): 'ok' | 'error' {
    const usesV1 = ev.eventTime < rotation;
    if (keyAvailable === 'both') return 'ok';
    if (keyAvailable === 'v1-only' && !usesV1) return 'error';
    if (keyAvailable === 'v2-only' && usesV1) return 'error';
    return 'ok';
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      {/* Key availability toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ifm-color-emphasis-700)', marginRight: 4 }}>
          Available key:
        </span>
        {(['both', 'v1-only', 'v2-only'] as const).map((opt) => {
          const labels = { both: 'Both (safe)', 'v1-only': 'v1 only', 'v2-only': 'v2 only' };
          return (
            <button
              key={opt}
              onClick={() => setKeyAvailable(opt)}
              style={{
                padding: '4px 14px',
                borderRadius: 6,
                background: 'transparent',
                color: keyAvailable === opt ? 'var(--ifm-color-primary)' : 'var(--ifm-font-color-base)',
                border: 'none',
                borderBottom: keyAvailable === opt ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>

      {/* Rotation slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-700)', whiteSpace: 'nowrap' }}>
          Rotation point:
        </span>
        <input
          type="range"
          min={0.1}
          max={0.9}
          step={0.01}
          value={rotation}
          onChange={(e) => setRotation(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--ifm-color-primary)' }}
        />
        <span style={{ fontSize: 11, color: 'var(--ifm-color-emphasis-600)', whiteSpace: 'nowrap' }}>
          {Math.round(rotation * 100)}% through workflow
        </span>
      </div>

      {/* Timeline */}
      <div style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 10,
        background: 'var(--ifm-background-surface-color)',
        padding: '1.5rem 1rem 1rem',
        position: 'relative',
        overflowX: 'auto',
      }}>
        <div style={{ position: 'relative', minWidth: 500, height: 110 }}>
          {/* Timeline axis */}
          <div style={{
            position: 'absolute',
            top: 30,
            left: '2%',
            right: '2%',
            height: 3,
            borderRadius: 2,
            background: 'var(--ifm-color-emphasis-300)',
          }} />

          {/* v1 zone */}
          <div style={{
            position: 'absolute',
            top: 24,
            left: '2%',
            width: `${(rotation - 0.02) * 100}%`,
            height: 15,
            borderRadius: '3px 0 0 3px',
            background: 'color-mix(in srgb, var(--ifm-color-primary) 20%, transparent)',
          }} />
          <div style={{
            position: 'absolute',
            top: 8,
            left: '3%',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--ifm-color-primary)',
          }}>
            Key v1
          </div>

          {/* v2 zone */}
          <div style={{
            position: 'absolute',
            top: 24,
            left: `${rotation * 100}%`,
            right: '2%',
            height: 15,
            borderRadius: '0 3px 3px 0',
            background: 'color-mix(in srgb, var(--ifm-color-success) 20%, transparent)',
          }} />
          <div style={{
            position: 'absolute',
            top: 8,
            left: `${rotation * 100 + 1}%`,
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--ifm-color-success)',
          }}>
            Key v2
          </div>

          {/* Rotation marker */}
          <div style={{
            position: 'absolute',
            top: 18,
            left: `${rotation * 100}%`,
            transform: 'translateX(-50%)',
            width: 2,
            height: 24,
            background: 'var(--ifm-color-warning)',
          }} />
          <div style={{
            position: 'absolute',
            top: 44,
            left: `${rotation * 100}%`,
            transform: 'translateX(-50%)',
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--ifm-color-warning)',
            whiteSpace: 'nowrap',
          }}>
            rotation
          </div>

          {/* Events */}
          {EVENTS.map((ev) => {
            const usesV1 = ev.eventTime < rotation;
            const status = eventStatus(ev);
            const isError = status === 'error';
            const color = isError
              ? 'var(--ifm-color-danger)'
              : usesV1
              ? 'var(--ifm-color-primary)'
              : 'var(--ifm-color-success)';

            return (
              <div
                key={ev.id}
                style={{
                  position: 'absolute',
                  top: 56,
                  left: `${ev.eventTime * 100}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {/* Stem */}
                <div style={{ width: 1, height: 12, background: color }} />
                {/* Dot */}
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: isError ? 'var(--ifm-color-danger)' : 'transparent',
                  border: `2px solid ${color}`,
                }} />
                {/* Label */}
                <div style={{
                  fontSize: 8,
                  color: isError ? 'var(--ifm-color-danger)' : 'var(--ifm-color-emphasis-600)',
                  textAlign: 'center',
                  maxWidth: 56,
                  lineHeight: 1.3,
                  fontWeight: isError ? 700 : 400,
                }}>
                  {ev.label}
                </div>
                {isError && (
                  <div style={{ fontSize: 8, color: 'var(--ifm-color-danger)', fontWeight: 700 }}>
                    decode fail
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', marginTop: '0.6rem' }}>
        Events before the rotation point are encoded with key v1; events after use key v2.
        {keyAvailable === 'v2-only' && ' Without v1, earlier events fail to decode when the workflow resumes.'}
        {keyAvailable === 'v1-only' && ' Without v2, events written after the rotation point fail to decode.'}
        {keyAvailable === 'both' && ' With both keys available, all events decode correctly.'}
      </p>
    </div>
  );
}
