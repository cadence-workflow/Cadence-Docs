import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  docsSidebar: [
    {
      label: 'Get Started',
      type: 'category',
      items: [
        { type: 'doc', id: 'get-started/index' },
        { type: 'doc', id: 'get-started/server-installation' },
        { type: 'doc', id: 'get-started/java-hello-world' },
        { type: 'doc', id: 'get-started/golang-hello-world' },
        { type: 'doc', id: 'get-started/video-tutorials' },
      ],
    },
    {
      label: 'Use Cases',
      type: 'category',
      items: [
        { type: 'doc', id: 'use-cases/index' },
        { type: 'doc', id: 'use-cases/periodic-execution' },
        { type: 'doc', id: 'use-cases/orchestration' },
        { type: 'doc', id: 'use-cases/polling' },
        { type: 'doc', id: 'use-cases/event-driven' },
        { type: 'doc', id: 'use-cases/partitioned-scan' },
        { type: 'doc', id: 'use-cases/batch-job' },
        { type: 'doc', id: 'use-cases/provisioning' },
        { type: 'doc', id: 'use-cases/deployment' },
        { type: 'doc', id: 'use-cases/operational-management' },
        { type: 'doc', id: 'use-cases/interactive' },
        { type: 'doc', id: 'use-cases/dsl' },
        { type: 'doc', id: 'use-cases/big-ml' },
      ],
    },

    {
      label: 'Concepts',
      type: 'category',
      items: [
        { type: 'doc', id: 'concepts/index' },
        { type: 'doc', id: 'concepts/workflows' },
        { type: 'doc', id: 'concepts/activities' },
        { type: 'doc', id: 'concepts/events' },
        { type: 'doc', id: 'concepts/queries' },
        { type: 'doc', id: 'concepts/topology' },
        { type: 'doc', id: 'concepts/task-lists' },
        { type: 'doc', id: 'concepts/archival' },
        { type: 'doc', id: 'concepts/cross-dc-replication' },
        { type: 'doc', id: 'concepts/search-workflows' },
        { type: 'doc', id: 'concepts/http-api' },
      ],
    },
    {
      label: 'Java Client',
      type: 'category',
      items: [
        { type: 'doc', id: 'java-client/index' },
        { type: 'doc', id: 'java-client/client-overview' },
        { type: 'doc', id: 'java-client/workflow-interface' },
        { type: 'doc', id: 'java-client/implementing-workflows' },
        { type: 'doc', id: 'java-client/starting-workflow-executions' },
        { type: 'doc', id: 'java-client/activity-interface' },
        { type: 'doc', id: 'java-client/versioning' },
        { type: 'doc', id: 'java-client/distributed-cron' },
        { type: 'doc', id: 'java-client/workers' },
        { type: 'doc', id: 'java-client/signals' },
        { type: 'doc', id: 'java-client/queries' },
        { type: 'doc', id: 'java-client/retries' },
        { type: 'doc', id: 'java-client/child-workflows' },
        { type: 'doc', id: 'java-client/exception-handling' },
        { type: 'doc', id: 'java-client/continue-as-new' },
        { type: 'doc', id: 'java-client/side-effect' },
        { type: 'doc', id: 'java-client/testing' },
        { type: 'doc', id: 'java-client/workflow-replay-shadowing' },
      ],
    },
    {
      label: 'Go Client',
      type: 'category',
      items: [
        { type: 'doc', id: 'go-client/index' },
        { type: 'doc', id: 'go-client/workers' },
        { type: 'doc', id: 'go-client/create-workflows' },
        { type: 'doc', id: 'go-client/starting-workflows' },
        { type: 'doc', id: 'go-client/activities' },
        { type: 'doc', id: 'go-client/execute-activity' },
        { type: 'doc', id: 'go-client/child-workflows' },
        { type: 'doc', id: 'go-client/retries' },
        { type: 'doc', id: 'go-client/error-handling' },
        { type: 'doc', id: 'go-client/signals' },
        { type: 'doc', id: 'go-client/continue-as-new' },
        { type: 'doc', id: 'go-client/side-effect' },
        { type: 'doc', id: 'go-client/queries' },
        { type: 'doc', id: 'go-client/activity-async-completion' },
        { type: 'doc', id: 'go-client/workflow-testing' },
        { type: 'doc', id: 'go-client/workflow-versioning' },
        { type: 'doc', id: 'go-client/sessions' },
        { type: 'doc', id: 'go-client/distributed-cron' },
        { type: 'doc', id: 'go-client/tracing' },
        { type: 'doc', id: 'go-client/workflow-replay-shadowing' },
        { type: 'doc', id: 'go-client/workflow-non-deterministic-error' },
      ],
    },
    {
      label: 'Command Line Interface',
      type: 'category',
      items: [
        { type: 'doc', id: 'cli/index' },
      ],
    },
    {
      label: 'Production Operation',
      type: 'category',
      items: [
        { type: 'doc', id: 'operation-guide/index' },
        { type: 'doc', id: 'operation-guide/setup' },
        { type: 'doc', id: 'operation-guide/maintain' },
        { type: 'doc', id: 'operation-guide/monitoring' },
        { type: 'doc', id: 'operation-guide/troubleshooting' },
        { type: 'doc', id: 'operation-guide/migration' },
      ],
    },
    {
      label: 'Workflow Troubleshooting',
      type: 'category',
      items: [
        { type: 'doc', id: 'workflow-troubleshooting/index' },
        { type: 'doc', id: 'workflow-troubleshooting/timeouts' },
        { type: 'doc', id: 'workflow-troubleshooting/activity-failures' },
        { type: 'doc', id: 'workflow-troubleshooting/retries' },
      ],
    },
    {
      label: 'Releases',
      type: 'category',
      items: [
        { type: 'doc', 'id': 'releases/cadence', label: 'Cadence Service' },
        { type: 'doc', 'id': 'releases/cadence-go-client', label: 'Cadence Go Client' },
        { type: 'doc', 'id': 'releases/cadence-java-client', label: 'Cadence Java Client' },
      ],
    },
    {
      label: 'About',
      type: 'category',
      items: [
        { type: 'doc', 'id': 'about/index' },
        { type: 'doc', 'id': 'about/license' },
      ],
    },
    //{type: 'autogenerated', dirName: '.'}
  ],
};

export default sidebars;
