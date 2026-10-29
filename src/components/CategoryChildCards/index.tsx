import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import {
  useDocsSidebar,
  findFirstSidebarItemLink,
  filterDocCardListItems,
} from '@docusaurus/plugin-content-docs/client';
import {isSamePath} from '@docusaurus/theme-common/internal';
import type {
  PropSidebarItem,
  PropSidebarItemCategory,
} from '@docusaurus/plugin-content-docs';
import styles from './styles.module.css';

/**
 * Finds the deepest sidebar category whose href matches pathname (category
 * landing). Returns null for leaf docs inside a category.
 */
function findLandingCategory(
  items: PropSidebarItem[],
  pathname: string,
): PropSidebarItemCategory | null {
  for (const item of items) {
    if (item.type !== 'category') {
      continue;
    }
    if (isSamePath(item.href, pathname)) {
      return item;
    }
    const nested = findLandingCategory(item.items, pathname);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function isCurrentPageItem(item: PropSidebarItem, pathname: string): boolean {
  if (item.type === 'link' || item.type === 'category') {
    return isSamePath(item.href, pathname);
  }
  return false;
}

function getItemHref(item: PropSidebarItem): string | undefined {
  if (item.type === 'link') {
    return item.href;
  }
  if (item.type === 'category') {
    return findFirstSidebarItemLink(item);
  }
  return undefined;
}

function getItemLabel(item: PropSidebarItem): string | undefined {
  if (item.type === 'link' || item.type === 'category') {
    return item.label;
  }
  return undefined;
}

/**
 * On category landing docs (e.g. /docs/tech-review), renders a compact list of
 * child links when the left sidebar is hidden (viewport max-width 996px).
 * Placed under the prev/next paginator.
 */
export default function CategoryChildCards(): ReactNode {
  const {pathname} = useLocation();
  const sidebar = useDocsSidebar();
  if (!sidebar?.items?.length) {
    return null;
  }

  const category = findLandingCategory(sidebar.items, pathname);
  if (!category) {
    return null;
  }

  const items = filterDocCardListItems(
    category.items.filter((item) => !isCurrentPageItem(item, pathname)),
  );
  if (!items.length) {
    return null;
  }

  return (
    <nav className={styles.container} aria-label="Content under this section">
      <p className={styles.title}>Content under this section</p>
      <ul className={styles.list}>
        {items.map((item) => {
          const href = getItemHref(item);
          const label = getItemLabel(item);
          if (!href || !label) {
            return null;
          }
          return (
            <li key={`${href}-${label}`}>
              <Link to={href}>{label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
