import React, { useId, useMemo, useState } from "react";
import snapshot from "../data/hotTaskLists.json";
import { ArrowheadMarker, calloutArrowPath, usePrefersReducedMotion, useWidth } from "./chartKit";
import styles from "./charts.module.css";

/*
 * A small, faithful model of Shard Manager's load-aware rebalance loop:
 *  - executors above 1.15× the mean are sources, below 0.90× are destinations
 *    (any executor is a destination if max/mean >= 1.3 and nobody is below 0.90×)
 *  - one move per cycle: to the coldest destination, from the hottest source that has
 *    a shard whose move lowers src² + dst² (so a move never overshoots)
 *  - a shard that just moved cools down for a few cycles
 * The demo precomputes each cycle as a step the reader clicks through.
 */

interface Shard {
  id: number;
  load: number;
  owner: number;
  lastMoveTick: number;
}

interface Frame {
  shards: Shard[];
  tick: number;
  caption: string;
}

const EXECUTORS = 6;
const SHARDS = 30;
const MEAN_LOAD = 100;
const COOLDOWN_TICKS = 5;
const UPPER_BAND = 1.15;
const LOWER_BAND = 0.9;
const SEVERE_RATIO = 1.3;
const SEED = 80;
// Spread of shard loads (sigma of a log-normal). Production shard loads are heavily skewed.
const LOAD_SKEW = 1.2;
const NEVER = -1000;
const MAX_CYCLES = 100;
// In the snapshot, task lists below this share of an average host are a pixel or two tall,
// so each host's are drawn as one block.
const VISIBLE_SHARE = 0.1;

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number) {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // murmur3 finalizer, so similar keys still hash far apart
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

// The hash ring gives every host the same number of shards: shards are sorted by their
// hash and each host owns one contiguous run. With many shards per host that's what a
// real ring converges to. The loads are what differ.
function initialShards(): Shard[] {
  const random = mulberry32(SEED);
  const raw = Array.from({ length: SHARDS }, () => Math.exp(LOAD_SKEW * gaussian(random)));
  const sum = raw.reduce((a, b) => a + b, 0);
  const shardsPerHost = SHARDS / EXECUTORS;
  const owners = new Array<number>(SHARDS);
  const hashOrder = raw.map((_, id) => id).sort((a, b) => fnv1a(`shard-${a}`) - fnv1a(`shard-${b}`));
  hashOrder.forEach((id, rank) => {
    owners[id] = Math.floor(rank / shardsPerHost);
  });
  return raw.map((r, id) => ({
    id,
    load: (r / sum) * EXECUTORS * MEAN_LOAD,
    owner: owners[id],
    lastMoveTick: NEVER,
  }));
}

// A real cluster at the best possible placement. Loads in the data are multiples of an average host.
function snapshotShards(): Shard[] {
  if (snapshot.hosts.length !== EXECUTORS) {
    throw new Error(`snapshot has ${snapshot.hosts.length} hosts, the stage draws ${EXECUTORS}`);
  }
  const shards: Shard[] = [];
  snapshot.hosts.forEach((shares, owner) => {
    const visible = shares.filter((share) => share >= VISIBLE_SHARE);
    const smallTotal = shares.filter((share) => share < VISIBLE_SHARE).reduce((a, b) => a + b, 0);
    const blocks = smallTotal > 0 ? [...visible, smallTotal] : visible;
    for (const share of blocks) {
      shards.push({ id: shards.length, load: share * MEAN_LOAD, owner, lastMoveTick: NEVER });
    }
  });
  return shards;
}

function executorLoads(shards: Shard[]): number[] {
  const loads = new Array(EXECUTORS).fill(0);
  for (const shard of shards) loads[shard.owner] += shard.load;
  return loads;
}

function meanOf(loads: number[]): number {
  return loads.reduce((a, b) => a + b, 0) / loads.length;
}

type Plan =
  | { kind: "move"; shardId: number; from: number; to: number; size: number }
  | { kind: "balanced" }
  | { kind: "withinBand" }
  | { kind: "coolingDown"; source: number }
  | { kind: "stuck"; source: number };

function planMove(shards: Shard[], tick: number): Plan {
  const loads = executorLoads(shards);
  const mean = meanOf(loads);
  const sources = loads
    .map((load, executor) => ({ load, executor }))
    .filter(({ load }) => load > mean * UPPER_BAND)
    .sort((a, b) => b.load - a.load);
  if (sources.length === 0) return { kind: "balanced" };

  let destinations = loads.map((load, executor) => ({ load, executor })).filter(({ load }) => load < mean * LOWER_BAND);
  if (destinations.length === 0) {
    if (Math.max(...loads) / mean < SEVERE_RATIO) return { kind: "withinBand" };
    destinations = loads.map((load, executor) => ({ load, executor }));
  }
  const destination = destinations.reduce((a, b) => (b.load < a.load ? b : a));

  let anyCooling = false;
  for (const source of sources) {
    if (source.executor === destination.executor) continue;
    const s = source.load;
    const d = destination.load;
    let best: { shard: Shard; benefit: number } | null = null;
    for (const shard of shards) {
      if (shard.owner !== source.executor) continue;
      if (tick - shard.lastMoveTick < COOLDOWN_TICKS) {
        anyCooling = true;
        continue;
      }
      const x = shard.load;
      const benefit = s * s + d * d - (s - x) * (s - x) - (d + x) * (d + x);
      if (benefit > 0 && (best === null || benefit > best.benefit)) best = { shard, benefit };
    }
    if (best) {
      return {
        kind: "move",
        shardId: best.shard.id,
        from: source.executor,
        to: destination.executor,
        size: best.shard.load,
      };
    }
  }
  return anyCooling
    ? { kind: "coolingDown", source: sources[0].executor }
    : { kind: "stuck", source: sources[0].executor };
}

function applyMove(shards: Shard[], plan: Extract<Plan, { kind: "move" }>, tick: number): Shard[] {
  return shards.map((shard) => (shard.id === plan.shardId ? { ...shard, owner: plan.to, lastMoveTick: tick } : shard));
}

// Runs the rebalance loop from `start` until it stops, reporting each move and the final state.
function runUntilStopped(
  start: Shard[],
  onMove: (shards: Shard[], plan: Extract<Plan, { kind: "move" }>, tick: number) => void,
) {
  let shards = start;
  for (let tick = 1; tick <= MAX_CYCLES; tick++) {
    const plan = planMove(shards, tick);
    if (plan.kind === "move") {
      shards = applyMove(shards, plan, tick);
      onMove(shards, plan, tick);
    } else if (plan.kind !== "coolingDown") {
      return { shards, tick, plan };
    }
  }
  throw new Error("rebalance did not settle");
}

// Captions

function hostList(hosts: number[]): string {
  const names = hosts.map((h) => String(h + 1));
  const prefix = names.length === 1 ? "Host" : "Hosts";
  const joined = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${prefix} ${joined}`;
}

function ratio(value: number): string {
  return `${value.toFixed(2)}×`;
}

function hottestOverMean(shards: Shard[]): number {
  const loads = executorLoads(shards);
  return Math.max(...loads) / meanOf(loads);
}

function rebalanceFrames(): Frame[] {
  const start = initialShards();
  const loads = executorLoads(start);
  const mean = meanOf(loads);
  const hot = loads.flatMap((load, host) => (load > mean * UPPER_BAND ? [host] : []));
  const frames: Frame[] = [
    {
      shards: start,
      tick: 0,
      caption: `1: Hash ring placement. ${hostList(hot)} ${hot.length === 1 ? "is" : "are"} too hot.`,
    },
  ];

  let moves = 0;
  const end = runUntilStopped(start, (shards, plan, tick) => {
    moves++;
    const move = `${moves + 1}: Host ${plan.from + 1} → Host ${plan.to + 1}`;
    let caption = `${move}.`;
    if (moves === 1) caption = `${move}. Move the shard that evens the two out the most.`;
    if (moves === 2) caption = `${move}. Host 3 is now the coldest, so the move goes there.`;
    frames.push({ shards, tick, caption });
  });

  frames.push({
    shards: end.shards,
    tick: end.tick + COOLDOWN_TICKS,
    caption: "6: Every host is inside the bands, so we stop moving shards.",
  });
  return frames;
}

// Rendering

interface StageProps {
  shards: Shard[];
  width: number;
  tick: number;
  showBand: boolean;
  // Load units the stage height represents. Fixed per demo so blocks keep their size between steps.
  scaleMax: number;
  // Shown in the top of the card, above the shards.
  header?: React.ReactNode;
  // A two-line arrow callout at the hottest host, so the reader doesn't have to find it in the small labels.
  hottestCallout?: { title: string; detail: string };
}

function Stage({ shards, width, tick, showBand, scaleMax, header, hottestCallout }: StageProps) {
  const stageHeight = width < 640 ? 300 : 360;
  const labelSpace = 50;
  const topSpace = 16;
  const loads = executorLoads(shards);
  const mean = meanOf(loads);
  const pxPerUnit = (stageHeight - labelSpace - topSpace) / scaleMax;
  const baseline = stageHeight - labelSpace;
  const columnWidth = width / EXECUTORS;
  const blockWidth = Math.min(columnWidth * 0.56, 72);

  const positioned = useMemo(() => {
    const stackHeights = new Array(EXECUTORS).fill(0);
    // Shards that moved most recently sit on top of their new stack.
    const stackOrder = [...shards].sort((a, b) => a.lastMoveTick - b.lastMoveTick || a.id - b.id);
    const placed = stackOrder.map((shard) => {
      const heightPx = Math.max(2, shard.load * pxPerUnit - 2);
      const top = baseline - stackHeights[shard.owner] - heightPx - 2;
      stackHeights[shard.owner] += heightPx + 2;
      const left = shard.owner * columnWidth + (columnWidth - blockWidth) / 2;
      return { shard, left, top, heightPx };
    });
    // Render in a fixed order. If React reordered the elements, the moved ones would be
    // re-inserted into the DOM and jump instead of sliding.
    return placed.sort((a, b) => a.shard.id - b.shard.id);
  }, [shards, pxPerUnit, baseline, columnWidth, blockWidth]);

  return (
    <div className={styles.demoStage}>
      {header && <div className={styles.stageHeader}>{header}</div>}
      <div className={styles.stagePlot} style={{ height: stageHeight }} aria-hidden="true">
        {showBand && (
          <div
            className={styles.band}
            style={{
              top: baseline - mean * UPPER_BAND * pxPerUnit,
              height: mean * (UPPER_BAND - LOWER_BAND) * pxPerUnit,
            }}
          />
        )}
        <div className={styles.meanLine} style={{ top: baseline - mean * pxPerUnit }} />

        {positioned.map(({ shard, left, top, heightPx }) => {
          // Full blue for the shard that moved this step, a clearly lighter blue that fades
          // toward grey for earlier moves still in their cooldown.
          const sinceMove = tick - shard.lastMoveTick;
          const cooling = sinceMove < COOLDOWN_TICKS;
          const blueShare = sinceMove === 0 ? 100 : Math.round(50 - (sinceMove / COOLDOWN_TICKS) * 30);
          const background = cooling ? `color-mix(in srgb, var(--after) ${blueShare}%, var(--neutral))` : undefined;
          return (
            <div
              key={shard.id}
              className={styles.shard}
              style={{
                width: blockWidth,
                height: heightPx,
                transform: `translate(${left}px, ${top}px)`,
                background,
                // The shard that just moved travels over the others, not behind them.
                zIndex: sinceMove === 0 ? 1 : undefined,
              }}
            />
          );
        })}

        {loads.map((load, executor) => (
          <div
            key={executor}
            className={`${styles.columnLabel} ${load > mean * UPPER_BAND ? styles.columnLabelHot : ""}`}
            style={{ left: executor * columnWidth, width: columnWidth }}
          >
            host {executor + 1}
            <br />
            {(load / mean).toFixed(2)}×
          </div>
        ))}

        {hottestCallout && (
          <HottestAnnotation
            title={hottestCallout.title}
            detail={hottestCallout.detail}
            loads={loads}
            positioned={positioned}
            width={width}
            height={stageHeight}
            columnWidth={columnWidth}
            blockWidth={blockWidth}
          />
        )}
      </div>
    </div>
  );
}

interface HottestAnnotationProps {
  title: string;
  detail: string;
  loads: number[];
  positioned: { shard: Shard; top: number }[];
  width: number;
  height: number;
  columnWidth: number;
  blockWidth: number;
}

// A two-line label beside the top of the hottest stack, on whichever side has more room,
// with a curved arrow to the stack.
function HottestAnnotation({
  title,
  detail,
  loads,
  positioned,
  width,
  height,
  columnWidth,
  blockWidth,
}: HottestAnnotationProps) {
  const markerId = useId();
  const hottest = loads.indexOf(Math.max(...loads));
  const stackTop = Math.min(...positioned.filter(({ shard }) => shard.owner === hottest).map(({ top }) => top));
  const blockLeft = hottest * columnWidth + (columnWidth - blockWidth) / 2;

  const labelOnLeft = hottest >= EXECUTORS / 2;
  const towardStack = labelOnLeft ? 1 : -1;
  const tipX = labelOnLeft ? blockLeft - 6 : blockLeft + blockWidth + 6;
  const tipY = stackTop + 18;
  const textX = tipX - towardStack * 40;
  const textY = stackTop + 4;
  const arrow = calloutArrowPath(textX + towardStack * 6, textY - 4, tipX, tipY);

  return (
    <svg className={styles.annotationLayer} width={width} height={height}>
      <defs>
        <ArrowheadMarker id={markerId} />
      </defs>
      <path d={arrow} className={styles.annotationArrow} markerEnd={`url(#${markerId})`} />
      <text x={textX} y={textY} textAnchor={labelOnLeft ? "end" : "start"}>
        <tspan className={styles.calloutTitle}>{title}</tspan>
        <tspan x={textX} dy="1.35em" className={styles.calloutText}>
          {detail}
        </tspan>
      </text>
    </svg>
  );
}

function LegendBox({ background, shadow, label }: { background: string; shadow?: string; label: string }) {
  return (
    <span className={styles.legendItem}>
      <span className={styles.legendBox} style={{ background, boxShadow: shadow }} />
      {label}
    </span>
  );
}

function scaleFor(frames: Shard[][]): number {
  const tallest = Math.max(...frames.map((shards) => Math.max(...executorLoads(shards))));
  return Math.max(2.3 * MEAN_LOAD, tallest * 1.08);
}

// The starting point: shards wherever the ring puts them. Static on purpose.
export function HashRingPlacement() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const shards = useMemo(initialShards, []);

  return (
    <div className={styles.demo} ref={ref}>
      <Stage
        shards={shards}
        width={width}
        tick={0}
        showBand={false}
        scaleMax={scaleFor([shards])}
        hottestCallout={{ title: "Hottest host", detail: `${ratio(hottestOverMean(shards))} the average` }}
      />
      <div className={styles.readouts}>
        <span>
          <span className={styles.readoutValue}>{ratio(hottestOverMean(shards))}</span>
          hottest ÷ average
        </span>
        <span className={styles.legend}>
          <LegendBox background="var(--neutral)" label="shard (height = load)" />
          <LegendBox background="transparent" shadow="inset 0 -1px 0 var(--after)" label="average host" />
        </span>
      </div>
    </div>
  );
}

// A real cluster where a few task lists carry nearly all the load. Static, like the hash ring.
export function HotTaskListPlacement() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const shards = useMemo(snapshotShards, []);

  return (
    <div className={styles.demo} ref={ref}>
      <Stage
        shards={shards}
        width={width}
        tick={0}
        showBand={false}
        scaleMax={scaleFor([shards])}
        hottestCallout={{ title: "Hottest host", detail: "holds a single task list" }}
      />
      <div className={styles.readouts}>
        <span>
          <span className={styles.readoutValue}>{ratio(hottestOverMean(shards))}</span>
          hottest ÷ average
        </span>
        <span className={styles.legend}>
          <LegendBox background="var(--neutral)" label="task list (height = load)" />
          <LegendBox background="transparent" shadow="inset 0 -1px 0 var(--after)" label="average host" />
        </span>
      </div>
    </div>
  );
}

// The hash ring's placement next to where Shard Manager settles, for the top of the post.
// Static, like the hash ring. Side by side on wide screens, stacked on phones.
export function BeforeAfterPlacement() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const frames = useMemo(rebalanceFrames, []);
  const before = frames[0].shards;
  const after = frames[frames.length - 1];
  const scaleMax = useMemo(() => scaleFor([before, after.shards]), [before, after]);
  const stacked = width < 640;
  const arrowSpace = stacked ? 0 : 40;
  const stageWidth = stacked ? width : (width - arrowSpace) / 2;

  return (
    <div className={`${styles.demo} ${styles.beforeAfterBlock}`} ref={ref}>
      <div className={stacked ? styles.beforeAfterStacked : styles.beforeAfter}>
        <Stage
          shards={before}
          width={stageWidth}
          tick={0}
          showBand
          scaleMax={scaleMax}
          header={
            <p className={styles.stepCaption}>Distribution with hash ring</p>
          }
        />
        <svg className={styles.beforeAfterArrow} width={32} height={32} viewBox="0 0 32 32" aria-hidden="true">
          <path d="M4 16h22M18 8l8 8-8 8" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Stage
          shards={after.shards}
          width={stageWidth}
          tick={after.tick}
          showBand
          scaleMax={scaleMax}
          header={
            <p className={styles.stepCaption}>Distribution with Shard Manager</p>
          }
        />
      </div>
      <div className={styles.readouts}>
        <span className={styles.legend}>
          <LegendBox background="var(--neutral)" label="shard (height = load)" />
          <LegendBox
            background="var(--after-wash)"
            shadow="inset 0 -1px 0 var(--after)"
            label="average host and target range"
          />
        </span>
      </div>
    </div>
  );
}

// Shard Manager's rebalance loop from the hash ring's placement, one cycle per step.
export default function ShardManagerDemo() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const reducedMotion = usePrefersReducedMotion();
  const frames = useMemo(rebalanceFrames, []);
  const scaleMax = useMemo(() => scaleFor(frames.map((frame) => frame.shards)), [frames]);
  const [index, setIndex] = useState(0);
  const frame = frames[index];
  const last = frames.length - 1;

  const go = (next: number) => setIndex(Math.min(last, Math.max(0, next)));
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  };

  return (
    <div className={`${styles.demo} ${reducedMotion ? styles.reducedMotion : ""}`} ref={ref} onKeyDown={onKeyDown}>
      <Stage
        shards={frame.shards}
        width={width}
        tick={frame.tick}
        showBand
        scaleMax={scaleMax}
        header={
          <>
            {/* Every caption sits in the same grid cell, so the header is as tall as the longest
                one and the shards don't jump when a caption wraps. */}
            <div className={styles.captionStack} aria-live="polite">
              {frames.map((f, i) => (
                <p key={i} className={`${styles.stepCaption} ${i === index ? "" : styles.captionHidden}`}>
                  {f.caption}
                </p>
              ))}
            </div>
            <nav className={styles.stepper} aria-label="Steps">
              <button type="button" className={styles.stepNav} onClick={() => go(index - 1)} disabled={index === 0}>
                Prev
              </button>
              {frames.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === index ? styles.stepActive : styles.step}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Step ${i + 1} of ${frames.length}`}
                  onClick={() => go(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button type="button" className={styles.stepNext} onClick={() => go(index + 1)} disabled={index === last}>
                Next
              </button>
            </nav>
          </>
        }
      />

      <div className={styles.readouts}>
        <span>
          <span className={styles.readoutValue}>{ratio(hottestOverMean(frame.shards))}</span>
          hottest ÷ average
        </span>
        <span className={styles.legend}>
          <LegendBox background="var(--neutral)" label="shard (height = load)" />
          <LegendBox background="var(--after)" label="just moved" />
          <LegendBox
            background="var(--after-wash)"
            shadow="inset 0 -1px 0 var(--after)"
            label="average host and hysteresis bands"
          />
        </span>
      </div>
    </div>
  );
}
