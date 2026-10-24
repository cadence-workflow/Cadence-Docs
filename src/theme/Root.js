import React, { useEffect } from 'react';
import CommunityWidget from './CommunityWidget';

export default function Root({ children }) {
  useEffect(() => {
    const sendHomepageCta = (cta) => {
      if (!(cta instanceof HTMLElement)) return;

      const {
        homepageCtaId: ctaId,
        homepageCtaText: ctaText,
        homepageCtaDestination: destination,
      } = cta.dataset;
      if (!ctaId || !ctaText || !destination) return;

      window.gtag?.('event', 'homepage_cta_click', {
        cta_id: ctaId,
        cta_text: ctaText,
        destination,
      });
    };

    const trackHomepageCtaClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const cta = target.closest('[data-homepage-cta-id]');
      if (cta instanceof HTMLFormElement) return;
      sendHomepageCta(cta);
    };

    const trackHomepageCtaSubmit = (event) => {
      const form = event.target;
      if (
        form instanceof HTMLFormElement &&
        form.matches('[data-homepage-cta-id]')
      ) {
        sendHomepageCta(form);
      }
    };

    document.addEventListener('click', trackHomepageCtaClick);
    document.addEventListener('submit', trackHomepageCtaSubmit);
    return () => {
      document.removeEventListener('click', trackHomepageCtaClick);
      document.removeEventListener('submit', trackHomepageCtaSubmit);
    };
  }, []);

  return (
    <>
      {children}
      <CommunityWidget />
    </>
  );
}
