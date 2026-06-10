import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import styles from './CommunityWidget.module.css';

const ACTIONS = [
  {
    id: 'meetup',
    label: 'Join the community meetup',
    href: '/community/meetup',
    icon: 'mdi:calendar-star',
  },
  {
    id: 'slack',
    label: 'Join us on Slack (CNCF)',
    href: 'https://communityinviter.com/apps/cloud-native/cncf',
    icon: 'mdi:slack',
    external: true,
  },
  {
    id: 'discord',
    label: 'Join us on Discord',
    href: 'https://discord.gg/ynvjm2Et5',
    icon: 'mdi:discord',
    external: true,
  },
  {
    id: 'github',
    label: 'Discuss on GitHub',
    href: 'https://github.com/cadence-workflow/cadence/discussions',
    icon: 'mdi:github',
    external: true,
  },
  {
    id: 'contact',
    label: 'Contact the team',
    href: '/community/contact-us',
    icon: 'mdi:email-outline',
  },
];

export default function CommunityWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.widget} aria-label="Community actions">
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Community actions menu">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Join the Cadence community</span>
            <button
              className={styles.closeButton}
              onClick={() => setOpen(false)}
              aria-label="Close community menu"
            >
              <Icon icon="mdi:close" width={16} />
            </button>
          </div>
          <ul className={styles.actionList}>
            {ACTIONS.map((action) => (
              <li key={action.id}>
                <a
                  href={action.href}
                  className={styles.actionItem}
                  target={action.external ? '_blank' : undefined}
                  rel={action.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon icon={action.icon} className={styles.actionIcon} width={20} />
                  <span>{action.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close community menu' : 'Open community actions'}
        aria-expanded={open}
      >
        <Icon icon={open ? 'mdi:close' : 'mdi:account-group'} width={26} />
      </button>
    </div>
  );
}
