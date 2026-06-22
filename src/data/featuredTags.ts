export const FEATURED_TAGS = ['Blog', 'Doc', 'Community', 'FAQ', 'Video'] as const;
export type FeaturedTag = (typeof FEATURED_TAGS)[number];

// TEMP placeholders — replace with themed art once designed.
export const TAG_DEFAULT_IMAGE: Record<FeaturedTag, string> = {
  Blog: '/img/docusaurus/undraw_docusaurus_react.svg',
  Doc: '/img/docusaurus/undraw_docusaurus_mountain.svg',
  Community: '/img/docusaurus/undraw_docusaurus_tree.svg',
  FAQ: '/img/gears_blue.svg',
  Video: '/img/arrow_divert_filled.svg',
};

export const FALLBACK_IMAGE = '/img/red-herring.svg';
