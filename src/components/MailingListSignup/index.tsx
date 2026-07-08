import React, { useState } from 'react';
import styles from './styles.module.css';

const SUBSCRIBE_EMAIL = 'cncf-cadence-community+subscribe@lists.cncf.io';
const SUBSCRIBE_MAILTO = `mailto:${SUBSCRIBE_EMAIL}`;

type State = 'idle' | 'opened';

interface Props {
  /** HTML id placed on the banner wrapper, enabling deep-link anchors. */
  id?: string;
  /** Headline shown above the CTA. */
  headline?: string;
  /** Supporting copy shown below the headline. */
  tagline?: string;
}

export default function MailingListSignup({
  id,
  headline = 'Stay in the loop',
  tagline = 'Get meetup announcements, release notes, and community updates delivered to your inbox.',
}: Props) {
  const [state, setState] = useState<State>('idle');

  function handleSubscribe() {
    window.open(SUBSCRIBE_MAILTO, '_blank');
    setState('opened');
  }

  if (state === 'opened') {
    return (
      <div className={styles.banner} id={id}>
        <div className={styles.inner}>
          <div className={styles.successIcon} aria-hidden="true">✓</div>
          <p className={styles.successHeadline}>Check your email client</p>
          <p className={styles.successBody}>
            Send the pre-addressed email that just opened. Groups.io will reply
            with a confirmation link — click it to complete your subscription.
          </p>
          <button
            className={styles.buttonSecondary}
            onClick={() => setState('idle')}
          >
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

        <div className={styles.ctaRow}>
          <button
            type="button"
            className={styles.button}
            onClick={handleSubscribe}
          >
            Subscribe via email
          </button>
        </div>

        <p className={styles.privacyNote}>
          Joins the CNCF Cadence Community mailing list. Unsubscribe any time.
        </p>
      </div>
    </div>
  );
}
