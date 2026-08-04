import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import FeaturedCarousel from '@site/src/components/FeaturedCarousel';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner, styles.heroCompact)}>
      <div className="container">
        <Heading as="h1" className={clsx('hero__title', styles.heroCompactTitle)}>
          {siteConfig.title}
        </Heading>
        <p className={clsx('hero__subtitle', styles.heroCompactSubtitle)}>{siteConfig.tagline}</p>
        <div className={styles.heroCtas}>
          <Link href="/docs/get-started" className={clsx('button button--sm', styles.heroCtaPrimary)}>
            Get started in 5 min
          </Link>
          <Link href="/faq/cadence-vs-temporal" className={clsx('button button--sm', styles.heroCtaSecondary)}>
            Cadence vs Temporal
          </Link>
          <Link href="/faq/cadence-faq" className={styles.heroCtaTertiary}>
            What is Cadence? →
          </Link>
        </div>
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
        <FeaturedCarousel />
      </main>
    </Layout>
  );
}
