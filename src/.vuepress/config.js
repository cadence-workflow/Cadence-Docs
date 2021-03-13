const { slackUrl } = require('./constants');

module.exports = {
  dest: 'dist',
  lang: 'en-US',
  title: 'Cadence',
  patterns: [
    '**/*.md',
    '**/*.vue',

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
  ],
  head: [
    ['link', { rel: 'icon', href: `/img/favicon.ico` }],
  ],
  themeConfig: {
    docsDir: '/docs',
    logo: '/img/logo-white.svg',
    docsRepo: 'uber/cadence-docs',
    docsDir: 'src',
    editLinks: true,
    nav: [
      {
        text: 'Docs',
        items: [
          { text: 'Get Started', link: '/docs/get-started/' },
          { text: 'Use cases', link: '/docs/use-cases/' },
          { text: 'Concepts', link: '/docs/concepts/' },
          { text: 'Tutorials', link: '/docs/tutorials/' },
          { text: 'Java client', link: '/docs/java-client/' },
          { text: 'Go client', link: '/docs/go-client/' },
          { text: 'Command line interface', link: '/docs/cli/' },
          { text: 'Operation Guide', link: '/docs/operation-guide/' },
          { text: 'Glossary', link: '/GLOSSARY' },
          { text: 'About', link: '/docs/about/' },
        ],
      },
      {
        text: 'Client',
        items: [
          { text: 'Java Docs', link: 'https://www.javadoc.io/doc/com.uber.cadence/cadence-client' },
          { text: 'Java Client', link: 'https://mvnrepository.com/artifact/com.uber.cadence/cadence-client' },
          { text: 'Go Docs', link: 'https://godoc.org/go.uber.org/cadence' },
          { text: 'Go Client', link: 'https://github.com/uber-go/cadence-client/releases/latest' },
        ],
      },
      {
        text: 'Community',
        items: [
          { text: 'Slack', link: slackUrl },
          { text: 'StackOverflow', link: 'https://stackoverflow.com/questions/tagged/cadence-workflow' },
        ],
      },
      {
        text: 'GitHub',
        items: [
          { text: 'Cadence Service and CLI', link: 'https://github.com/uber/cadence' },
          { text: 'Cadence Go Client', link: 'https://github.com/uber-go/cadence-client' },
          { text: 'Cadence Go Client Samples', link: 'https://github.com/uber-common/cadence-samples' },
          { text: 'Cadence Java Client', link: 'https://github.com/uber-java/cadence-client' },
          { text: 'Cadence Java Client Samples', link: 'https://github.com/uber/cadence-java-samples' },
          { text: 'Cadence Web UI', link: 'https://github.com/uber/cadence-web' },
          { text: 'Cadence Docs', link: 'https://github.com/uber/cadence-docs' },
        ],
      },
      {
        text: 'Docker',
        items: [
          { text: 'Cadence Service', link: 'https://hub.docker.com/r/ubercadence/server/tags' },
          { text: 'Cadence CLI', link: 'https://hub.docker.com/r/ubercadence/cli/tags' },
          { text: 'Cadence Web UI', link: 'https://hub.docker.com/r/ubercadence/web/tags' },
        ],
      },
    ],
    sidebar: {
      '/docs/': [
        {
          title: 'Get Started',
          path: '/docs/00-get-started',
          children:[
            '00-get-started/',
            '00-get-started/01-server-installation',
            '00-get-started/02-java-hello-world',
            '00-get-started/03-golang-hello-world',
            '00-get-started/04-video-tutorials',
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
          path: '/docs/01-use-cases',
          children: [
            '01-use-cases/',
            '01-use-cases/01-periodic-execution',
            '01-use-cases/02-orchestration',
            '01-use-cases/03-polling',
            '01-use-cases/04-event-driven',
            '01-use-cases/05-partitioned-scan',
            '01-use-cases/06-batch-job',
            '01-use-cases/07-provisioning',
            '01-use-cases/08-deployment',
            '01-use-cases/09-operational-management',
            '01-use-cases/10-interactive',
            '01-use-cases/11-dsl',
            '01-use-cases/12-big-ml',
          ],
        },
        {
          title: 'Concepts',
          path: '/docs/02-concepts',
          children: [
            '02-concepts/',
            '02-concepts/01-workflows',
            '02-concepts/02-activities',
            '02-concepts/03-events',
            '02-concepts/04-queries',
            '02-concepts/05-topology',
            '02-concepts/06-task-lists',
            '02-concepts/07-archival',
            '02-concepts/08-cross-dc-replication',
            '02-concepts/09-search-workflows',
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
          ],
        },
        {
          title: 'Go client',
          path: '/docs/05-go-client',
          children: [
            '05-go-client/',
            '05-go-client/01-workers',
            '05-go-client/02-create-workflows',
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
          ],
        },
        {
          title: 'Glossary',
          path: '../GLOSSARY',
        },
        {
          title: 'About',
          path: '/docs/08-about',
          children: [
            '08-about/',
            '08-about/01-license',
          ],
        },
      ],
    },
  }
};
