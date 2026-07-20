import React, {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
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

// Toggle the content-type filter on/off for demos.
const FILTER_MODE: 'off' | 'on' = 'on';

// Trackpad two-finger horizontal swipes arrive as a burst of `wheel` events
// with small deltaX values, not a single gesture event. These tune the
// "snap one page per swipe" feel (rather than continuous scroll-following):
// accumulate deltaX until it crosses WHEEL_PAGE_THRESHOLD, then pause for
// WHEEL_COOLDOWN_MS so the rest of the same physical swipe doesn't trigger
// another page. WHEEL_GESTURE_RESET_MS treats a pause in wheel events as the
// gesture ending, so the next swipe starts its accumulator from zero.
const WHEEL_PAGE_THRESHOLD = 60;
const WHEEL_GESTURE_RESET_MS = 150;
const WHEEL_COOLDOWN_MS = 400;

// Toggle which filter control style renders when FILTER_MODE is 'on'.
const FILTER_STYLE: 'pills' | 'dropdown' | 'segmented' = 'segmented';

// Only offer tags that at least one item actually uses, so a filter button
// never leads to an empty carousel.
const FILTER_OPTIONS: Array<'All' | FeaturedTag> = [
  'All',
  ...FEATURED_TAGS.filter((tag) => items.some((item) => item.tag === tag)),
];

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
  const {withBaseUrl} = useBaseUrlUtils();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const touchX = useRef(0);
  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);
  const [activeTag, setActiveTag] = useState<'All' | FeaturedTag>('All');

  const visibleItems =
    FILTER_MODE === 'on' && activeTag !== 'All'
      ? items.filter((item) => item.tag === activeTag)
      : items;

  const step = Math.max(1, perView - 1);
  const pageCount = Math.max(1, Math.ceil((visibleItems.length - perView) / step) + 1);
  const startIndex = Math.min(page * step, Math.max(0, visibleItems.length - perView));
  const endIndex = startIndex + perView - 1;
  const atStart = page === 0;
  const atEnd = page >= pageCount - 1;

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  const selectTag = (tag: 'All' | FeaturedTag) => {
    setActiveTag(tag);
    setPage(0);
  };

  // "Latest ref" pattern so the native wheel listener below (attached via
  // effect, not JSX) always calls the current goPrev/goNext -- which close
  // over the current pageCount -- without needing to re-attach the listener
  // on every page or filter change.
  const goPrevRef = useRef(goPrev);
  const goNextRef = useRef(goNext);
  goPrevRef.current = goPrev;
  goNextRef.current = goNext;

  // Two-finger trackpad swipes are delivered as `wheel` events (not touch
  // events), so they need their own handler alongside the touch-swipe one
  // below. Attached as a native, non-passive listener (rather than JSX
  // onWheel) so preventDefault() reliably suppresses the browser's own
  // horizontal page scroll / back-forward navigation gesture.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let deltaAcc = 0;
    let cooldown = false;
    let resetTimer: number | null = null;
    let cooldownTimer: number | null = null;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (cooldown) return;

      if (resetTimer !== null) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        deltaAcc = 0;
      }, WHEEL_GESTURE_RESET_MS);

      deltaAcc += e.deltaX;
      if (Math.abs(deltaAcc) >= WHEEL_PAGE_THRESHOLD) {
        if (deltaAcc > 0) goNextRef.current();
        else goPrevRef.current();
        deltaAcc = 0;
        cooldown = true;
        cooldownTimer = window.setTimeout(() => {
          cooldown = false;
        }, WHEEL_COOLDOWN_MS);
      }
    };

    viewport.addEventListener('wheel', onWheel, {passive: false});
    return () => {
      viewport.removeEventListener('wheel', onWheel);
      if (resetTimer !== null) window.clearTimeout(resetTimer);
      if (cooldownTimer !== null) window.clearTimeout(cooldownTimer);
    };
    // visibleItems.length === 0 toggles the viewport's own conditional
    // rendering (see the ternary below), which unmounts/remounts this ref's
    // DOM node -- re-run the effect then to reattach to the new element.
  }, [visibleItems.length === 0]);

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
  // Runs on page/breakpoint changes and on every resize, since the
  // percentage-based slide width (and thus the stride) changes with viewport
  // width even when perView stays the same.
  useEffect(() => {
    const reposition = () => {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return;
      const a = track.children[0] as HTMLElement | undefined;
      const b = track.children[1] as HTMLElement | undefined;
      const stride = a && b ? b.offsetLeft - a.offsetLeft : 0;
      const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
      const offset = Math.min(startIndex * stride, maxOffset);
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };
    reposition();
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [startIndex, perView, visibleItems.length]);

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

        {FILTER_MODE === 'on' && (
          <div className={styles.filterBar} role="group" aria-label="Filter by content type">
            {FILTER_STYLE === 'pills' &&
              FILTER_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={clsx(styles.filterPill, activeTag === tag && styles.filterPillActive)}
                  aria-pressed={activeTag === tag}
                  onClick={() => selectTag(tag)}>
                  {tag}
                </button>
              ))}
            {FILTER_STYLE === 'segmented' && (
              <div className={styles.segmented}>
                {FILTER_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={clsx(styles.segment, activeTag === tag && styles.segmentActive)}
                    aria-pressed={activeTag === tag}
                    onClick={() => selectTag(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {FILTER_STYLE === 'dropdown' && (
              <select
                className={styles.filterDropdown}
                aria-label="Filter by content type"
                value={activeTag}
                onChange={(e) => selectTag(e.target.value as 'All' | FeaturedTag)}>
                {FILTER_OPTIONS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {visibleItems.length === 0 ? (
          <p className={styles.emptyState}>No featured items match this filter yet.</p>
        ) : (
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
            {visibleItems.map((item, i) => {
              const videoId = item.tag === 'Video' ? getYouTubeId(item.href) : null;
              // withBaseUrl no-ops on URLs that already have a protocol (e.g. the
              // YouTube thumbnail), so it's safe to apply to every image here.
              const imgSrc = withBaseUrl(
                videoId
                  ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                  : resolveImage(item),
              );
              const hidden = i < startIndex || i > endIndex;

              return (
                <li
                  className={styles.slide}
                  key={item.href + i}
                  aria-hidden={hidden || undefined}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${visibleItems.length}`}>
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
                                  img.src = withBaseUrl(resolveImage(item));
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
        )}

        {visibleItems.length > 0 && (
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
        )}
      </div>
    </section>
  );
}
