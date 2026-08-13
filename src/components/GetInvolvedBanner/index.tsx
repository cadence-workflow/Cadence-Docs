import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface CardItem {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge: string;
  badgeType: 'discussion' | 'contribute' | 'issues' | 'examples';
}

const DiscussionIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CodeIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const IssueIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const FolderIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export default function GetInvolvedBanner(): JSX.Element {
  const cards: CardItem[] = [
    {
      label: 'Discussions',
      description: 'Join conversations with the community. Ask questions, share ideas, and learn from others using Cadence.',
      href: 'https://github.com/cadence-workflow/cadence/discussions',
      icon: <DiscussionIcon />,
      badge: 'Discussion',
      badgeType: 'discussion',
    },
    {
      label: 'Contributing',
      description: 'Help build Cadence. Submit PRs, fix bugs, and improve features. Every contribution makes Cadence stronger.',
      href: 'https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md',
      icon: <CodeIcon />,
      badge: 'Contribute',
      badgeType: 'contribute',
    },
    {
      label: 'Issues',
      description: 'Found a bug or have a feature request? Open an issue to help us improve and prioritize development.',
      href: 'https://github.com/cadence-workflow/cadence/issues',
      icon: <IssueIcon />,
      badge: 'Report',
      badgeType: 'issues',
    },
    {
      label: 'Examples',
      description: 'Explore real-world examples and use cases. Learn best practices and see how others use Cadence.',
      href: 'https://github.com/cadence-workflow/cadence/tree/master/samples',
      icon: <FolderIcon />,
      badge: 'Learn',
      badgeType: 'examples',
    },
  ];

  return (
    <section className={styles.bannerOuter}>
      <div className={styles.bannerContent}>
        <div className={styles.headerSection}>
          <h2 className={styles.bannerTitle}>Get involved</h2>
          <p className={styles.bannerSubtitle}>Join our open-source community</p>
        </div>

        <div className={styles.gridLinks}>
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.gridCard} ${styles[`card${card.badgeType}`]}`}
            >
              <div className={`${styles.cardBadge} ${styles[`badge${card.badgeType}`]}`}>
                {card.badge}
              </div>
              <div className={styles.cardIcon}>{card.icon}</div>
              <h3 className={styles.cardTitle}>{card.label}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
              <div className={styles.cardArrow}>→</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
