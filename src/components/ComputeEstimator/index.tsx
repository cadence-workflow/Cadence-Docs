import React, { useState } from 'react';
import styles from './styles.module.css';

// Scaling coefficients derived from prod11 at 11,444 updates/sec.
const REF = 11444;
const COEFF = {
  historyCores:   424 / REF,
  frontendCores:  126 / REF,
  matchingCores:   72 / REF,
  historyMemGiB:  2544 / REF,
  frontendMemGiB:  756 / REF,
  matchingMemGiB:  384 / REF,
  cassandraNodes:  144 / REF,
  cassandraMemTiB: 21.167 / REF,
};

type WorkerProfile = 'io' | 'mixed' | 'cpu';
const WORKER_RATIOS: Record<WorkerProfile, { label: string; ratio: number }> = {
  io:    { label: 'I/O-bound (network, DB, waiting on humans)', ratio: 50 },
  mixed: { label: 'Mixed (I/O + moderate CPU)',                 ratio: 25 },
  cpu:   { label: 'CPU-bound (encoding, ML, compression)',      ratio: 10 },
};

function fmt2(n: number) { return n < 0.01 ? '< 0.01' : n.toFixed(2); }
function fmt3(n: number) { return n < 0.001 ? '< 0.001' : n.toFixed(3); }
function parseNum(s: string) { const v = parseFloat(s); return isNaN(v) || v < 0 ? 0 : v; }

export default function ComputeEstimator() {
  const [upsSrc, setUpsSrc] = useState<'manual' | 'grafana'>('manual');
  const [ups, setUps] = useState('');
  const [concurrentActs, setConcurrentActs] = useState('');
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile>('mixed');

  const actionsPerSec = parseNum(ups);
  const concurrent    = parseNum(concurrentActs);
  const workerCores   = concurrent > 0
    ? Math.ceil(concurrent / WORKER_RATIOS[workerProfile].ratio)
    : null;

  const historyCores   = actionsPerSec > 0 ? Math.max(1, Math.ceil(actionsPerSec * COEFF.historyCores))   : null;
  const frontendCores  = actionsPerSec > 0 ? Math.max(1, Math.ceil(actionsPerSec * COEFF.frontendCores))  : null;
  const matchingCores  = actionsPerSec > 0 ? Math.max(1, Math.ceil(actionsPerSec * COEFF.matchingCores))  : null;
  const cassandraNodes = actionsPerSec > 0 ? Math.max(3, Math.ceil(actionsPerSec * COEFF.cassandraNodes)) : null;
  const historyMem     = actionsPerSec > 0 ? actionsPerSec * COEFF.historyMemGiB   : null;
  const frontendMem    = actionsPerSec > 0 ? actionsPerSec * COEFF.frontendMemGiB  : null;
  const matchingMem    = actionsPerSec > 0 ? actionsPerSec * COEFF.matchingMemGiB  : null;
  const cassandraMem   = actionsPerSec > 0 ? actionsPerSec * COEFF.cassandraMemTiB : null;
  const totalCores     = historyCores !== null
    ? historyCores + frontendCores + matchingCores
    : null;

  const atFloor = actionsPerSec > 0 && actionsPerSec < 100;

  return (
    <div className={styles.container}>
      <div className={styles.inputs}>

        {/* Throughput input */}
        <div className={styles.inputGroup}>
          <label className={styles.groupLabel}>Peak throughput</label>
          <div className={styles.sourceToggle}>
            <button
              className={upsSrc === 'manual' ? styles.toggleActive : styles.toggle}
              onClick={() => setUpsSrc('manual')}
            >Enter manually</button>
            <button
              className={upsSrc === 'grafana' ? styles.toggleActive : styles.toggle}
              onClick={() => setUpsSrc('grafana')}
            >From Grafana</button>
          </div>
          {upsSrc === 'manual' ? (
            <div className={styles.fieldRow}>
              <input
                type="number"
                min="0"
                step="any"
                className={styles.input}
                placeholder="e.g. 172"
                value={ups}
                onChange={e => setUps(e.target.value)}
              />
              <span className={styles.unit}>updates/sec</span>
            </div>
          ) : (
            <div className={styles.grafanaHint}>
              <p className={styles.hintText}>In uMonitor v2, run:</p>
              <code className={styles.hintCode}>
                fetch service:cadence-history deployment:YOUR_ENV{'\n'}
                name:persistence_requests{'\n'}
                operation:updateworkflowexecution{'\n'}
                | scaleToSeconds 1 | sum | alias "updates/sec"
              </code>
              <p className={styles.hintText}>Set time range to last 30 days. Use the <strong>Max</strong> value as peak.</p>
              <div className={styles.fieldRow}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={styles.input}
                  placeholder="paste Max value"
                  value={ups}
                  onChange={e => setUps(e.target.value)}
                />
                <span className={styles.unit}>updates/sec</span>
              </div>
            </div>
          )}
        </div>

        {/* Worker inputs */}
        <div className={styles.inputGroup}>
          <label className={styles.groupLabel}>Worker sizing <span className={styles.optional}>(optional)</span></label>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Concurrent activities at peak</label>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.input}
              placeholder="workflowsAtPeak × activities"
              value={concurrentActs}
              onChange={e => setConcurrentActs(e.target.value)}
            />
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Activity profile</label>
            <select
              className={styles.select}
              value={workerProfile}
              onChange={e => setWorkerProfile(e.target.value as WorkerProfile)}
            >
              {(Object.keys(WORKER_RATIOS) as WorkerProfile[]).map(k => (
                <option key={k} value={k}>{WORKER_RATIOS[k].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {actionsPerSec > 0 && (
        <div className={styles.results}>
          {atFloor && (
            <p className={styles.floorNote}>
              At {actionsPerSec} updates/sec all services are at their production minimum (1 instance each). The linear model applies above ~100 updates/sec.
            </p>
          )}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Service</th>
                <th>Cores</th>
                <th>Memory</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>History</td>
                <td>{historyCores}</td>
                <td>{fmt2(historyMem)} GiB</td>
                <td>Dominant service; CPU scales directly with throughput</td>
              </tr>
              <tr>
                <td>Frontend</td>
                <td>{frontendCores}</td>
                <td>{fmt2(frontendMem)} GiB</td>
                <td>API gateway; stateless, lower CPU than History</td>
              </tr>
              <tr>
                <td>Matching</td>
                <td>{matchingCores}</td>
                <td>{fmt2(matchingMem)} GiB</td>
                <td>Task dispatch; CPU-light</td>
              </tr>
              <tr>
                <td>Workers</td>
                <td>{workerCores !== null ? `~${workerCores}` : '—'}</td>
                <td>—</td>
                <td>
                  {concurrent > 0
                    ? `${Math.round(concurrent).toLocaleString()} concurrent activities ÷ ${WORKER_RATIOS[workerProfile].ratio} (${workerProfile})`
                    : 'Enter concurrent activities above to estimate'
                  }
                </td>
              </tr>
              <tr>
                <td>Cassandra</td>
                <td>{cassandraNodes} nodes</td>
                <td>{fmt3(cassandraMem)} TiB</td>
                <td>RF=3 minimum enforced; memory-heavy, caches active workflows</td>
              </tr>
              <tr className={styles.totalRow}>
                <td>Total Cadence cores</td>
                <td>{totalCores}</td>
                <td>—</td>
                <td>History + Frontend + Matching at {actionsPerSec} updates/sec</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.caveat}>
            Coefficients derived from prod11 at 11,444 updates/sec. All service cores round up; Cassandra minimum is 3 nodes (RF=3).
          </p>
        </div>
      )}
    </div>
  );
}
