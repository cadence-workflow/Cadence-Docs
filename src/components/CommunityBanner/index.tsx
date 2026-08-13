import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function CommunityBanner(): JSX.Element {
  return (
    <section className={styles.communityBand}>
      <div className={styles.communityContent}>
        <div className={styles.communityIcon}>👥</div>

        <div className={styles.communityText}>
          <h2 className={styles.communityTitle}>Learn, contribute, and grow with our community</h2>
          <p className={styles.communitySubtitle}>
            Join developers building fault-tolerant workflows. Share ideas, submit PRs, and grow together.
          </p>

          <div className={styles.communityCtas}>
            <Link
              href="https://github.com/cadence-workflow/cadence"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}>
              Contribute
            </Link>
            <Link
              href="https://github.com/cadence-workflow/cadence/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}>
              Join discussions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
