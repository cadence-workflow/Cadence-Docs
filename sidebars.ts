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
        { type: 'doc', id: 'get-started/grafana-helm-setup' },
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
        { type: 'doc', id: 'concepts/data-converter' },
        { type: 'doc', id: 'concepts/workflow-queries-formatted-data' },
        { type: 'doc', id: 'concepts/workflow-engine' },
        { type: 'doc', id: 'concepts/open-source-workflow-engine' },
        { type: 'doc', id: 'concepts/schedules' },
        { type: 'doc', id: 'concepts/timers' },
      ],
    },
    {
      label: 'Codelabs',
      type: 'category',
      items: [
        { type: 'doc', id: 'codelabs/workflow-tests-go-replayer-shadower' },
        { type: 'doc', id: 'codelabs/helm-deploy-postgres-opensearch' },
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
        { type: 'doc', id: 'java-client/implementing-activities' },
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
        { type: 'doc', id: 'go-client/worker-auto-scaling' },
        { type: 'doc', id: 'go-client/create-workflows' },
        { type: 'doc', id: 'go-client/starting-workflows' },
        { type: 'doc', id: 'go-client/activities' },
        { type: 'doc', id: 'go-client/execute-activity' },
        { type: 'doc', id: 'go-client/batch-future' },
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
        { type: 'doc', id: 'go-client/schedules' },
        { type: 'doc', id: 'go-client/tracing' },
        { type: 'doc', id: 'go-client/workflow-replay-shadowing' },
        { type: 'doc', id: 'go-client/workflow-non-deterministic-error' },
        { type: 'doc', id: 'go-client/sleep' },
      ],
    },
    {
      label: 'Python Client',
      type: 'category',
      items: [
        { type: 'doc', id: 'python-client/index' },
        { type: 'doc', id: 'python-client/workers' },
        { type: 'doc', id: 'python-client/workflows' },
        { type: 'doc', id: 'python-client/starting-workflows' },
        { type: 'doc', id: 'python-client/activities' },
        { type: 'doc', id: 'python-client/child-workflows' },
        { type: 'doc', id: 'python-client/signals' },
        { type: 'doc', id: 'python-client/queries' },
        { type: 'doc', id: 'python-client/retries' },
        { type: 'doc', id: 'python-client/error-handling' },
        { type: 'doc', id: 'python-client/continue-as-new' },
        { type: 'doc', id: 'python-client/distributed-cron' },
        { type: 'doc', id: 'python-client/schedules' },
        { type: 'doc', id: 'python-client/testing' },
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
        { type: 'doc', id: 'workflow-troubleshooting/antipatterns' },
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
        { type: 'doc', 'id': 'about/license' },
      ],
    },
    {
      label: 'Tech Review (WIP)',
      type: 'category',
      items: [
        { type: 'doc', id: 'tech-review/index' },
        {
          label: 'Day 0 - Planning',
          type: 'category',
          items: [
            { type: 'doc', id: 'tech-review/day-0-planning/index' },
            {
              label: 'Scope',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-0-planning/scope/vision-goals' },
                { type: 'doc', id: 'tech-review/day-0-planning/scope/primary-use-cases' },
                { type: 'doc', id: 'tech-review/day-0-planning/scope/roadmap-process' },
                { type: 'doc', id: 'tech-review/day-0-planning/scope/target-personas' },
                { type: 'doc', id: 'tech-review/day-0-planning/scope/target-organizations' },
                { type: 'doc', id: 'tech-review/day-0-planning/scope/end-user-research' },
              ],
            },
            {
              label: 'Usability',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-0-planning/usability/persona-interactions' },
                { type: 'doc', id: 'tech-review/day-0-planning/usability/ux-ui' },
                { type: 'doc', id: 'tech-review/day-0-planning/usability/production-integrations' },
              ],
            },
            {
              label: 'Design',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-0-planning/design/design-principles' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/architecture-requirements' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/service-dependencies' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/iam' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/sovereignty' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/compliance-requirements' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/high-availability' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/resource-requirements' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/storage-requirements' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/api-design' },
                { type: 'doc', id: 'tech-review/day-0-planning/design/release-processes' },
              ],
            },
            {
              label: 'Installation',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-0-planning/installation/installation-initialization' },
                { type: 'doc', id: 'tech-review/day-0-planning/installation/validation' },
              ],
            },
            {
              label: 'Security',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-0-planning/security/security-self-assessment' },
                { type: 'doc', id: 'tech-review/day-0-planning/security/security-tenets' },
                { type: 'doc', id: 'tech-review/day-0-planning/security/security-hygiene' },
                { type: 'doc', id: 'tech-review/day-0-planning/security/threat-modeling' },
              ],
            },
          ],
        },
        {
          label: 'Day 1 - Installation and Deployment',
          type: 'category',
          items: [
            { type: 'doc', id: 'tech-review/day-1-installation/index' },
            { type: 'doc', id: 'tech-review/day-1-installation/installation-configuration' },
            {
              label: 'Enablement & Rollback',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-1-installation/enablement-rollback/live-cluster-enablement-rollback' },
                { type: 'doc', id: 'tech-review/day-1-installation/enablement-rollback/default-behaviors' },
                { type: 'doc', id: 'tech-review/day-1-installation/enablement-rollback/testing-enablement' },
                { type: 'doc', id: 'tech-review/day-1-installation/enablement-rollback/resource-cleanup' },
              ],
            },
            {
              label: 'Rollout, Upgrade & Rollback Planning',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility' },
                { type: 'doc', id: 'tech-review/day-1-installation/rollout-upgrade-rollback/rollback-procedures' },
                { type: 'doc', id: 'tech-review/day-1-installation/rollout-upgrade-rollback/failure-scenarios' },
                { type: 'doc', id: 'tech-review/day-1-installation/rollout-upgrade-rollback/rollback-metrics' },
                { type: 'doc', id: 'tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing' },
                { type: 'doc', id: 'tech-review/day-1-installation/rollout-upgrade-rollback/deprecations' },
                { type: 'doc', id: 'tech-review/day-1-installation/rollout-upgrade-rollback/alpha-beta-capabilities' },
              ],
            },
          ],
        },
        {
          label: 'Day 2 - Day-to-Day Operations',
          type: 'category',
          items: [
            { type: 'doc', id: 'tech-review/day-2-operations/index' },
            {
              label: 'Scalability & Reliability',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/api-object-scaling' },
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/slos-slis' },
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/operations-impact' },
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/resource-usage-impact' },
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/resource-exhaustion' },
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/load-testing' },
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/recommended-limits' },
                { type: 'doc', id: 'tech-review/day-2-operations/scalability-reliability/resilience-patterns' },
              ],
            },
            {
              label: 'Observability',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-2-operations/observability/signals' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/audit-logging' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/dashboards' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/finops' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/health-parameters' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/workload-detection' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/service-health-validation' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/slos' },
                { type: 'doc', id: 'tech-review/day-2-operations/observability/slis' },
              ],
            },
            {
              label: 'Dependencies',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-2-operations/dependencies/runtime-dependencies' },
                { type: 'doc', id: 'tech-review/day-2-operations/dependencies/lifecycle-policy' },
                { type: 'doc', id: 'tech-review/day-2-operations/dependencies/source-composition-analysis' },
              ],
            },
            {
              label: 'Troubleshooting',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-2-operations/troubleshooting/component-failure-recovery' },
                { type: 'doc', id: 'tech-review/day-2-operations/troubleshooting/known-failure-modes' },
              ],
            },
            {
              label: 'Compliance',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-2-operations/compliance/third-party-attribution' },
                { type: 'doc', id: 'tech-review/day-2-operations/compliance/cncf-attribution' },
              ],
            },
            {
              label: 'Security',
              type: 'category',
              items: [
                { type: 'doc', id: 'tech-review/day-2-operations/security/access-control' },
                { type: 'doc', id: 'tech-review/day-2-operations/security/security-team' },
              ],
            },
          ],
        },
      ],
    },
    //{type: 'autogenerated', dirName: '.'}
  ],
};

export default sidebars;
