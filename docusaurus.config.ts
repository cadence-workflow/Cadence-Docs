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
  title: 'Cadence',
  tagline: 'Orchestrate with Confidence: The Open-Source Workflow Engine for Tomorrow',
  favicon: 'img/favicon.ico',

  url: envReplace('${CADENCE_DOCS_URL:-https://cadenceworkflow.io}', process.env),

  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: envReplace('${BASE_URL:-/}', process.env),

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: envReplace('${ORGANIZATION_NAME:-cadence-workflow}', process.env),

  // Usually your repo name.
  projectName: envReplace('${PROJECT_NAME:-Cadence-Docs}', process.env),

  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

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
        googleTagManager: {
          containerId: 'G-W63QD8QE6E',
        },
        gtag: {
          trackingID: 'G-W63QD8QE6E',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
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
          copyright: `Copyright © ${new Date().getFullYear()} Uber Technologies, Inc.`,
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
      '@docusaurus/plugin-client-redirects',
      {
        // redirects here only work in production build, not development
        fromExtensions: ['html'],
        createRedirects(routePath) {
          if (routePath === '/docs' || routePath === '/docs/') {
            return [`${routePath}/get-started`];
          }
          return [];
        },
        redirects: [
          {
            from: ['/docs/support', '/docs/next/support'],
            to: '/community/support',
          },
          {
            from: ['/docs/team', '/docs/next/team'],
            to: '/community/team',
          },
          {
            from: ['/docs/resources', '/docs/next/resources'],
            to: '/community/resources',
          },
        ],
      } satisfies ClientRedirectsOptions,
    ],
  ],

  themeConfig: {
    announcementBar: {
      id: 'survey_announcement',
      content:
        'We are looking to hear your feedback, please fill the <a target="_blank" rel="noopener noreferrer" href="https://www.surveymonkey.com/r/9RL7YX9">Cadence 2024 OSS community survey</a>',
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: true,
    },

    algolia: {
      // The application ID provided by Algolia
      appId: 'J7SVDVT89Z',

      // Public API key: it is safe to commit it
      apiKey: 'e96333af9178875d6417a55ac276d718',

      indexName: 'cadenceworkflow',

      // Optional: see doc section below
      contextualSearch: false,

      // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
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
    image: 'img/social-card-min.jpg',
    navbar: {
      title: '',
      logo: {
        alt: 'Cadence Logo',
        src: 'img/cadence-logo.svg',
        srcDark: "img/logo-white.svg"
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
          to: '/community/support',
          label: 'Community',
          position: 'left',
          activeBaseRegex: `/community/`,
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
              label: 'Cadence Community Slack',
              href: 'http://t.uber.com/cadence-slack',
            },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/company/cadenceworkflow/',
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
      copyright: `Copyright © ${new Date().getFullYear()} Uber Technologies, Inc.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['go', 'java', 'bash', 'markup', 'json', 'shell-session', 'yaml', 'gradle', 'log',],

    },
  } satisfies Preset.ThemeConfig,
};

export default config;
