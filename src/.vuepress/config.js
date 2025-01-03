const { themeConfig } = require('../shared/config');

module.exports = {
  dest: 'dist',
  lang: 'en-US',
  title: 'Cadence',
  patterns: [
    '**/*.md',
    '**/*.vue',
    '!blog/**/*.md',

    // comment line to enable test pages
    '!**/test-pages/*.md'
  ],
  plugins: [
    '@vuepress/back-to-top',
    'code-switcher',
    'fulltext-search',
    'reading-progress',
    'vuepress-plugin-code-copy',
    'vuepress-plugin-glossary',
    ['vuepress-plugin-redirect', {
      redirectors: [
        {
          base: '/docs/',
          alternative: [
            'get-started'
          ]
        }
      ]
    }]
  ],
  head: [
    ['link', { rel: 'icon', href: `/img/favicon.ico` }],
    ['script', {
      async: true,
      src: 'https://www.googletagmanager.com/gtag/js?id=G-W63QD8QE6E'
    }],
    ['script', {}, `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-W63QD8QE6E');`],
  ],
  themeConfig: {
    ...themeConfig,
    docsRepo: 'uber/cadence-docs',
    docsDir: 'src',
    editLinks: true,
    sidebar: {
      '/docs/': [
        {
          title: 'Get Started',
          path: '/docs/01-get-started',
          children: [
            '01-get-started/',
            '01-get-started/01-server-installation',
            '01-get-started/02-java-hello-world',
            '01-get-started/03-golang-hello-world',
            '01-get-started/04-video-tutorials',
          ]
        },
        // Uncomment block to add test pages to navigation.
        /**
        {
          title: 'Test page',
          path: '/docs/test-pages',
          children: [
            'test-pages/',
            'test-pages/02-code-tabs',
            'test-pages/03-glossary',
          ],
        },
        /**/
        {
          title: 'Use cases',
          path: '/docs/02-use-cases',
          children: [
            '02-use-cases/',
            '02-use-cases/01-periodic-execution',
            '02-use-cases/02-orchestration',
            '02-use-cases/03-polling',
            '02-use-cases/04-event-driven',
            '02-use-cases/05-partitioned-scan',
            '02-use-cases/06-batch-job',
            '02-use-cases/07-provisioning',
            '02-use-cases/08-deployment',
            '02-use-cases/09-operational-management',
            '02-use-cases/10-interactive',
            '02-use-cases/11-dsl',
            '02-use-cases/12-big-ml',
          ],
        },
        {
          title: 'Concepts',
          path: '/docs/03-concepts',
          children: [
            '03-concepts/',
            '03-concepts/01-workflows',
            '03-concepts/02-activities',
            '03-concepts/03-events',
            '03-concepts/04-queries',
            '03-concepts/05-topology',
            '03-concepts/06-task-lists',
            '03-concepts/07-archival',
            '03-concepts/08-cross-dc-replication',
            '03-concepts/09-search-workflows',
            '03-concepts/10-http-api',
          ],
        },
        {
          title: 'Java client',
          path: '/docs/04-java-client',
          children: [
            '04-java-client/',
            '04-java-client/01-client-overview',
            '04-java-client/02-workflow-interface',
            '04-java-client/03-implementing-workflows',
            '04-java-client/04-starting-workflow-executions',
            '04-java-client/05-activity-interface',
            '04-java-client/06-implementing-activities',
            '04-java-client/07-versioning',
            '04-java-client/08-distributed-cron',
            '04-java-client/09-workers',
            '04-java-client/10-signals',
            '04-java-client/11-queries',
            '04-java-client/12-retries',
            '04-java-client/13-child-workflows',
            '04-java-client/14-exception-handling',
            '04-java-client/15-continue-as-new',
            '04-java-client/16-side-effect',
            '04-java-client/17-testing',
            '04-java-client/18-workflow-replay-shadowing',
          ],
        },
        {
          title: 'Go client',
          path: '/docs/05-go-client',
          children: [
            '05-go-client/',
            '05-go-client/01-workers',
            '05-go-client/02-create-workflows',
            '05-go-client/02.5-starting-workflows',
            '05-go-client/03-activities',
            '05-go-client/04-execute-activity',
            '05-go-client/05-child-workflows',
            '05-go-client/06-retries',
            '05-go-client/07-error-handling',
            '05-go-client/08-signals',
            '05-go-client/09-continue-as-new',
            '05-go-client/10-side-effect',
            '05-go-client/11-queries',
            '05-go-client/12-activity-async-completion',
            '05-go-client/13-workflow-testing',
            '05-go-client/14-workflow-versioning',
            '05-go-client/15-sessions',
            '05-go-client/16-distributed-cron',
            '05-go-client/17-tracing',
            '05-go-client/18-workflow-replay-shadowing',
          ],
        },
        {
          title: 'Command line interface',
          path: '/docs/06-cli/',
        },
        {
          title: 'Production Operation',
          path: '/docs/07-operation-guide/',
          children: [
            '07-operation-guide/',
            '07-operation-guide/01-setup',
            '07-operation-guide/02-maintain',
            '07-operation-guide/03-monitoring',
            '07-operation-guide/04-troubleshooting',
            '07-operation-guide/05-migration',
          ],
        },
        {
          title: 'Workflow Troubleshooting',
          path: '/docs/08-workflow-troubleshooting/',
          children: [
            '08-workflow-troubleshooting/',
            '08-workflow-troubleshooting/01-timeouts',
            '08-workflow-troubleshooting/02-activity-failures',
            '08-workflow-troubleshooting/03-retries',
          ],
        },
        {
          title: 'Glossary',
          path: '../GLOSSARY',
        },
        {
          title: 'About',
          path: '/docs/09-about',
          children: [
            '09-about/',
            '09-about/01-license',
          ],
        },
      ],
    },
  }
};
