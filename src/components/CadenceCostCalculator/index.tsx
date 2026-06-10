import React, { useState } from 'react';
import styles from './styles.module.css';

const CADENCE_COST_MULTIPLIER = 0.10;
const SAVINGS_PERCENTAGE = 90;
const DEFAULT_TEMPORAL_COST = 10000;
const DEFAULT_REQUESTS = 100_000_000; // 100M requests/month
// $1 per 1,000,000 requests
const CADENCE_COST_PER_MILLION_REQUESTS = 1;

type Mode = 'temporal-cost' | 'request-volume';

function formatCurrency(value: number): string {
  return '$' + Math.round(value).toLocaleString('en-US');
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function sanitizeDecimal(raw: string): string {
  // Strip non-numeric characters, then remove any extra decimal points beyond the first
  return raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

function parsePositive(raw: string): number {
  return Math.max(0, parseFloat(raw.replace(/[^0-9.]/g, '')) || 0);
}

export default function CadenceCostCalculator(): React.ReactElement {
  const [mode, setMode] = useState<Mode>('temporal-cost');
  const [temporalRaw, setTemporalRaw] = useState(String(DEFAULT_TEMPORAL_COST));
  const [requestsRaw, setRequestsRaw] = useState(String(DEFAULT_REQUESTS));

  // Mode 1: known Temporal cost → estimate Cadence cost
  const temporalMonthlyCost = parsePositive(temporalRaw);
  const cadenceFromTemporal = temporalMonthlyCost * CADENCE_COST_MULTIPLIER;
  const monthlySavingsFromTemporal = temporalMonthlyCost - cadenceFromTemporal;
  const annualSavingsFromTemporal = monthlySavingsFromTemporal * 12;

  // Mode 2: known request volume → estimate Cadence cost at $1/1M requests
  const monthlyRequests = parsePositive(requestsRaw);
  const cadenceFromRequests = (monthlyRequests / 1_000_000) * CADENCE_COST_PER_MILLION_REQUESTS;
  // Temporal equivalent = Cadence cost ÷ 0.10 (i.e. × 10)
  const temporalEquivalent = cadenceFromRequests / CADENCE_COST_MULTIPLIER;
  const savingsFromRequests = temporalEquivalent - cadenceFromRequests;
  const annualSavingsFromRequests = savingsFromRequests * 12;

  const hasTemporalValue = temporalMonthlyCost > 0;
  const hasRequestValue = monthlyRequests > 0;

  return (
    <div className={styles.calculator}>
      <div className={styles.tabs} role="tablist" aria-label="Calculator mode">
        <button
          role="tab"
          aria-selected={mode === 'temporal-cost'}
          className={`${styles.tab} ${mode === 'temporal-cost' ? styles.tabActive : ''}`}
          onClick={() => setMode('temporal-cost')}
        >
          I know my Temporal cost
        </button>
        <button
          role="tab"
          aria-selected={mode === 'request-volume'}
          className={`${styles.tab} ${mode === 'request-volume' ? styles.tabActive : ''}`}
          onClick={() => setMode('request-volume')}
        >
          I know my request volume
        </button>
      </div>

      {mode === 'temporal-cost' && (
        <>
          <div className={styles.inputSection}>
            <label htmlFor="temporal-cost-input" className={styles.label}>
              Current or estimated Temporal monthly cost (USD)
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.currencyPrefix}>$</span>
              <input
                id="temporal-cost-input"
                type="text"
                inputMode="decimal"
                className={styles.input}
                value={temporalRaw}
                onChange={e => setTemporalRaw(sanitizeDecimal(e.target.value))}
                placeholder="10000"
                aria-label="Current or estimated Temporal monthly cost in USD"
              />
            </div>
          </div>

          {hasTemporalValue ? (
            <div className={styles.results}>
              <div className={styles.resultCard}>
                <div className={styles.resultLabel}>Estimated Cadence monthly cost</div>
                <div className={styles.resultValue}>{formatCurrency(cadenceFromTemporal)}</div>
                <div className={styles.resultSubtext}>per month</div>
              </div>
              <div className={`${styles.resultCard} ${styles.resultCardSavings}`}>
                <div className={styles.resultLabel}>Estimated monthly savings</div>
                <div className={styles.resultValueLarge}>{formatCurrency(monthlySavingsFromTemporal)}</div>
                <div className={styles.resultSubtext}>per month with Cadence</div>
              </div>
              <div className={`${styles.resultCard} ${styles.resultCardSavings}`}>
                <div className={styles.resultLabel}>Estimated annual savings</div>
                <div className={styles.resultValueLarge}>{formatCurrency(annualSavingsFromTemporal)}</div>
                <div className={styles.resultSubtext}>per year with Cadence</div>
              </div>
              <div className={styles.resultCard}>
                <div className={styles.resultLabel}>Savings percentage</div>
                <div className={styles.resultValueLarge}>{SAVINGS_PERCENTAGE}%</div>
                <div className={styles.resultSubtext}>cheaper than Temporal</div>
              </div>
            </div>
          ) : (
            <p className={styles.emptyHint}>Enter a monthly cost above to see your estimated Cadence savings.</p>
          )}
        </>
      )}

      {mode === 'request-volume' && (
        <>
          <div className={styles.inputSection}>
            <label htmlFor="request-volume-input" className={styles.label}>
              Monthly workflow requests / actions
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="request-volume-input"
                type="text"
                inputMode="numeric"
                className={styles.input}
                style={{ paddingLeft: '0.75rem' }}
                value={requestsRaw}
                onChange={e => setRequestsRaw(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="100000000"
                aria-label="Monthly workflow requests or actions"
              />
            </div>
            <p className={styles.inputHint}>
              Cadence is priced at $1 per 1,000,000 requests.
            </p>
          </div>

          {hasRequestValue ? (
            <div className={styles.results}>
              <div className={styles.resultCard}>
                <div className={styles.resultLabel}>Monthly requests</div>
                <div className={styles.resultValue}>{formatNumber(monthlyRequests)}</div>
                <div className={styles.resultSubtext}>workflow actions / month</div>
              </div>
              <div className={styles.resultCard}>
                <div className={styles.resultLabel}>Estimated Cadence monthly cost</div>
                <div className={styles.resultValue}>{formatCurrency(cadenceFromRequests)}</div>
                <div className={styles.resultSubtext}>at $1 / 1M requests</div>
              </div>
              <div className={`${styles.resultCard} ${styles.resultCardSavings}`}>
                <div className={styles.resultLabel}>Estimated Temporal monthly cost</div>
                <div className={styles.resultValueLarge}>{formatCurrency(temporalEquivalent)}</div>
                <div className={styles.resultSubtext}>comparable Temporal workload</div>
              </div>
              <div className={`${styles.resultCard} ${styles.resultCardSavings}`}>
                <div className={styles.resultLabel}>Estimated annual savings</div>
                <div className={styles.resultValueLarge}>{formatCurrency(annualSavingsFromRequests)}</div>
                <div className={styles.resultSubtext}>per year with Cadence vs Temporal</div>
              </div>
            </div>
          ) : (
            <p className={styles.emptyHint}>Enter your monthly request volume to estimate Cadence cost and compare it against Temporal.</p>
          )}
        </>
      )}
    </div>
  );
}
