import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

interface CardItem {
  label: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  badge: string;
  badgeType: 'discussion' | 'contribute' | 'issues' | 'examples';
}

const DiscussionIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CodeIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const IssueIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const FolderIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export default function GetInvolvedBanner(): JSX.Element {
  const cards: CardItem[] = [
    {
      label: 'Discussions',
      title: 'Join Discussions',
      description: 'Ask questions, share ideas, and learn from the community',
      href: 'https://github.com/cadence-workflow/cadence/discussions',
      icon: 'discussion',
      badge: 'Discussion',
      badgeType: 'discussion',
    },
    {
      label: 'Contributing',
      title: 'Contribute Code',
      description: 'Help build Cadence. Submit PRs, fix bugs, improve features',
      href: 'https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md',
      icon: 'code',
      badge: 'Contribute',
      badgeType: 'contribute',
    },
    {
      label: 'Issues',
      title: 'Report Issues',
      description: 'Found a bug? Have a feature request? Let us know',
      href: 'https://github.com/cadence-workflow/cadence/issues',
      icon: 'issue',
      badge: 'Report',
      badgeType: 'issues',
    },
    {
      label: 'Examples',
      title: 'See Examples',
      description: 'Explore real-world examples and learn best practices',
      href: 'https://github.com/cadence-workflow/cadence-samples',
      icon: 'folder',
      badge: 'Learn',
      badgeType: 'examples',
    },
  ];

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'discussion':
        return <DiscussionIcon />;
      case 'code':
        return <CodeIcon />;
      case 'issue':
        return <IssueIcon />;
      case 'folder':
        return <FolderIcon />;
      default:
        return null;
    }
  };

  return (
    <section className={styles.bannerOuter}>
      <div className={styles.bannerHeader}>
        <div className={styles.bannerTitleWrap}>
          <Heading as="h2" className={clsx('homepage-section-heading', styles.bannerTitle)}>
            Get involved!
          </Heading>
          <p className={styles.bannerSubtitle}>Join our open-source community</p>
        </div>
        <span className={styles.communityLinksPill}>
          <Link href="https://communityinviter.com/apps/cloud-native/cncf" target="_blank" rel="noopener noreferrer" className={styles.communityLink}>
            Join us on Slack
          </Link>
        </span>
      </div>
      <div className={styles.cardsWrapper}>
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card} ${styles[`card--${card.badgeType}`]}`}
          >
            <div className={styles.icon}>{getIcon(card.icon)}</div>
            <Heading as="h3" className={styles.cardTitle}>
              {card.title}
            </Heading>
            <p className={styles.cardDesc}>{card.description}</p>
            <div className={styles.arrow}>→</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
