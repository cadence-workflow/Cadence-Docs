import React, { useState, useRef, useEffect } from 'react';
import styles from './styles.module.css';

const JOIN_BASE = 'https://lists.cncf.io/g/cncf-cadence-community/join';

type State = 'idle' | 'opened' | 'blocked';

interface Props {
  id?: string;
  headline?: string;
  tagline?: string;
}

export default function MailingListSignup({
  id,
  headline = 'Stay in the loop',
  tagline = 'Get meetup announcements, release notes, and community updates delivered to your inbox.',
}: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    const url = `${JOIN_BASE}?email=${encodeURIComponent(email)}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      setState('opened');
    } else {
      // Popup was blocked — show a direct link instead of the confirmation view
      setState('blocked');
    }
  }

  if (state === 'blocked') {
    const url = `${JOIN_BASE}?email=${encodeURIComponent(email)}`;
    return (
      <div className={styles.banner} id={id}>
        <div className={styles.inner}>
          <div className={styles.successIcon} aria-hidden="true">🚫</div>
          <p className={styles.successHeadline}>Popup blocked</p>
          <p className={styles.successBody}>
            Your browser blocked the new tab. Click the link below to open the groups.io page
            {email ? <> with <strong className={styles.emailHighlight}>{email}</strong> pre-filled</> : ''}.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.button}
            style={{ display: 'inline-flex', textDecoration: 'none', marginTop: '0.75rem' }}
          >
            Open groups.io ↗
          </a>
          <button className={styles.buttonSecondary} onClick={() => setState('idle')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (state === 'opened') {
    return (
      <div className={styles.banner} id={id}>
        <div className={styles.inner}>
          <div className={styles.successIcon} aria-hidden="true">✅</div>
          <p className={styles.successHeadline}>One more click</p>
          <p className={styles.successBody}>
            The CNCF groups.io page just opened with{' '}
            {email ? <strong className={styles.emailHighlight}>{email}</strong> : 'your email'}{' '}
            pre-filled. Click <strong>"Confirm Email Address"</strong> there and you're done —
            groups.io will send you a confirmation.
          </p>
          <a
            href={`${JOIN_BASE}?email=${encodeURIComponent(email)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.button}
            style={{ display: 'inline-flex', textDecoration: 'none', marginTop: '0.75rem' }}
          >
            Open again ↗
          </a>
          <button className={styles.buttonSecondary} onClick={() => { setEmail(''); setState('idle'); }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.banner} id={id}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>{headline}</h2>
        <p className={styles.tagline}>{tagline}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputRow}>
            <label htmlFor="mailing-list-email" className={styles.srOnly}>
              Email address
            </label>
            <input
              ref={inputRef}
              id="mailing-list-email"
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.button} disabled={!email}>
              Subscribe →
            </button>
          </div>
        </form>

        <p className={styles.privacyNote}>
          Joins the CNCF Cadence Community mailing list. Unsubscribe any time.
        </p>
      </div>
    </div>
  );
}
