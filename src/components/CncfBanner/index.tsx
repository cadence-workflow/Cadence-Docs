import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

// Slim credibility band shown directly under the hero. It surfaces Cadence's
// CNCF membership — the strongest third-party trust signal — as a single
// pill that links to the project's CNCF landing page.
export default function CncfBanner(): JSX.Element {
  const cncfMark = useBaseUrl('/img/cncf/cncf.png');

  return (
    <section className={styles.cncfOuter}>
      <Link
        className={styles.cncfBadge}
        href="https://www.cncf.io/projects/cadence-workflow/"
        target="_blank"
        rel="noopener noreferrer">
        <img
          src={cncfMark}
          alt="Cloud Native Computing Foundation"
          className={styles.cncfMark}
        />
        <span className={styles.cncfText}>
          <strong>Cadence is a CNCF project</strong>
          <span className={styles.cncfSub}>
            Open governance under the Cloud Native Computing Foundation
          </span>
        </span>
      </Link>
    </section>
  );
}
