import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function CommunityBanner(): JSX.Element {
  return (
    <section className={styles.communityBand}>
      <Link
        href="https://github.com/cadence-workflow/cadence/discussions"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.communityContent}>
        <div className={styles.communityText}>
          <strong className={styles.communityTitle}>Join our open-source community</strong>
          <span className={styles.communitySubtitle}>
            Contribute, learn, and grow with developers building fault-tolerant workflows
          </span>
        </div>
      </Link>
    </section>
  );
}
