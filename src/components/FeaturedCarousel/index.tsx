import React, {useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import featuredLinks from '@site/src/data/featuredLinks.yaml';
import styles from './styles.module.css';

type FeaturedItem = {
  title: string;
  description: string;
  href: string;
  image: string;
  tag?: string;
  cta?: string;
};

const items = featuredLinks as FeaturedItem[];
const AUTOPLAY_MS = 5000;

export default function FeaturedCarousel(): JSX.Element {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = (index + items.length) % items.length;
    const card = track.children[clamped] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({left: card.offsetLeft - track.offsetLeft, behavior: 'smooth'});
    }
    setActive(clamped);
  }, []);

  useEffect(() => {
    if (paused || items.length <= 1) return undefined;
    const id = window.setInterval(() => scrollToIndex(active + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [active, paused, scrollToIndex]);

  // Keep the active dot in sync when the user scrolls/swipes manually.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let frame = 0;
    const onScroll = () => {
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
    };
  }, []);

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Featured articles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}>
      <div className="container">
        <div className={styles.header}>
          <Heading as="h2" className={styles.title}>
            Featured reading
          </Heading>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Previous"
              onClick={() => scrollToIndex(active - 1)}>
              ‹
            </button>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Next"
              onClick={() => scrollToIndex(active + 1)}>
              ›
            </button>
          </div>
        </div>

        <ul className={styles.track} ref={trackRef}>
          {items.map((item, i) => (
            <li
              className={styles.slide}
              key={item.href + i}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}`}>
              <Link className={clsx('card', styles.card)} to={item.href}>
                <div className={styles.media}>
                  <img src={item.image} alt="" loading="lazy" />
                  {item.tag && <span className={styles.tag}>{item.tag}</span>}
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
          ))}
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
