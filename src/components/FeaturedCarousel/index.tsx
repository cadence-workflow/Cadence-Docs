import React, {useEffect, useRef, useState} from 'react';
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

// Fully visible items per page, matched to the CSS breakpoints below.
const getPerView = (): number => {
  if (typeof window === 'undefined') return 3;
  if (window.matchMedia('(max-width: 700px)').matches) return 1;
  if (window.matchMedia('(max-width: 996px)').matches) return 2;
  return 3;
};

export default function FeaturedCarousel(): JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const touchX = useRef(0);
  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);

  const step = Math.max(1, perView - 1);
  const pageCount = Math.max(1, Math.ceil((items.length - perView) / step) + 1);
  const startIndex = Math.min(page * step, Math.max(0, items.length - perView));
  const endIndex = startIndex + perView - 1;
  const atStart = page === 0;
  const atEnd = page >= pageCount - 1;

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  // Keep perView in sync with the viewport width (matches the CSS breakpoints).
  useEffect(() => {
    const onResize = () => setPerView(getPerView());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Clamp the page if the page count shrinks (e.g. resize to fewer pages).
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  // Translate the track from the measured item stride, clamped to the end.
  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const a = track.children[0] as HTMLElement | undefined;
    const b = track.children[1] as HTMLElement | undefined;
    const stride = a && b ? b.offsetLeft - a.offsetLeft : 0;
    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
    const offset = Math.min(startIndex * stride, maxOffset);
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  }, [startIndex, perView]);

  return (
    <section className={styles.carousel}>
      <div className="container">
        <div className={styles.header}>
          <Heading as="h2" className={styles.title}>
            Featured reading
          </Heading>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Previous page"
              onClick={goPrev}
              disabled={atStart}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.arrow}
              aria-label="Next page"
              onClick={goNext}
              disabled={atEnd}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={styles.viewport}
          ref={viewportRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Featured articles"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              goNext();
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              goPrev();
            }
          }}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (dx < -40) goNext();
            else if (dx > 40) goPrev();
          }}>
          <ul className={styles.track} ref={trackRef}>
            {items.map((item, i) => {
              const videoId = item.tag === 'Video' ? getYouTubeId(item.href) : null;
              const imgSrc = videoId
                ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                : resolveImage(item);
              const hidden = i < startIndex || i > endIndex;

              return (
                <li
                  className={styles.slide}
                  key={item.href + i}
                  aria-hidden={hidden || undefined}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${items.length}`}>
                  <Link
                    className={clsx('card', styles.card)}
                    to={item.href}
                    tabIndex={hidden ? -1 : undefined}>
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
        </div>

        <div className={styles.dots} role="tablist" aria-label="Choose page">
          {Array.from({length: pageCount}).map((_, p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === page}
              aria-label={`Go to page ${p + 1} of ${pageCount}`}
              className={clsx(styles.dot, p === page && styles.dotActive)}
              onClick={() => setPage(p)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
