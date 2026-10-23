import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

type SidebarItem = {
  type?: string;
  id?: string;
  label?: string;
  link?: unknown;
  items?: SidebarItem[];
  [key: string]: unknown;
};

export type CategoryLinkOptions = {
  /** Slugs (e.g. `/about`) that must not get a generated-index page. */
  skipSlugs?: string[];
};

function collectDocIds(items: readonly SidebarItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.type === 'doc' || item.type === 'ref') {
      if (item.id) {
        ids.push(item.id);
      }
    } else if (item.type === 'category' && item.items) {
      ids.push(...collectDocIds(item.items));
    }
  }
  return ids;
}

/** Longest common directory prefix of doc ids (excluding the filename segment). */
function commonDir(ids: string[]): string | null {
  if (!ids.length) {
    return null;
  }
  const dirs = ids.map((id) => {
    const parts = id.split('/');
    return parts.length <= 1 ? '' : parts.slice(0, -1).join('/');
  });
  let prefixParts = dirs[0]!.split('/').filter(Boolean);
  for (const dir of dirs.slice(1)) {
    const parts = dir.split('/').filter(Boolean);
    let i = 0;
    while (
      i < prefixParts.length &&
      i < parts.length &&
      prefixParts[i] === parts[i]
    ) {
      i += 1;
    }
    prefixParts = prefixParts.slice(0, i);
  }
  return prefixParts.join('/');
}

function withCategoryLinks(
  items: readonly SidebarItem[],
  options: CategoryLinkOptions,
): SidebarItem[] {
  const skipSlugs = new Set(options.skipSlugs ?? []);

  return items.map((item) => {
    if (item.type !== 'category') {
      return item;
    }

    const nestedItems = withCategoryLinks(item.items ?? [], options);
    const next: SidebarItem = {...item, items: nestedItems};

    if (next.link) {
      return next;
    }

    const docIds = collectDocIds(nestedItems);
    const dir = commonDir(docIds);
    if (!dir) {
      return next;
    }

    const indexId = `${dir}/index`;
    if (docIds.includes(indexId)) {
      return {...next, link: {type: 'doc', id: indexId}};
    }

    const slug = `/${dir}`;
    if (skipSlugs.has(slug)) {
      return next;
    }

    const hasNestedCategory = nestedItems.some(
      (child) => child.type === 'category',
    );
    if (!hasNestedCategory && docIds.length === 1) {
      return {...next, link: {type: 'doc', id: docIds[0]!}};
    }

    return {
      ...next,
      link: {
        type: 'generated-index',
        title: typeof next.label === 'string' ? next.label : dir,
        slug,
      },
    };
  });
}

/**
 * For every sidebar category without an explicit `link`, attach one:
 * - `{type:'doc'}` when the category already has an `…/index` doc (or a single leaf doc)
 * - `{type:'generated-index'}` otherwise, using the common doc-id path as the slug
 */
export function applyCategoryLinks(
  sidebars: SidebarsConfig,
  options: CategoryLinkOptions = {},
): SidebarsConfig {
  const result: SidebarsConfig = {};
  for (const [key, value] of Object.entries(sidebars)) {
    if (Array.isArray(value)) {
      result[key] = withCategoryLinks(value as SidebarItem[], options);
    } else {
      result[key] = value;
    }
  }
  return result;
}
