export const FEATURED_TAGS = ['Blog', 'Doc', 'Community', 'FAQ', 'Video'] as const;
export type FeaturedTag = (typeof FEATURED_TAGS)[number];

// Active featured image set. Switch by changing this single value:
//   'default' -> static/img/featured/*.png
//   'glass'   -> static/img/featured/glass/*.png
//   'iso'     -> static/img/featured/iso/*.png
//   'metal'   -> static/img/featured/metal/*.png
//   'iso2'    -> static/img/featured/iso2/*.png
//   'material'-> static/img/featured/material/*.png
type ImageSet = 'default' | 'glass' | 'iso' | 'metal' | 'iso2' | 'material';
const IMAGE_SET: ImageSet = 'iso2';

const IMAGE_SET_DIR: Record<ImageSet, string> = {
  default: '/img/featured',
  glass: '/img/featured/glass',
  iso: '/img/featured/iso',
  metal: '/img/featured/metal',
  iso2: '/img/featured/iso2',
  material: '/img/featured/material',
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

// When true, Video cards render a click-to-play YouTube facade (poster +
// play button that loads the player on click) instead of linking out.
export const VIDEO_EMBED = true;
