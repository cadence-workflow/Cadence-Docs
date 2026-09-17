import React from 'react';
import {TitleFormatterProvider} from '@docusaurus/theme-common/internal';
import {HOMEPAGE_DOCUMENT_TITLE} from '@site/src/homepageSeo';

// Default formatter appends ` | ${siteTitle}`. The homepage title already
// self-identifies the product, so do not spend SERP pixels on a second Cadence.
function formatter(params) {
  if (params.title?.trim() === HOMEPAGE_DOCUMENT_TITLE) {
    return HOMEPAGE_DOCUMENT_TITLE;
  }
  return params.defaultFormatter(params);
}

export default function ThemeProviderTitleFormatter({children}) {
  return (
    <TitleFormatterProvider formatter={formatter}>
      {children}
    </TitleFormatterProvider>
  );
}
