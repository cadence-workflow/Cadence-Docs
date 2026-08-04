import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

// Social-proof band shown directly under the hero: it leads with Cadence's
// CNCF Sandbox status (the strongest third-party credibility signal) and backs
// it with a compact auto-scrolling marquee of production adopters.
//
// NOTE: the adopter marks are preview crops from the Dispatch deck. Before this
// ships publicly, swap them for official brand SVGs and confirm logo-use
// permission with each organization (see ADOPTERS.md).
const ADOPTERS = [
  { name: 'Uber', file: 'uber.png' },
  { name: 'DoorDash', file: 'doordash.png' },
  { name: 'NetApp', file: 'netapp.png' },
  { name: 'athenahealth', file: 'athenahealth.png' },
  { name: 'Cloudera', file: 'cloudera.png' },
];

export default function Adopters(): JSX.Element {
  // Single hook call for the asset folder keeps paths correct under a project
  // baseUrl (e.g. /Cadence-Docs/) without calling useBaseUrl inside the map.
  const dir = useBaseUrl('/img/adopters/');

  // Two identical groups so the track can loop seamlessly (translateX -50%).
  // The duplicate is aria-hidden so screen readers announce each adopter once.
  const renderGroup = (duplicate: boolean) => (
    <ul className={styles.group} aria-hidden={duplicate || undefined}>
      {ADOPTERS.map((a) => (
        <li key={a.name}>
          <img src={`${dir}${a.file}`} alt={duplicate ? '' : a.name} title={a.name} />
        </li>
      ))}
    </ul>
  );

  return (
    <section className={styles.adopters}>
      <div className="container">
        <Link
          className={styles.cncfBadge}
          href="https://www.cncf.io/projects/cadence-workflow/">
          <img
            src={`${dir}cncf.png`}
            alt="Cloud Native Computing Foundation"
            className={styles.cncfMark}
          />
          <span className={styles.cncfText}>
            <strong>Cadence is a CNCF Sandbox project</strong>
            <span className={styles.cncfSub}>
              Open governance under the Cloud Native Computing Foundation
            </span>
          </span>
        </Link>
      </div>

      <div className={clsx('container', styles.intro)}>
        <Heading as="h2" className={styles.introTitle}>
          Durable orchestration, proven at scale
        </Heading>
        <p className={styles.introBody}>
          Created at Uber in 2016, Cadence is a fault-tolerant, highly scalable
          workflow orchestration engine. It manages distributed state, retries,
          scaling, and failure recovery so teams can focus on business logic
          instead of infrastructure, powering thousands of use cases across more
          than 150 companies in finance, e-commerce, healthcare, and
          transportation.
        </p>
      </div>

      <p className={styles.eyebrow}>Running in production at scale</p>

      <div className={styles.marquee}>
        <div className={styles.track}>
          {renderGroup(false)}
          {renderGroup(true)}
        </div>
      </div>

      <div className="container">
        <p className={styles.slack}>
          <Link href="https://cadenceworkflow.io/community">
            +2,500 members in #cadence-users on Slack
          </Link>
        </p>
      </div>
    </section>
  );
}
