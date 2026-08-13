import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function GetInvolvedBanner(): JSX.Element {
  const links = [
    { label: 'Discussions', href: 'https://github.com/cadence-workflow/cadence/discussions' },
    { label: 'Contribute', href: 'https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md' },
    { label: 'Issues', href: 'https://github.com/cadence-workflow/cadence/issues' },
    { label: 'Examples', href: 'https://github.com/cadence-workflow/cadence/tree/master/samples' },
  ];

  return (
    <section className={styles.bannerOuter}>
      <div className={styles.bannerContainer}>
        <h3 className={styles.bannerTitle}>Get involved with our community</h3>
        <div className={styles.buttonsWrapper}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pillButton}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
