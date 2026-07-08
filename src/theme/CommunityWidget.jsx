import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from '@docusaurus/Link';
import styles from './CommunityWidget.module.css';

const JOIN_URL = 'https://lists.cncf.io/g/cncf-cadence-community/join';

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
    icon: 'mdi:email-newsletter',
  },
  {
    id: 'discord',
    label: 'Discord',
    href: 'https://discord.gg/ynvjm2Et5',
    icon: 'mdi:discord',
    external: true,
    secondary: true,
  },
  {
    id: 'slack',
    label: 'Slack',
    href: 'https://communityinviter.com/apps/cloud-native/cncf',
    icon: 'mdi:slack',
    external: true,
    secondary: true,
  },
  {
    id: 'github',
    label: 'GitHub',
    href: 'https://github.com/cadence-workflow/cadence/discussions',
    icon: 'mdi:github',
    external: true,
    secondary: true,
  },
];

export default function CommunityWidget() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const wrapperRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (emailOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [emailOpen]);

  useEffect(() => {
    if (!open) {
      setEmailOpen(false);
      setSubmitted(false);
      setEmail('');
    }
  }, [open]);

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

  function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email) return;
    window.open(`${JOIN_URL}?email=${encodeURIComponent(email)}`, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  }

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

              if (isNewsletter) {
                return (
                  <li key={action.id}>
                    <button
                      className={`${styles.actionItemNewsletter} ${styles.actionItemNewsletterBtn}`}
                      onClick={() => { setEmailOpen((v) => !v); setSubmitted(false); }}
                      aria-expanded={emailOpen}
                    >
                      <Icon icon={action.icon} className={styles.actionIcon} width={20} />
                      <span>{action.label}</span>
                      <span className={styles.newsletterBadge}>New</span>
                    </button>
                    {emailOpen && (
                      <div className={styles.emailDrawer}>
                        {submitted ? (
                          <p className={styles.emailConfirm}>
                            ✅ Tab opened — click <strong>Confirm Email Address</strong> to finish.
                          </p>
                        ) : (
                          <form onSubmit={handleEmailSubmit} className={styles.emailForm}>
                            <input
                              ref={emailInputRef}
                              type="email"
                              required
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={styles.emailInput}
                              aria-label="Email address"
                            />
                            <button
                              type="submit"
                              className={styles.emailSubmit}
                              disabled={!email}
                              aria-label="Subscribe"
                            >
                              <Icon icon="mdi:arrow-right" width={18} />
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </li>
                );
              }

              const itemClass = isMeetup ? styles.actionItemMeetup : styles.actionItem;

              return action.external ? (
                <li key={action.id}>
                  <a href={action.href} className={`${itemClass} ${action.secondary ? styles.actionItemSecondary : ''}`} target="_blank" rel="noopener noreferrer">
                    <Icon icon={action.icon} className={styles.actionIcon} width={action.secondary ? 18 : 20} />
                    <span>{action.label}</span>
                  </a>
                </li>
              ) : (
                <li key={action.id}>
                  <Link to={action.href} className={itemClass} onClick={() => setOpen(false)}>
                    <Icon icon={action.icon} className={styles.actionIcon} width={20} />
                    <span>{action.label}</span>
                    {isMeetup && <span className={styles.meetupBadge}>New</span>}
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
