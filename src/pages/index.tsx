import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import GetInvolvedBanner from '@site/src/components/GetInvolvedBanner';
import CncfBanner from '@site/src/components/CncfBanner';
import FeaturedCarousel from '@site/src/components/FeaturedCarousel';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import { Highlight, themes } from 'prism-react-renderer';

import styles from './index.module.css';

const GITHUB_REPO_URL = 'https://github.com/cadence-workflow/cadence';
const ADOPTERS_URL = `${GITHUB_REPO_URL}/blob/master/ADOPTERS.md`;

// Condensed from the SubscriptionWorkflow in docs/03-concepts/12-workflow-engine.md.
// Lines are held under ~64 columns so the snippet fits the hero's half-width
// column without horizontal scrolling on desktop.
const HERO_SNIPPET = `func SubscriptionWorkflow(ctx workflow.Context, id string) error {
	ctx = workflow.WithActivityOptions(ctx, opts)

	// Cadence retries this activity for you.
	err := workflow.ExecuteActivity(ctx, Charge, id).Get(ctx, nil)
	if err != nil {
		return err
	}

	// Durable sleep: survives worker restarts.
	workflow.Sleep(ctx, 30*24*time.Hour)
	return workflow.ExecuteActivity(ctx, Renew, id).Get(ctx, nil)
}`;

// Inlined rather than pulled from @iconify/react: that library fetches icon
// data at runtime, which leaves an empty placeholder in the SSR'd hero.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

// prism-react-renderer instead of @theme/CodeBlock: CodeBlock picks its token
// colors from the site color mode, which would render light tokens inside this
// permanently dark panel. Pinning a dark theme keeps the panel identical in
// both color modes.
function HeroCodePreview() {
  return (
    <div className={styles.heroCode}>
      <Highlight theme={themes.nightOwl} code={HERO_SNIPPET} language="go">
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={clsx(className, styles.heroCodePre)}
            style={{ ...style, background: 'transparent' }}>
            <code>
              {tokens.map((line, lineIndex) => (
                <span
                  key={lineIndex}
                  {...getLineProps({ line, className: styles.heroCodeLine })}>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function HomepageHeader() {
  // Brand gear used as a faint watermark spanning the whole hero. useBaseUrl
  // keeps the path correct under a project baseUrl (e.g. /Cadence-Docs/).
  const gearMark = useBaseUrl('/img/logo/icon/color/cadence-icon-color.svg');

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner, styles.heroCompact)}>
      <img src={gearMark} alt="" aria-hidden="true" className={styles.heroMark} />
      <div className={clsx('container', styles.heroInner)}>
        <div className={styles.heroCopy}>
          {/* CNCF credibility pill anchored to the top of the column. */}
          <div className={styles.heroCncf}>
            <CncfBanner />
          </div>
          {/* Everything from the star count down is pushed to the bottom of the
              column (margin-top: auto) so the CTA row's baseline aligns with the
              bottom of the code panel on the right, and a generous gap opens up
              between the CNCF pill and this block. */}
          <div className={styles.heroCopyMain}>
            <span className={styles.heroEyebrow}>
              <GitHubMark className={styles.heroEyebrowIcon} />
              9k+ Stars on GitHub
              <span aria-hidden="true" className={styles.heroEyebrowSep}>
                •
              </span>
              <Link
                href={ADOPTERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroEyebrowLink}>
                See Adopters
              </Link>
            </span>
            {/* The navbar already carries the Cadence wordmark, so the hero leads
                with the value proposition instead of repeating the brand name. */}
            <Heading as="h1" className={clsx('hero__title', styles.heroCompactTitle)}>
              Orchestrate with Confidence
            </Heading>
            <p className={clsx('hero__subtitle', styles.heroCompactSubtitle)}>
              Write fault-tolerant, stateful background workflows as code in Go, Java and Python
              without worrying about retries, queues, or state persistence.
            </p>
            <div className={styles.heroCtas}>
              <Link to="/docs/get-started" className={clsx('button button--sm', styles.heroCtaPrimary)}>
                Get Started in 5 min
              </Link>
              <Link
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx('button button--sm', styles.heroCtaSecondary)}>
                <GitHubMark className={styles.heroCtaIcon} />
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
        <HeroCodePreview />
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Cadence is an open-source workflow orchestration engine that simplifies building scalable, reliable, and resilient distributed applications. Explore our platform for advanced workflow management, comprehensive documentation, and community-driven support.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <FeaturedCarousel />
        <GetInvolvedBanner />
      </main>
    </Layout>
  );
}
