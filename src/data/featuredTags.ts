export const FEATURED_TAGS = ['Blog', 'Doc', 'Community', 'FAQ', 'Video'] as const;
export type FeaturedTag = (typeof FEATURED_TAGS)[number];

export const TAG_DEFAULT_IMAGE: Record<FeaturedTag, string> = {
  Blog: '/img/featured/blog.svg',
  Doc: '/img/featured/doc.svg',
  Community: '/img/featured/community.svg',
  FAQ: '/img/featured/faq.svg',
  Video: '/img/featured/video.svg',
};

export const FALLBACK_IMAGE = '/img/featured/default.svg';
