import React from 'react';
import Link from '@docusaurus/Link';
import styles from './v3.module.css';

export default function GetInvolvedBannerV3(): JSX.Element {
  return (
    <section className={styles.bannerOuter}>
      <Link
        href="https://github.com/cadence-workflow/cadence/discussions"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.pillBanner}>
        <div className={styles.pillText}>
          <strong>Get involved</strong>
          <span>Join discussions, contribute code, report issues, learn from examples</span>
        </div>
        <div className={styles.pillLinks}>
          <a href="https://github.com/cadence-workflow/cadence/discussions" target="_blank" rel="noopener noreferrer" className={styles.pillLink} onClick={(e) => e.stopPropagation()}>
            Discussions
          </a>
          <a href="https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className={styles.pillLink} onClick={(e) => e.stopPropagation()}>
            Contribute
          </a>
          <a href="https://github.com/cadence-workflow/cadence/issues" target="_blank" rel="noopener noreferrer" className={styles.pillLink} onClick={(e) => e.stopPropagation()}>
            Issues
          </a>
        </div>
      </Link>
    </section>
  );
}
