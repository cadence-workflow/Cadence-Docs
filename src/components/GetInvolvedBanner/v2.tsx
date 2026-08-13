import React from 'react';
import Link from '@docusaurus/Link';
import styles from './v2.module.css';

export default function GetInvolvedBannerV2(): JSX.Element {
  const links = [
    {
      title: 'Join our discussions',
      desc: 'Ask questions, share ideas, and learn from the community',
      href: 'https://github.com/cadence-workflow/cadence/discussions',
    },
    {
      title: 'Contribute code or docs',
      desc: 'Help improve Cadence with code changes, docs, or examples',
      href: 'https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md',
    },
    {
      title: 'Report issues or request features',
      desc: 'Found a bug? Have a feature idea? Let us know on GitHub',
      href: 'https://github.com/cadence-workflow/cadence/issues',
    },
    {
      title: 'Learn from examples',
      desc: 'Explore real-world examples and sample workflows',
      href: 'https://github.com/cadence-workflow/cadence/tree/master/samples',
    },
  ];

  return (
    <section className={styles.bannerOuter}>
      <div className={styles.bannerContainer}>
        <h3 className={styles.bannerTitle}>Get involved</h3>
        <div className={styles.cardList}>
          {links.map((link) => (
            <Link key={link.title} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.card}>
              <div className={styles.cardContent}>
                <h4 className={styles.cardTitle}>{link.title}</h4>
                <p className={styles.cardDesc}>{link.desc}</p>
              </div>
              <span className={styles.cardArrow}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
