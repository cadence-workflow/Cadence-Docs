import React, { useState } from 'react';
import styles from './styles.module.css';

/**
 * Formspree form ID.
 * To activate: go to https://formspree.io, create a form named
 * "Cadence Community Mailing List", and replace this placeholder with
 * your form ID (e.g. "xpwdkrqb").
 */
const FORMSPREE_FORM_ID = 'xojooqjk';

type State = 'idle' | 'submitting' | 'success' | 'error';

interface Props {
  /** HTML id placed on the banner wrapper, enabling deep-link anchors. */
  id?: string;
  /** Headline shown above the input row. */
  headline?: string;
  /** Supporting copy shown below the headline. */
  tagline?: string;
}

export default function MailingListSignup({
  id,
  headline = 'Stay in the loop',
  tagline = 'Get meetup announcements, release notes, and community updates delivered to your inbox.',
}: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    if (!e.currentTarget.checkValidity()) {
      setErrorMsg('Please enter a valid email address.');
      setState('error');
      return;
    }

    setState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setState('success');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          (data as { error?: string }).error ||
            'Something went wrong. Please try again.',
        );
        setState('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className={styles.banner} id={id}>
        <div className={styles.inner}>
          <div className={styles.successIcon} aria-hidden="true">✓</div>
          <p className={styles.successHeadline}>You&apos;re on the list!</p>
          <p className={styles.successBody}>
            We&apos;ll send you meetup announcements and community updates.
            See you at the next session.
          </p>
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
              id="mailing-list-email"
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={state === 'submitting'}
              aria-describedby={state === 'error' ? 'mailing-list-error' : undefined}
            />
            <button
              type="submit"
              className={styles.button}
              disabled={state === 'submitting' || !email}
            >
              {state === 'submitting' ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : null}
              {state === 'submitting' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </div>

          {state === 'error' && (
            <p id="mailing-list-error" className={styles.errorMsg} role="alert">
              {errorMsg}
            </p>
          )}
        </form>

        <p className={styles.privacyNote}>
          No spam. Unsubscribe any time.
        </p>
      </div>
    </div>
  );
}
