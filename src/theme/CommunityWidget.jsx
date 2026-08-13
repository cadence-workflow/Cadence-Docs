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
  const [scrolled, setScrolled] = useState(false);
  const [anchorPos, setAnchorPos] = useState(null);
  const panelRef = useRef(null);
  const fabRef = useRef(null);

  // Anchor the widget to the "See Examples" column of the Get Involved header
  // on page load, then transition to the standard bottom-right corner once the
  // user scrolls. Measure the anchor's viewport position rather than relying on
  // a fixed offset — the hero height and any layout tweaks stay decoupled from
  // the widget's initial home.
  useEffect(() => {
    function measureAnchor() {
      const el = typeof document !== 'undefined'
        ? document.getElementById('community-widget-anchor')
        : null;
      if (!el) {
        setAnchorPos(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setAnchorPos({
        top: rect.top + rect.height / 2,
        right: window.innerWidth - rect.right,
      });
    }
    function handleScroll() {
      setScrolled(window.scrollY > 120);
    }
    measureAnchor();
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measureAnchor);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measureAnchor);
    };
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
        fabRef.current &&
        !fabRef.current.contains(e.target)
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
    <div
      className={`${styles.widget} ${scrolled || !anchorPos ? styles.widgetScrolled : ''}`}
      style={
        !scrolled && anchorPos
          ? {
              top: `${anchorPos.top}px`,
              right: `${anchorPos.right}px`,
              bottom: 'auto',
              transform: 'translateY(-50%)',
            }
          : undefined
      }
      aria-label="Community actions">
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
            {ACTIONS.map((action) =>
              action.external ? (
                <li key={action.id}>
                  <a
                    href={action.href}
                    className={styles.actionItem}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon icon={action.icon} className={styles.actionIcon} width={20} />
                    <span>{action.label}</span>
                  </a>
                </li>
              ) : (
                <li key={action.id}>
                  <Link to={action.href} className={styles.actionItem} onClick={() => setOpen(false)}>
                    <Icon icon={action.icon} className={styles.actionIcon} width={20} />
                    <span>{action.label}</span>
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      )}
      <button
        ref={fabRef}
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
