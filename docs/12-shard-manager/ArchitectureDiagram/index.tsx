import React from 'react';
import { ThemedComponent } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

// The diagram is an image file rather than inline SVG, so search engines index
// it. Each theme has its own file. They live in static/ because Docusaurus
// turns an imported SVG back into inline SVG.
const LIGHT_PATH = '/img/shard-manager-architecture.svg';
const DARK_PATH = '/img/shard-manager-architecture-dark.svg';
// The diagram's drawn size, so the page reserves its space before it loads.
const SIZE = { width: 720, height: 452 };
const ALT =
  'Diagram of the Shard Manager architecture. Executors and spectators in your application talk only to Shard Manager. Shard Manager keeps all state in etcd, and one instance is elected leader per namespace. Requests from a spectator go directly to the executor that owns the shard, not through Shard Manager.';

export default function ArchitectureDiagram({
  compact = false,
}: {
  compact?: boolean;
}): React.ReactElement {
  const images = { light: useBaseUrl(LIGHT_PATH), dark: useBaseUrl(DARK_PATH) };
  const diagramClassName = compact
    ? `${styles.diagram} ${styles.compact}`
    : styles.diagram;
  return (
    <figure className={styles.figure}>
      <div className={diagramClassName}>
        <ThemedComponent className={styles.image}>
          {({ theme, className }) => (
            <img src={images[theme]} alt={ALT} {...SIZE} className={className} />
          )}
        </ThemedComponent>
      </div>
      <figcaption className={styles.caption}>
        The Shard Manager architecture, the manager, its etcd store, and a
        sharded application running both executors and a spectator.
        One Shard Manager instance is elected leader per namespace.
      </figcaption>
    </figure>
  );
}
