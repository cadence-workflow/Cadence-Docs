import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          {/* <Link className="button button--secondary button--lg" to="docs/get-started">
            Get Started - 5min ⏱️
          </Link> */}

          <Link href="/docs/get-started" className="button button--secondary  button--lg">🔬 Get Started</Link>
          &nbsp;&nbsp;
          {/* <Link href="/docs" className="button button--secondary button--lg">📚 Documentation</Link> */}
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
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
