import React, {type ReactNode} from 'react';
import DocCardList from '@theme/DocCardList';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem} from '@docusaurus/plugin-content-docs';

/**
 * Renders first-level items from the currently displayed docs sidebar as
 * DocCards. Used on section root pages such as /docs, /community, and /faq.
 */
export default function SidebarSectionCards(): ReactNode {
  const sidebar = useDocsSidebar();
  if (!sidebar?.items?.length) {
    return null;
  }

  // Omit this landing page itself when it appears in the sidebar.
  const items = sidebar.items.filter((item: PropSidebarItem) => {
    if (item.type === 'link' && item.docId === 'index') {
      return false;
    }
    return true;
  });

  if (!items.length) {
    return null;
  }

  return <DocCardList items={items} />;
}
