import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Simplify Stateful Application Development',
    Svg: require('@site/static/img/arrow_divert_filled.svg').default,
    description: (
      <>
        Encode complex business logic, while seamlessly managing scalability, reliability, and availability, freeing developers from these concerns
      </>
    ),
  },
  {
    title: 'Run Resilient Workflows in Any Environment',
    Svg: require('@site/static/img/gears_blue.svg').default,
    description: (
      <>
        Cadence enables writing stateful applications without worrying about the complexity of handling process failures.
      </>
    ),
  },
  {
    title: 'Horizontal Scalability for Massive Workflow Loads',
    Svg: require('@site/static/img/chart_bar_ascending_filled.svg').default,
    description: (
      <>
        Cadence scales horizontally to handle millions of concurrent workflows, and it includes asynchronous history event replication out-of-the-box, providing robust recovery from zone failures
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--12')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

function FeatureHorizontal({ title, Svg, description }: FeatureItem) {
  return (

    <div className="col col--4 margin-top--lg margin-bottom--lg">
      <div className="card card--full-height item shadow--tl">
        <div className="card__header text--center">
          <Heading as="h3">{title}</Heading>
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div className="card__body">
          <div className="text--center text--break padding-horiz--md">
            <p>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <FeatureHorizontal key={idx} {...props} />
          ))}
        </div>

        {/* <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div> */}
      </div>
    </section>
  );
}
