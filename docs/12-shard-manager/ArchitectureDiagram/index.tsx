import React from 'react';
import styles from './styles.module.css';

const FONT = 'system-ui, sans-serif';

function Box({
  x,
  y,
  w,
  h,
  rx = 6,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      fill="var(--d-box)"
      stroke="var(--d-box-border)"
      strokeWidth={1.5}
    />
  );
}

function Title({x, y, children}: {x: number; y: number; children: string}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize={16}
      fontWeight={600}
      fill="var(--d-text)">
      {children}
    </text>
  );
}

function Caption({
  x,
  y,
  size = 12.5,
  children,
}: {
  x: number;
  y: number;
  size?: number;
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize={size}
      fill="var(--d-muted)">
      {children}
    </text>
  );
}

function GroupLabel({x, y, children}: {x: number; y: number; children: string}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize={13.5}
      fontWeight={700}
      letterSpacing={1}
      fill="var(--d-muted)">
      {children}
    </text>
  );
}

/** A small rounded tag, used for the shard chips on executors. */
function Chip({
  x,
  y,
  w,
  label,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={22}
        rx={4}
        fill="var(--d-chip)"
        stroke="var(--d-chip-border)"
      />
      <text
        x={x + w / 2}
        y={y + 15}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={12.5}
        fill="var(--d-muted)">
        {label}
      </text>
    </g>
  );
}

/** One Shard Manager instance, with the namespace it currently leads. */
function Instance({
  y,
  name,
  leads,
}: {
  y: number;
  name: string;
  leads: string;
}) {
  return (
    <g>
      <Box x={80} y={y} w={280} h={46} />
      <text
        x={98}
        y={y + 29}
        fontFamily={FONT}
        fontSize={15}
        fontWeight={600}
        fill="var(--d-text)">
        {name}
      </text>
      <rect
        x={228}
        y={y + 12}
        width={116}
        height={22}
        rx={11}
        fill="var(--d-accent-soft)"
      />
      <text
        x={286}
        y={y + 27}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={12.5}
        fontWeight={600}
        fill="var(--d-accent)">
        {leads}
      </text>
    </g>
  );
}

/** A dashed connector. Arrowheads are opt-in at either end. */
function Link({
  x1,
  y1,
  x2,
  y2,
  start = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  start?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--d-line)"
      strokeWidth={1.5}
      strokeDasharray="6 4"
      markerStart={start ? 'url(#sm-arrow)' : undefined}
      markerEnd="url(#sm-arrow)"
    />
  );
}

function LinkLabel({
  x,
  y,
  anchor = 'middle',
  children,
}: {
  x: number;
  y: number;
  anchor?: 'start' | 'middle' | 'end';
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={FONT}
      fontSize={13}
      fill="var(--d-muted)">
      {children}
    </text>
  );
}

export default function ArchitectureDiagram(): React.ReactElement {
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.diagram}
        viewBox="0 0 720 452"
        width={720}
        height={452}
        role="img"
        aria-labelledby="sm-arch-title sm-arch-desc">
        <title id="sm-arch-title">Shard Manager architecture</title>
        <desc id="sm-arch-desc">
          Executors and spectators in your application talk only to Shard
          Manager. Shard Manager keeps all state in etcd, and one instance is
          elected leader per namespace. Requests from a spectator go directly to
          the executor that owns the shard, not through Shard Manager.
        </desc>

        <defs>
          <marker
            id="sm-arrow"
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-line)" />
          </marker>
          <marker
            id="sm-arrow-accent"
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-accent)" />
          </marker>
        </defs>

        <rect
          x={0.75}
          y={0.75}
          width={718.5}
          height={450.5}
          rx={10}
          fill="var(--d-surface)"
          stroke="var(--d-surface-border)"
          strokeWidth={1.5}
        />

        {/* Shard Manager service */}
        <rect
          x={60}
          y={28}
          width={320}
          height={158}
          rx={8}
          fill="var(--d-group)"
          stroke="var(--d-group-border)"
          strokeWidth={1.5}
        />
        <GroupLabel x={220} y={52}>SHARD MANAGER</GroupLabel>
        <Instance y={66} name="Instance 1" leads="leader · ns-a" />
        <Instance y={122} name="Instance 2" leads="leader · ns-b" />

        {/* etcd */}
        <Box x={470} y={84} w={170} h={76} />
        <Title x={555} y={113}>etcd</Title>
        <Caption x={555} y={133} size={12}>assignments · leases</Caption>
        <Caption x={555} y={150} size={12}>leader election</Caption>
        <Link x1={384} y1={121} x2={466} y2={121} start />
        <LinkLabel x={425} y={112}>state</LinkLabel>

        {/* Your application */}
        <rect
          x={40}
          y={270}
          width={640}
          height={170}
          rx={8}
          fill="var(--d-group)"
          stroke="var(--d-group-border)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
        <GroupLabel x={360} y={296}>YOUR SHARDED APPLICATION</GroupLabel>

        <Box x={50} y={312} w={190} h={80} />
        <Title x={145} y={337}>Executor A</Title>
        <Caption x={145} y={357}>shard processors</Caption>
        <Chip x={68} y={365} w={46} label="s1" />
        <Chip x={122} y={365} w={46} label="s4" />
        <Chip x={176} y={365} w={46} label="s7" />

        <Box x={265} y={312} w={190} h={80} />
        <Title x={360} y={337}>Executor B</Title>
        <Caption x={360} y={357}>shard processors</Caption>
        <Chip x={283} y={365} w={46} label="s2" />
        <Chip x={337} y={365} w={46} label="s5" />
        <Chip x={391} y={365} w={46} label="s8" />

        <Box x={480} y={312} w={190} h={80} />
        <Title x={575} y={337}>Spectator</Title>
        <Caption x={575} y={357}>routes by shard key</Caption>
        <Chip x={510} y={365} w={130} label="GetShardOwner" />

        {/* Application to Shard Manager */}
        <Link x1={145} y1={268} x2={150} y2={190} start />
        <Link x1={360} y1={268} x2={260} y2={190} start />
        <Link x1={575} y1={268} x2={350} y2={190} start />
        <LinkLabel x={230} y={240}>Heartbeat ⇄ assignments</LinkLabel>
        <LinkLabel x={502} y={240} anchor="start">owner lookups · watch stream</LinkLabel>

        {/* The data path never goes through Shard Manager. */}
        <path
          d="M 575 392 C 515 442 205 442 145 392"
          fill="none"
          stroke="var(--d-accent)"
          strokeWidth={1.5}
          markerEnd="url(#sm-arrow-accent)"
        />
        <text
          x={360}
          y={413}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={12.5}
          fontWeight={600}
          fill="var(--d-accent)">
          requests go straight to the owning host
        </text>
      </svg>
      <figcaption className={styles.caption}>
        The Shard Manager architecture, the manager, its etcd store, and a
        sharded application running both executors and a spectator.
        One Shard Manager instance is elected leader per namespace.
      </figcaption>
    </figure>
  );
}
