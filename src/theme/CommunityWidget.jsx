import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from '@docusaurus/Link';
import styles from './CommunityWidget.module.css';

const ACTIONS = [
  {
    id: 'meetup',
    label: 'Join the community meetup',
    href: '/community/meetup',
    icon: 'mdi:calendar-star',
  },
  {
    id: 'newsletter',
    label: 'Subscribe to updates',
    href: '/community/meetup#stay-updated-on-cadence',
    icon: 'mdi:email-newsletter',
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
  const [showTooltip, setShowTooltip] = useState(true);
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const wrapperRef = useRef(null);

  // Auto-hide tooltip after 4 s
  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    function handleClickOutside(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className={styles.widget} aria-label="Community actions">
      {open && (
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Community actions menu"
        >
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
            {ACTIONS.map((action) => {
              const isMeetup = action.id === 'meetup';
              const isNewsletter = action.id === 'newsletter';
              const itemClass = isMeetup ? styles.actionItemMeetup : isNewsletter ? styles.actionItemNewsletter : styles.actionItem;
              return action.external ? (
                <li key={action.id}>
                  <a
                    href={action.href}
                    className={itemClass}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon icon={action.icon} className={styles.actionIcon} width={20} />
                    <span>{action.label}</span>
                  </a>
                </li>
              ) : (
                <li key={action.id}>
                  <Link to={action.href} className={itemClass} onClick={() => setOpen(false)}>
                    <Icon icon={action.icon} className={styles.actionIcon} width={20} />
                    <span>{action.label}</span>
                    {isMeetup && <span className={styles.meetupBadge}>Join</span>}
                    {isNewsletter && <span className={styles.newsletterBadge}>New</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div ref={wrapperRef} className={`${styles.fabWrapper} ${open ? styles.fabWrapperOpen : ''}`}>
        {showTooltip && !open && (
          <div className={styles.tooltip} aria-hidden="true">
            <span>Next meetup</span>
          </div>
        )}
        <button
          ref={fabRef}
          className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
          onClick={() => { setOpen((v) => !v); setShowTooltip(false); }}
          aria-label={open ? 'Close community menu' : 'Open community actions'}
          aria-expanded={open}
        >
          <Icon icon={open ? 'mdi:close' : 'mdi:account-group'} width={26} />
        </button>
      </div>
    </div>
  );
}
