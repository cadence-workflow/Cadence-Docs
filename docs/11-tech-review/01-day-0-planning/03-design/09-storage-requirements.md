---
layout: default
title: Storage Requirements
description: Cadence storage requirements including ephemeral and persistent storage usage.
keywords:
  - cadence storage
  - cadence persistent storage
  - cadence ephemeral storage
---

Cadence services are stateless. All persistent state lives in external stores that you provide and operate.

## Ephemeral storage

Cadence services keep nothing on local disk and need no persistent volumes, so any instance can be replaced without data loss.

## Persistent storage

Storage grows with the number of history events, their payload size, and how long closed workflows are kept, which each domain's retention period controls. See [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty) for what each store contains and how retention and deletion work.

### Execution (main storage)

Every cluster needs a main database, which holds workflow history, mutable state, task lists, and domains. Cadence needs strong consistency from it, so it must connect to the primary rather than a read replica. Each Cadence process opens its own connection pool (`maxConns`), so total database connections grow with the number of instances.

| Database | Supported versions |
| --- | --- |
| Apache Cassandra | 4.1 |
| MySQL | 8.0 |
| PostgreSQL | 17.4 |

See [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility) for how these versions are tested.

When the main database is slow or down, History shards can't renew their ownership leases and shut down. Workflows on those shards stop progressing, and API calls return errors or time out. When the database recovers, Cadence takes the shards back automatically and workflows continue from their last saved state.

### Visibility

Visibility records let you list and search workflows. Basic visibility keeps them in the main database or a separate one. [Advanced visibility](/docs/concepts/search-workflows) adds custom search attributes. It needs a search store plus Kafka, which carries visibility records from History to the Worker service that indexes them.

| Storage | Used for | Supported versions |
| --- | --- | --- |
| Main database | Basic visibility | Same as execution |
| OpenSearch | Advanced visibility | 2.x |
| Elasticsearch | Advanced visibility | 6.8 and 7.9 |
| Apache Pinot | Advanced visibility | 1.x |
| Apache Kafka | Advanced visibility transport | 3.7 |

A Kafka or search store outage doesn't stop workflows. History writes visibility records in background tasks and retries them until they succeed, so list and search results fall behind until the store recovers. The Worker service retries indexing and leaves Kafka messages unacknowledged until they are indexed.

### Blobstore

[Archival](/docs/concepts/archival) is optional. When enabled, Cadence copies visibility records to the blobstore when a workflow closes, and histories when retention expires.

| Blobstore | Archival URI scheme |
| --- | --- |
| Filestore (local or shared filesystem) | `file://` |
| Amazon S3 | `s3://` |
| Google Cloud Storage | `gs://` |

A blobstore outage stops archiving, and archived workflows can't be read until it ends. Archiving retries for a limited time and doesn't hold back retention, so records from a long outage may not be archived. See [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty#retention-and-deletion).

## Cross-cluster replication

Storage needs no replication between clusters. Each cluster keeps its own database, visibility store, and blobstore, and Cadence replicates workflow data between clusters itself. See [cross-DC replication](/docs/concepts/cross-dc-replication).

## Backups

Cadence has no built-in backup. Use the backup tools for your database and, if you use advanced visibility, your search store.

## Related documentation

- [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Service dependencies](/docs/tech-review/day-0-planning/design/service-dependencies)
- [Resource requirements](/docs/tech-review/day-0-planning/design/resource-requirements)
- [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility)
- [Search workflows](/docs/concepts/search-workflows)
- [Archival](/docs/concepts/archival)
- [Cross-DC replication](/docs/concepts/cross-dc-replication)
- [Cadence server persistence docs](https://github.com/cadence-workflow/cadence/blob/master/docs/persistence.md)
