import React, { type ReactNode } from "react";
import styles from "./essay.module.css";

export function Essay({ children }: { children: ReactNode }) {
  return <div className={styles.essay}>{children}</div>;
}

// The lead paragraph under the standard post header.
export function Standfirst({ children }: { children: ReactNode }) {
  return <p className={styles.standfirst}>{children}</p>;
}

interface FigureProps {
  title: string;
  subtitle?: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
}

export function Figure({ title, subtitle, caption, children }: FigureProps) {
  return (
    <figure className={styles.figure}>
      <div className={styles.figureTitle}>{title}</div>
      {subtitle && <p className={styles.figureSubtitle}>{subtitle}</p>}
      {children}
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className={styles.stats}>{children}</div>;
}

interface StatProps {
  value: string;
  label: string;
  detail?: string;
}

export function Stat({ value, label, detail }: StatProps) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {detail && <div className={styles.statDetail}>{detail}</div>}
    </div>
  );
}

// Shown on the blog index above the truncate marker. On the post itself the essay
// renders its own hero, so the excerpt hides.
export function Excerpt({ children }: { children: ReactNode }) {
  return <div className={styles.excerpt}>{children}</div>;
}
