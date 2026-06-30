import React, {useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import featuredLinks from '@site/src/data/featuredLinks.yaml';
import {
  FEATURED_TAGS,
  TAG_DEFAULT_IMAGE,
  FALLBACK_IMAGE,
  type FeaturedTag,
} from '@site/src/data/featuredTags';
import styles from './styles.module.css';

type FeaturedItem = {
  title: string;
  description: string;
  href: string;
  image?: string;
  tag: FeaturedTag;
  cta?: string;
};

const items = featuredLinks as FeaturedItem[];
const AUTOPLAY_MS = 5000;

items.forEach((item, i) => {
  if (!FEATURED_TAGS.includes(item.tag as FeaturedTag)) {
    throw new Error(
      `featuredLinks.yaml item ${i + 1} ("${item.title}") has invalid tag "${item.tag}". ` +
        `Allowed tags: ${FEATURED_TAGS.join(', ')}.`,
    );
  }
});

const resolveImage = (item: FeaturedItem) =>
  item.image ?? TAG_DEFAULT_IMAGE[item.tag] ?? FALLBACK_IMAGE;

const getYouTubeId = (url: string): string | null => {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
};

export default function FeaturedCarousel(): JSX.Element {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const autoplayPaused = hovered || manualPaused;
  // While a button-driven scroll animates, ignore the scroll listener so it
  // can't overwrite `active` with an intermediate/snapped index.
  const programmaticScroll = useRef(false);
  const programmaticTimer = useRef(0);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = (index + items.length) % items.length;
    const card = track.children[clamped] as HTMLElement | undefined;
    if (card) {
      // Center the card to match the CSS `scroll-snap-align: center` snap point.
      const target =
        card.offsetLeft -
        track.offsetLeft -
        (track.clientWidth - card.clientWidth) / 2;
      programmaticScroll.current = true;
      window.clearTimeout(programmaticTimer.current);
      programmaticTimer.current = window.setTimeout(() => {
        programmaticScroll.current = false;
      }, 600);
      track.scrollTo({left: target, behavior: 'smooth'});
    }
    setActive(clamped);
  }, []);

  useEffect(() => {
    if (autoplayPaused || items.length <= 1) return undefined;
    const id = window.setInterval(() => scrollToIndex(active + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [active, autoplayPaused, scrollToIndex]);

  // Keep the active dot in sync when the user scrolls/swipes manually.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let frame = 0;
    const onScroll = () => {
      if (programmaticScroll.current) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const children = Array.from(track.children) as HTMLElement[];
        const center = track.scrollLeft + track.clientWidth / 2;
        let nearest = 0;
        let best = Infinity;
        children.forEach((child, i) => {
          const cardCenter =
            child.offsetLeft - track.offsetLeft + child.clientWidth / 2;
          const dist = Math.abs(cardCenter - center);
          if (dist < best) {
            best = dist;
            nearest = i;
          }
        });
        setActive(nearest);
      });
    };
    track.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      track.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(programmaticTimer.current);
    };
  }, []);

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Featured articles"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}>
      <div className="container">
        <div className={styles.header}>
          <Heading as="h2" className={styles.title}>
            Featured reading
          </Heading>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrow}
              aria-label={manualPaused ? 'Resume autoplay' : 'Pause autoplay'}
              aria-pressed={manualPaused}
              onClick={() => setManualPaused((p) => !p)}>
              {manualPaused ? (
                <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Previous"
              onClick={() => scrollToIndex(active - 1)}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Next"
              onClick={() => scrollToIndex(active + 1)}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <ul className={styles.track} ref={trackRef}>
          {items.map((item, i) => {
            const videoId = item.tag === 'Video' ? getYouTubeId(item.href) : null;
            const imgSrc = videoId
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              : resolveImage(item);

            return (
              <li
                className={styles.slide}
                key={item.href + i}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${items.length}`}>
                <Link className={clsx('card', styles.card)} to={item.href}>
                  <div className={styles.media}>
                    <img
                      src={imgSrc}
                      alt=""
                      loading="lazy"
                      onError={
                        videoId
                          ? (e) => {
                              const img = e.currentTarget;
                              if (!img.dataset.fallback) {
                                img.dataset.fallback = '1';
                                img.src = resolveImage(item);
                              }
                            }
                          : undefined
                      }
                    />
                    {item.tag && <span className={styles.tag} data-tag={item.tag}>{item.tag}</span>}
                  </div>
                  <div className={styles.body}>
                    <Heading as="h3" className={styles.cardTitle}>
                      {item.title}
                    </Heading>
                    <p className={styles.desc}>{item.description}</p>
                    <span className={styles.cta}>{item.cta ?? 'Read more'} →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.dots} role="tablist" aria-label="Choose slide">
          {items.map((item, i) => (
            <button
              key={item.href + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              className={clsx(styles.dot, i === active && styles.dotActive)}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
