import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: string;
  Icon: React.FC;
};

// Inlined line icons (matching GetInvolvedBanner's icon style) instead of the
// old 200px illustration SVGs, to keep this section compact and high-density.
const StateMachineIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5" cy="12" r="3" />
    <circle cx="19" cy="6" r="3" />
    <circle cx="19" cy="18" r="3" />
    <path d="M7.8 10.7l8.4-3.4" />
    <path d="M7.8 13.3l8.4 3.4" />
  </svg>
);

const DatabaseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
    <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
  </svg>
);

const QueueIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="14" height="4" rx="1" />
    <rect x="3" y="10" width="14" height="4" rx="1" />
    <rect x="3" y="16" width="10" height="4" rx="1" />
  </svg>
);

const FEATURES: FeatureItem[] = [
  {
    title: 'Event-Sourced State',
    description: 'Workflows resume seamlessly from exact points of failure using execution history logs.',
    Icon: StateMachineIcon,
  },
  {
    title: 'No External Message Queues',
    description: 'Eliminate SQS/RabbitMQ management: Cadence handles task matching and queuing natively.',
    Icon: QueueIcon,
  },
  {
    title: 'Pluggable Persistence',
    description: 'Scalable storage backend support for Cassandra, PostgreSQL, MySQL, and OpenSearch.',
    Icon: DatabaseIcon,
  },
];

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <Heading as="h2" className={clsx('homepage-section-heading', styles.heading)}>
        Why Cadence?
      </Heading>

      <div className={styles.grid}>
        {FEATURES.map(({ title, description, Icon }) => (
          <div className={styles.item} key={title}>
            <span className={styles.iconWrap}>
              <Icon />
            </span>
            <div>
              <Heading as="h3" className={styles.itemTitle}>
                {title}
              </Heading>
              <p className={styles.itemDesc}>{description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.socialProof}>
        Powering mission-critical workflows at companies like Uber, DoorDash, and NetApp.
      </p>

      <Link to="/docs/concepts" className={styles.cta}>
        Explore Cadence Architecture & Core Concepts →
      </Link>
    </section>
  );
}
