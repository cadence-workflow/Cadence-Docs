export const FEATURED_TAGS = ['Blog', 'Doc', 'Community', 'FAQ', 'Video'] as const;
export type FeaturedTag = (typeof FEATURED_TAGS)[number];

export const TAG_DEFAULT_IMAGE: Record<FeaturedTag, string> = {
  Blog: '/img/featured/blog.png',
  Doc: '/img/featured/doc.png',
  Community: '/img/featured/community.png',
  FAQ: '/img/featured/faq.png',
  Video: '/img/featured/video.png',
};

// Used when an item has no explicit image and its tag isn't one of the above.
export const FALLBACK_IMAGE = TAG_DEFAULT_IMAGE.Doc;
