import React, { useState } from 'react';
import styles from './styles.module.css';

const DEFAULTS = {
  workflowsAtPeak: 1,
  workflowsPerDay: 1,
  avgWorkflowRuntime: 24,  // hours; 24h = 1 day
  retentionDaysAfterCompletion: 7,
  activitiesPerWorkflow: 1,
  signalsPerWorkflow: 1,
  timersPerWorkflow: 1,
  childWorkflowsPerWorkflow: 1,
  searchAttributeUpsertsPerWorkflow: 1,
  heartbeatsPerWorkflow: 1,
  avgWorkflowPayloadSizeMB: '500 KB',
  avgWorkflowResponseSizeKB: 1,
  avgActivityPayloadSizeMB: '500 KB',
  avgActivityResponseSizeKB: 1,
  avgChildWorkflowPayloadSizeMB: '500 KB',
  avgSignalInputSizeKB: 1,
  avgHeartbeatPayloadSizeKB: 1,
  executionsAvgRowSizeKB: 7,
  historyNodeAvgRowSizeMB: 0.6,
};

// Realistic order-processing scenario: 833 orders in-flight at peak (= 10K/day × 2hr/24hr),
// 10K/day, ~2-hour average runtime, 3 activities, 1 signal, 1 timer, 1 search attribute upsert.
const EXAMPLE = {
  workflowsAtPeak: 833,
  workflowsPerDay: 10000,
  avgWorkflowRuntime: '2h',
  retentionDaysAfterCompletion: 7,
  activitiesPerWorkflow: 3,
  signalsPerWorkflow: 1,
  timersPerWorkflow: 1,
  childWorkflowsPerWorkflow: 0,
  searchAttributeUpsertsPerWorkflow: 1,
  heartbeatsPerWorkflow: 0,
  avgWorkflowPayloadSizeMB: 0.1,
  avgWorkflowResponseSizeKB: 1,
  avgActivityPayloadSizeMB: 0.05,
  avgActivityResponseSizeKB: 1,
  avgChildWorkflowPayloadSizeMB: 0.1,
  avgSignalInputSizeKB: 1,
  avgHeartbeatPayloadSizeKB: 1,
  executionsAvgRowSizeKB: 7,
  historyNodeAvgRowSizeMB: 0.6,
};

function num(val: string | number): number {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) || n < 0 ? 0 : n;
}

// Parse a time string into hours.
// Plain numbers default to hours ("2" → 2 hours, "24" → 24 hours = 1 day).
// Supported suffixes: s/sec/second(s), m/min/mins/minute(s), h/hr/hrs/hour(s), d/day(s), w/week(s)
// Examples: "2h", "30m", "90 mins", "1d", "1 week", "3600s"
function parseTimeHours(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) || val < 0 ? 0 : val;
  const s = val.trim().toLowerCase();
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(w(?:eeks?)?|d(?:ays?)?|h(?:ours?|rs?)?|m(?:in(?:utes?|s)?)?|s(?:ec(?:onds?|s)?)?)?$/);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  if (isNaN(n) || n < 0) return 0;
  const u = match[2] ?? '';
  if (u.startsWith('w')) return n * 7 * 24;
  if (u.startsWith('d')) return n * 24;
  if (u.startsWith('m')) return n / 60;
  if (u.startsWith('s')) return n / 3600;
  // 'h' prefix or no unit → hours
  return n;
}

// Parse a time string into days.
// Plain numbers default to days ("7" → 7 days, "30" → 30 days).
// Same suffixes as parseTimeHours; used for the retention field.
// Examples: "7", "30d", "2w", "48h"
function parseTimeDays(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) || val < 0 ? 0 : val;
  const s = val.trim().toLowerCase();
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(w(?:eeks?)?|d(?:ays?)?|h(?:ours?|rs?)?|m(?:in(?:utes?|s)?)?|s(?:ec(?:onds?|s)?)?)?$/);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  if (isNaN(n) || n < 0) return 0;
  const u = match[2] ?? '';
  if (u.startsWith('w')) return n * 7;
  if (u.startsWith('h')) return n / 24;
  if (u.startsWith('m')) return n / (60 * 24);
  if (u.startsWith('s')) return n / (3600 * 24);
  // 'd' prefix or no unit → days
  return n;
}

// Parse a size string into MB.
// Plain numbers default to MB (the field's native unit).
// Examples: "2 MB", "500KB", "1GB", "2mb", "500 b"
function parseSizeMB(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) || val < 0 ? 0 : val;
  const s = val.trim().toLowerCase().replace(/\s+/g, '');
  const match = s.match(/^(\d+(?:\.\d+)?)(gb|mb|kb|b)?$/);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  if (isNaN(n) || n < 0) return 0;
  const u = match[2] ?? 'mb';
  if (u === 'gb') return n * 1024;
  if (u === 'mb') return n;
  if (u === 'kb') return n / 1024;
  if (u === 'b') return n / (1024 * 1024);
  return n;
}

// Parse a size string into KB.
// Plain numbers default to KB (the field's native unit).
// Examples: "1 KB", "2MB", "500B", "1gb"
function parseSizeKB(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) || val < 0 ? 0 : val;
  const s = val.trim().toLowerCase().replace(/\s+/g, '');
  const match = s.match(/^(\d+(?:\.\d+)?)(gb|mb|kb|b)?$/);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  if (isNaN(n) || n < 0) return 0;
  const u = match[2] ?? 'kb';
  if (u === 'gb') return n * 1024 * 1024;
  if (u === 'mb') return n * 1024;
  if (u === 'kb') return n;
  if (u === 'b') return n / 1024;
  return n;
}

function fmtMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
}

// Returns a warning string if a payload size (in MB) exceeds Uber's 500 KB limit.
function payloadWarn(mb: number): string | null {
  return mb > 0.5 ? '⚠ Uber limits this to 500 KB' : null;
}

// Returns a warning string if retention is unusually long.
function retentionWarn(days: number): string | null {
  return days > 30 ? '⚠ High retention — consider archival' : null;
}

function fmtGiB(v: number): string {
  if (v <= 0) return '—';
  if (v < 0.01) return '< 0.01 GiB';
  return `${v.toFixed(2)} GiB`;
}

function fmtTiB(v: number): string {
  if (v <= 0) return '—';
  if (v < 0.001) return '< 0.001 TiB';
  return `${v.toFixed(3)} TiB`;
}

function fmtThroughput(actionsPerSec: number): string {
  if (actionsPerSec <= 0) return '—';
  if (actionsPerSec < 0.0001) return actionsPerSec.toExponential(2) + ' updates/sec';
  if (actionsPerSec < 0.01)   return actionsPerSec.toFixed(5) + ' updates/sec';
  if (actionsPerSec < 1)      return actionsPerSec.toFixed(4) + ' updates/sec';
  if (actionsPerSec < 100)    return actionsPerSec.toFixed(2) + ' updates/sec';
  return Math.round(actionsPerSec).toLocaleString() + ' updates/sec';
}

function NumberField({
  label,
  unit,
  value,
  onChange,
  type = 'number',
  placeholder,
  warning,
}: {
  label: string;
  unit?: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: 'number' | 'text';
  placeholder?: string;
  warning?: string | null;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? 'any' : undefined}
        placeholder={placeholder}
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {type !== 'text' && <span className={styles.unit}>{unit ?? ''}</span>}
      {warning && <span className={styles.warning}>{warning}</span>}
    </div>
  );
}

export default function CapacityEstimator() {
  const [v, setV] = useState<Record<string, string | number>>({ ...DEFAULTS });

  function set(key: string) {
    return (val: string) => setV((prev) => ({ ...prev, [key]: val }));
  }

  function reset() {
    setV({ ...DEFAULTS });
  }

  function loadExample() {
    setV({ ...EXAMPLE });
  }

  // Parse all raw input values into numbers, clamping negatives to 0.
  const wfPeak = num(v.workflowsAtPeak);
  const wfPerDay = num(v.workflowsPerDay);
  // avgWorkflowRuntime is in hours; plain numbers = hours.
  const runtimeHours = parseTimeHours(v.avgWorkflowRuntime);
  const retentionDays = parseTimeDays(v.retentionDaysAfterCompletion);
  const activities = num(v.activitiesPerWorkflow);
  const signals = num(v.signalsPerWorkflow);
  const timers = num(v.timersPerWorkflow);
  const childWfs = num(v.childWorkflowsPerWorkflow);
  const saUpserts = num(v.searchAttributeUpsertsPerWorkflow);
  const heartbeats = num(v.heartbeatsPerWorkflow);

  const wfPayloadMB = parseSizeMB(v.avgWorkflowPayloadSizeMB);
  const wfResponseKB = parseSizeKB(v.avgWorkflowResponseSizeKB);
  const actPayloadMB = parseSizeMB(v.avgActivityPayloadSizeMB);
  const actResponseKB = parseSizeKB(v.avgActivityResponseSizeKB);
  const childPayloadMB = parseSizeMB(v.avgChildWorkflowPayloadSizeMB);
  const signalKB = parseSizeKB(v.avgSignalInputSizeKB);
  const heartbeatKB = parseSizeKB(v.avgHeartbeatPayloadSizeKB);

  const execAvgKB = parseSizeKB(v.executionsAvgRowSizeKB);
  const histAvgMB = parseSizeMB(v.historyNodeAvgRowSizeMB);

  // Layer 1: Action cost
  // Count how many UpdateWorkflowExecution calls this workflow generates over its lifetime.
  // The fixed 5 is the base cost of any workflow: start record, initial decision, close record,
  // plus the internal transfer and timer task writes those events trigger.
  // Each other event type costs more than 1 because Cadence also writes transfer tasks,
  // timer tasks, and replication records alongside the main history event.
  const totalActions =
    5 +
    activities * 6 +
    signals * 4 +
    timers * 5 +
    childWfs * 6 +
    saUpserts * 4 +
    heartbeats;

  // Layer 2a: Payload data size
  // The application data the workflow carries: inputs, results, signal bodies, and heartbeat
  // checkpoints. All KB values are divided by 1024 to convert to MB for consistent units.
  const payloadDataSizeMB =
    wfPayloadMB +
    wfResponseKB / 1024 +
    activities * (actPayloadMB + actResponseKB / 1024) +
    childWfs * childPayloadMB +
    signals * (signalKB / 1024) +
    heartbeats * (heartbeatKB / 1024);

  // Layer 2b: Unit data size
  // What Cassandra actually stores for one workflow instance across both tables:
  //   history_node: event diary, read as one blob. The (activities + 1) term models activity
  //                 payload nodes (dominant by size) plus one node for the start/close events.
  //                 Signals, timers, and decisions write smaller nodes counted in totalActions/1024.
  //   totalActions / 1024: 1 KB overhead per UpdateWorkflowExecution call.
  //   executions x2: two rows per workflow: one for the execution record,
  //                  one for pending timer and transfer tasks.
  const unitDataSizeMB =
    histAvgMB * (activities + 1) +
    totalActions / 1024 +
    (execAvgKB * 2) / 1024;

  // Layer 2c: Total retained data size
  // How much Cassandra holds at any moment across all workflows.
  // Each workflow started today occupies storage for (runtimeDays + retentionDays):
  // runtimeDays while it runs, retentionDays after it closes before GC removes it.
  const totalRetainedMB =
    unitDataSizeMB * wfPerDay * (runtimeHours / 24 + retentionDays);

  // Layer 3: Peak throughput via Little's Law
  // Little's Law: throughput = concurrency / avg_time_in_system.
  // workflowsAtPeak is how many workflows are always in flight (concurrency).
  // runtimeDays * 86400 converts the average workflow lifetime to seconds.
  // Multiplying by totalActions gives UpdateWorkflowExecution calls per second.
  // This single number drives all resource estimates below.
  const actionsPerSec = runtimeHours > 0 ? (totalActions * wfPeak) / (runtimeHours * 3600) : 0;

  // Layer 4: Resource estimation
  // Scale linearly from a reference cluster measured at 11,444 updates/sec (Uber prod11 Grafana).
  // Each coefficient = (total resource at reference) / 11444.
  // Reference cluster breakdown:
  //   History:  106 instances (54 DCA + 52 PHX) x 4 cores = 424 cores, 106 x 24 GiB = 2,544 GiB RAM
  //   Frontend:  63 instances (35 DCA + 28 PHX) x 2 cores = 126 cores,  63 x 12 GiB =   756 GiB RAM
  //   Matching:  12 instances  (6 DCA +  6 PHX) x 6 cores =  72 cores,  12 x 32 GiB =   384 GiB RAM
  //   Cassandra: 144 nodes, 21.167 TiB total RAM
  const historyCores   = Math.ceil(actionsPerSec * (424 / 11444));
  const frontendCores  = Math.ceil(actionsPerSec * (126 / 11444));
  const matchingCores  = Math.ceil(actionsPerSec * (72 / 11444));
  const cassandraNodes = Math.ceil(actionsPerSec * (144 / 11444));

  const historyMemGiB   = actionsPerSec * (2544 / 11444);
  const frontendMemGiB  = actionsPerSec * (756 / 11444);
  const matchingMemGiB  = actionsPerSec * (384 / 11444);
  const cassandraMemTiB = actionsPerSec * (21.167 / 11444);

  const totalCores = historyCores + frontendCores + matchingCores;

  // Concurrent activities at peak: rough guide for worker sizing.
  const concurrentActivities = Math.round(wfPeak * activities);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Left column */}
        <div>
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Workflow shape</p>
            <NumberField label="Workflows at peak" value={v.workflowsAtPeak} onChange={set('workflowsAtPeak')} />
            <NumberField label="Workflows per day" value={v.workflowsPerDay} onChange={set('workflowsPerDay')} />
            <NumberField label="Avg runtime" unit="hr" type="text" placeholder="e.g. 2h, 30m, 1d" value={v.avgWorkflowRuntime} onChange={set('avgWorkflowRuntime')} />
            <NumberField label="Retention after completion" unit="days" type="text" placeholder="e.g. 7, 30d, 2w" value={v.retentionDaysAfterCompletion} onChange={set('retentionDaysAfterCompletion')} warning={retentionWarn(retentionDays)} />
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Workflow behavior</p>
            <NumberField label="Activities per workflow" value={v.activitiesPerWorkflow} onChange={set('activitiesPerWorkflow')} />
            <NumberField label="Signals per workflow" value={v.signalsPerWorkflow} onChange={set('signalsPerWorkflow')} />
            <NumberField label="Timers per workflow" value={v.timersPerWorkflow} onChange={set('timersPerWorkflow')} />
            <NumberField label="Child workflows" value={v.childWorkflowsPerWorkflow} onChange={set('childWorkflowsPerWorkflow')} />
            <NumberField label="Search attribute upserts" value={v.searchAttributeUpsertsPerWorkflow} onChange={set('searchAttributeUpsertsPerWorkflow')} />
            <NumberField label="Heartbeats per workflow" value={v.heartbeatsPerWorkflow} onChange={set('heartbeatsPerWorkflow')} />
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Payload sizes</p>
            <NumberField label="Workflow input" unit="MB" type="text" placeholder="e.g. 500 KB, 1 MB" value={v.avgWorkflowPayloadSizeMB} onChange={set('avgWorkflowPayloadSizeMB')} warning={payloadWarn(wfPayloadMB)} />
            <NumberField label="Workflow result" unit="KB" type="text" placeholder="e.g. 1 KB, 500 B" value={v.avgWorkflowResponseSizeKB} onChange={set('avgWorkflowResponseSizeKB')} />
            <NumberField label="Activity input" unit="MB" type="text" placeholder="e.g. 500 KB, 1 MB" value={v.avgActivityPayloadSizeMB} onChange={set('avgActivityPayloadSizeMB')} warning={payloadWarn(actPayloadMB)} />
            <NumberField label="Activity result" unit="KB" type="text" placeholder="e.g. 1 KB, 500 B" value={v.avgActivityResponseSizeKB} onChange={set('avgActivityResponseSizeKB')} />
            <NumberField label="Child workflow input" unit="MB" type="text" placeholder="e.g. 500 KB, 1 MB" value={v.avgChildWorkflowPayloadSizeMB} onChange={set('avgChildWorkflowPayloadSizeMB')} warning={payloadWarn(childPayloadMB)} />
            <NumberField label="Signal input" unit="KB" type="text" placeholder="e.g. 1 KB, 500 B" value={v.avgSignalInputSizeKB} onChange={set('avgSignalInputSizeKB')} />
            <NumberField label="Heartbeat payload" unit="KB" type="text" placeholder="e.g. 1 KB, 500 B" value={v.avgHeartbeatPayloadSizeKB} onChange={set('avgHeartbeatPayloadSizeKB')} />
          </div>
        </div>
      </div>

      <div className={styles.results}>
        <p className={styles.resultsTitle}>Estimated outputs</p>
        <div className={styles.resultGrid}>
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Actions / updates per workflow</span>
            <span className={styles.resultValue}>{totalActions}</span>
          </div>
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Peak throughput</span>
            <span className={styles.resultValue}>{fmtThroughput(actionsPerSec)}</span>
          </div>
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Workflow payload data size</span>
            <span className={styles.resultValue}>{fmtMB(payloadDataSizeMB)}</span>
          </div>
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Unit data size</span>
            <span className={styles.resultValue}>{fmtMB(unitDataSizeMB)}</span>
          </div>
          <div className={styles.resultItem}>
            <span className={styles.resultLabel}>Total retained data footprint</span>
            <span className={styles.resultValue}>{fmtMB(totalRetainedMB)}</span>
          </div>
        </div>
        <p className={styles.caveat}>
          Planning estimate only. Actual footprint depends on deployment topology, persistence backend, worker behavior, archival, and visibility configuration. Default retention of 7 days reflects typical Uber production usage; adjust for your domain. Use p95 or p99 payload sizes from production metrics when available.
        </p>
        <div className={styles.btnGroup}>
          <button className={styles.exampleBtn} onClick={loadExample}>Load order-processing example</button>
          <button className={styles.resetBtn} onClick={reset}>Reset to defaults</button>
        </div>
      </div>

      <div className={styles.results}>
        <p className={styles.resultsTitle}>Estimated resource footprint</p>
        <table className={styles.resourceTable}>
          <thead>
            <tr>
              <th>Service</th>
              <th>Allocated cores</th>
              <th>Memory</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>History</td>
              <td>{historyCores > 0 ? historyCores : '—'}</td>
              <td>{fmtGiB(historyMemGiB)}</td>
              <td>Dominant service; scales with update volume</td>
            </tr>
            <tr>
              <td>Frontend</td>
              <td>{frontendCores > 0 ? frontendCores : '—'}</td>
              <td>{fmtGiB(frontendMemGiB)}</td>
              <td>API gateway; lower footprint than History</td>
            </tr>
            <tr>
              <td>Matching</td>
              <td>{matchingCores > 0 ? matchingCores : '—'}</td>
              <td>{fmtGiB(matchingMemGiB)}</td>
              <td>Task dispatch; CPU-light relative to instance count</td>
            </tr>
            <tr>
              <td>Workers</td>
              <td>—</td>
              <td>—</td>
              <td>
                User-managed; size based on activity workload.
                {concurrentActivities > 0 && (
                  <> At peak: ~{concurrentActivities.toLocaleString()} concurrent {concurrentActivities === 1 ? 'activity' : 'activities'}. Start with 1 worker core per 10–50 concurrent activities; scale based on activity duration and CPU profile.</>
                )}
              </td>
            </tr>
            <tr>
              <td>Cassandra</td>
              <td>{cassandraNodes > 0 ? `${Math.max(cassandraNodes, 3)} ${Math.max(cassandraNodes, 3) === 1 ? 'node' : 'nodes'}` : '—'}</td>
              <td>{fmtTiB(cassandraMemTiB)}</td>
              <td>Dominant storage tier; memory-heavy. Production minimum: 3 nodes (RF=3).</td>
            </tr>
            <tr style={{fontWeight: 'bold', borderTop: '2px solid var(--ifm-table-border-color)'}}>
              <td>Total Cadence cores</td>
              <td>{totalCores > 0 ? totalCores : '—'}</td>
              <td>—</td>
              <td>History + Frontend + Matching; driven by peak throughput ({fmtThroughput(actionsPerSec)})</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.caveat}>
          Resource estimates are derived from observed production ratios at ~11,444 updates/sec. They are order-of-magnitude guides for initial cluster planning, not production sizing guarantees. Small deployments ({'<'}100 updates/sec) have higher per-update overhead due to fixed service minimums; plan for at least 1 instance per service regardless of computed values. For multi-cluster or global domain setups, multiply storage and Cassandra node count by the number of replication targets.
        </p>
      </div>
    </div>
  );
}
