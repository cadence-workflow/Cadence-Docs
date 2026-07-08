import React, { useState, useRef, useEffect } from 'react';
import styles from './styles.module.css';

const SUBSCRIBE_EMAIL = 'cncf-cadence-community+subscribe@lists.cncf.io';

type State = 'idle' | 'opened';

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
    window.open(`mailto:${SUBSCRIBE_EMAIL}`, '_blank');
    setState('opened');
  }

  if (state === 'opened') {
    return (
      <div className={styles.banner} id={id}>
        <div className={styles.inner}>
          <div className={styles.successIcon} aria-hidden="true">✉</div>
          <p className={styles.successHeadline}>Check your email client</p>
          <p className={styles.successBody}>
            Send the pre-addressed email that just opened
            {email ? <> from <strong className={styles.emailHighlight}>{email}</strong></> : ''}.
            Groups.io will send a confirmation link — click it to complete your subscription.
          </p>
          <button className={styles.buttonSecondary} onClick={() => setState('idle')}>
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
              Subscribe
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
