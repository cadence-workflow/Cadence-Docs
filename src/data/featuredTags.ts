export const FEATURED_TAGS = ['Blog', 'Doc', 'Community', 'FAQ', 'Video'] as const;
export type FeaturedTag = (typeof FEATURED_TAGS)[number];

// Active featured image set. Switch by changing this single value:
//   'default' -> static/img/featured/*.png
//   'glass'   -> static/img/featured/glass/*.png
//   'iso'     -> static/img/featured/iso/*.png
type ImageSet = 'default' | 'glass' | 'iso';
const IMAGE_SET: ImageSet = 'iso';

const IMAGE_SET_DIR: Record<ImageSet, string> = {
  default: '/img/featured',
  glass: '/img/featured/glass',
  iso: '/img/featured/iso',
};

const dir = IMAGE_SET_DIR[IMAGE_SET];

export const TAG_DEFAULT_IMAGE: Record<FeaturedTag, string> = {
  Blog: `${dir}/blog.png`,
  Doc: `${dir}/doc.png`,
  Community: `${dir}/community.png`,
  FAQ: `${dir}/faq.png`,
  Video: `${dir}/video.png`,
};

// default.png only exists in the root set, so always fall back to it.
export const FALLBACK_IMAGE = '/img/featured/default.png';
