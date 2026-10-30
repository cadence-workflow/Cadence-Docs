import path from 'path';
import npm2yarn from '@docusaurus/remark-plugin-npm2yarn';
import remarkMath from 'remark-math';
import glossary from './src/remark/glossary.js';

import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { Options as DocsOptions } from '@docusaurus/plugin-content-docs';
import type { Options as BlogOptions } from '@docusaurus/plugin-content-blog';
import type { Options as PageOptions } from '@docusaurus/plugin-content-pages';
import type { Options as IdealImageOptions } from '@docusaurus/plugin-ideal-image';
import type { Options as ClientRedirectsOptions } from '@docusaurus/plugin-client-redirects';
import { envReplace } from '@pnpm/config.env-replace';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)
const defaultLocale = 'en';

const config: Config = {
  // Keep this short. Docs/blog titles are `{page} | ${title}`. The homepage
  // document title / og:title come from HOMEPAGE_DOCUMENT_TITLE in
  // src/homepageSeo.ts (used by src/pages/index.tsx), and the swizzled
  // src/theme/ThemeProvider/TitleFormatter keys off that exact constant to drop
  // the ` | Cadence` suffix. Edit that constant; do not inline the string here
  // or in index.tsx.
  title: 'Cadence',
  tagline: 'Orchestrate with Confidence: The Open-Source Workflow Engine for Tomorrow',
  favicon: 'img/favicon.ico',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    }
  },
  themes: ['@docusaurus/theme-mermaid'],

  url: envReplace('${CADENCE_DOCS_URL:-https://cadenceworkflow.io}', process.env),

  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: envReplace('${BASE_URL:-/}', process.env),

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: envReplace('${ORGANIZATION_NAME:-cadence-workflow}', process.env),

  // Usually your repo name.
  projectName: envReplace('${PROJECT_NAME:-Cadence-Docs}', process.env),

  // GitHub Pages cannot serve both `page.html` and `page/index.html`. With
  // trailingSlash: false, docs are `page.html`, so /page/ 404s (SPA recovers).
  // Directory URLs (/page/index.html) are what GH Pages expects.
  trailingSlash: true,

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/cadence-workflow/Cadence-Docs/tree/master/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          remarkPlugins: [glossary],
        } satisfies DocsOptions,
        blog: {
          blogTitle: 'Cadence Blog',
          blogDescription: 'The latest news and updates from the Cadence team',
          //postsPerPage: 'ALL',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          blogSidebarTitle: 'Recent Posts',
          editUrl:
            'https://github.com/cadence-workflow/Cadence-Docs/tree/master/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          blogSidebarCount: 'ALL',
        } satisfies BlogOptions,
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-W63QD8QE6E',
          anonymizeIP: true,
        },
        sitemap: {
          changefreq: 'weekly',
          createSitemapItems: async (params) => {
            const {defaultCreateSitemapItems, ...rest} = params;
            const items = await defaultCreateSitemapItems(rest);
            return items.map((item) => {
              if (item.url === 'https://cadenceworkflow.io/') {
                return {...item, priority: 1.0};
              }
              if (item.url.includes('/docs/get-started')) {
                return {...item, priority: 0.9};
              }
              if (item.url.includes('/faq/')) {
                return {...item, priority: 0.8};
              }
              if (item.url.includes('/docs/')) {
                return {...item, priority: 0.7};
              }
              if (item.url.includes('/blog/') && !item.url.includes('/tags') && !item.url.includes('/page/') && !item.url.includes('/authors')) {
                return {...item, priority: 0.6};
              }
              return {...item, priority: 0.5};
            });
          },
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    './src/plugins/yaml-loader',
    [
      './src/plugins/changelog/index.js',
      {
        blogTitle: 'Cadence changelog',
        blogDescription:
          'Keep yourself up-to-date about new features in every release',
        blogSidebarCount: 'ALL',
        blogSidebarTitle: 'Changelog',
        routeBasePath: '/changelog',
        showReadingTime: false,
        postsPerPage: 20,
        archiveBasePath: null,
        authorsMapPath: 'authors.json',
        feedOptions: {
          type: 'all',
          title: 'Cadence Docs changelog',
          description:
            'Keep yourself up-to-date about new features in every release',
          copyright: `Copyright © Cadence a Series of LF Projects, LLC. <br/>For website terms of use, trademark policy and other project policies please see <a href="https://lfprojects.org/policies/" target="_blank">lfprojects.org/policies/</a>.`,
          language: defaultLocale,
        },
        onInlineAuthors: 'warn',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'community',
        path: 'community',
        routeBasePath: 'community',
        editUrl: 'https://github.com/cadence-workflow/Cadence-Docs/edit/master/',
        remarkPlugins: [npm2yarn],
        sidebarPath: './sidebarsCommunity.js',
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
      } satisfies DocsOptions,
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'faq',
        path: 'faq',
        routeBasePath: 'faq',
        editUrl: 'https://github.com/cadence-workflow/Cadence-Docs/edit/master/',
        remarkPlugins: [npm2yarn],
        sidebarPath: './sidebarsFAQ.js',
        showLastUpdateAuthor: true,
        showLastUpdateTime: true,
      } satisfies DocsOptions,
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        // redirects here only work in production build, not development
        fromExtensions: ['html'],
        // Do not emit no-slash → slash HTML redirects: on GitHub Pages,
        // `page.html` + `page/index.html` conflict and /page/ 404s.
        // GH Pages serves /page as the directory when only page/index.html exists.
        redirects: [
          {
            // With trailingSlash: true, only list each from-path once.
            // /docs/about/ would write docs/about/index.html and collide
            // with the about/ doc folder.
            from: ['/docs/team', '/docs/next/team'],
            to: '/community/team/',
          },
          {
            from: ['/docs/about', '/docs/next/about'],
            to: '/community/contact-us/',
          },
          // /docs, /community, and /faq are real overview pages that
          // list first-level sidebar sections. Keep only the leftover
          // meetup path redirect here.
          {
            from: '/community/meetup',
            to: '/community/contact-us/',
          },
        ],
      } satisfies ClientRedirectsOptions,
    ],
  ],

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'algolia-site-verification',
        content: '0985E180AA68E235',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: 'https://d1a3f4spazzrp4.cloudfront.net/dotcom-assets/fonts/UberMove-Bold.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: 'https://d1a3f4spazzrp4.cloudfront.net/dotcom-assets/fonts/UberMoveText-Regular.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: 'https://d1a3f4spazzrp4.cloudfront.net/dotcom-assets/fonts/UberMoveText-Medium.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: 'https://d1a3f4spazzrp4.cloudfront.net/dotcom-assets/fonts/UberMoveText-Bold.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
  ],
  themeConfig: {
    // Site-wide <meta> only. Do not set description / og:title / og:description / og:url / twitter:*
    // here — they duplicate every page and often win over DocItem Layout PageMetadata in crawlers.
    // Per-page: docs/blog frontmatter `description` + `keywords`; homepage uses Layout `description` in index.tsx.
    // og:image default: themeConfig.image below. og:url + og:locale: SiteMetadata + AlternateLangHeaders.
    // twitter:card: theme SiteMetadata sets summary_large_image.
    metadata: [
      {
        name: 'keywords',
        content:
          'Cadence, Workflow, Orchestration, CNCF, Open Source, Community, Support, GitHub, Stack Overflow, LinkedIn, YouTube, X',
      },
      {property: 'og:site_name', content: 'Cadence Workflow'},
      {property: 'og:type', content: 'website'},
    ],
    headTags: [
      // Declare some json-ld structured data
      {
        tagName: 'script',
        attributes: {
          type: 'application/ld+json',
        },
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org/',
          '@type': 'Organization',
          name: 'Cadence Workflow',
          url: 'https://cadenceworkflow.io/',
          logo: 'https://cadenceworkflow.io/img/cadence-logo.svg',
        }),
      },
    ],

    algolia: {
      // The application ID provided by Algolia
      appId: 'N9YD9IU5NA',

      // Public API key: it is safe to commit it
      apiKey: 'b1e19704002d5d620299a443771ea84e',

      indexName: 'cadenceworkflow',

      // Optional: see doc section below
      contextualSearch: false,

      // Optional: Specify domains where the navigation should occur through window.location instead of history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      externalUrlRegex: 'external\\.com|domain\\.com',

      // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
      // replaceSearchResultPathname: {
      //   from: '/docs/', // or as RegExp: /\/docs\//
      //   to: '/',
      // },

      // Optional: Algolia search parameters
      searchParameters: {},

      // Optional: path for search page that enabled by default (`false` to disable it)
      searchPagePath: 'search',

      // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      insights: true,

      //... other Algolia params
    },
    // Replace with your project's social card
    image: 'img/social-card-min.png',
    navbar: {
      title: '',
      logo: {
        alt: 'Cadence Logo',
        src: 'img/cadence-logo.svg',
        srcDark: "img/logo-white.svg",
        width: 82,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left'
        },
        {
          to: '/community',
          label: 'Community',
          position: 'left',
          activeBaseRegex: `/community(/|$)`,
        },
        {
          to: '/faq',
          label: 'FAQ',
          position: 'left',
          activeBaseRegex: `/faq(/|$)`,
        },
        {
          type: 'dropdown',
          position: 'right',
          label: 'Repositories',
          items: [
            { label: 'Cadence Service', href: 'https://github.com/cadence-workflow/cadence' },
            { label: 'Go Client', href: 'https://github.com/cadence-workflow/cadence-go-client' },
            { label: 'Java Client', href: 'https://github.com/cadence-workflow/cadence-java-client' },
            { label: 'Go Samples', href: 'https://github.com/cadence-workflow/cadence-samples' },
            { label: 'Java Samples', href: 'https://github.com/cadence-workflow/cadence-java-samples' },
            { label: 'Cadence Web', href: 'https://github.com/cadence-workflow/cadence-web' },
            { label: 'Cadence IDLs', href: 'https://github.com/cadence-workflow/cadence-idl' },
            { label: 'Helm Charts', href: 'https://github.com/cadence-workflow/cadence-charts' },
            { label: 'Shard Manager', href: 'https://github.com/cadence-workflow/shard-manager' },
          ],
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/get-started/',
            },
            {
              label: 'Go Client',
              to: 'docs/go-client/',
            },
            {
              label: 'Java Client',
              to: 'docs/java-client/',
            },
            {
              label: 'Command Line Interface',
              to: 'docs/cli/',
            },
            {
              label: 'Operation Guide',
              to: 'docs/operation-guide/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/cadence-workflow+uber-cadence',
            },
            {
              label: 'Cadence Community on CNCF Slack',
              href: 'https://cloud-native.slack.com/archives/C0A7ZBG65PT',
            },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/company/cadenceworkflow/',
            },
            {
              label: 'Reddit',
              href: 'https://www.reddit.com/r/cadenceworkflow/',
            },
          ],
        },
        {
          title: 'FAQ',
          items: [
            {
              label: 'Bad Patterns and Best Practice Alternatives',
              to: '/faq/best-practices',
            },
            {
              label: 'Cadence vs Temporal',
              to: '/faq/cadence-vs-temporal',
            },
            {
              label: 'How to Add a New FAQ',
              to: '/faq/how-to-add-a-new-faq',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/cadence-workflow/cadence',
            },
          ],
        },
      ],
      copyright: `Copyright © Cadence a Series of LF Projects, LLC. <br/>For website terms of use, trademark policy and other project policies please see <a href="https://lfprojects.org/policies/" target="_blank">lfprojects.org/policies/</a>.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['go', 'java', 'bash', 'markup', 'json', 'shell-session', 'yaml', 'gradle', 'log',],

    },
  } satisfies Preset.ThemeConfig,
};

export default config;
