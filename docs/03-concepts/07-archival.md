---
layout: default
title: Archival
permalink: /docs/concepts/archival
---

# Archival

:archival:Archival: is a feature that automatically moves :workflow: histories (history archival) and visibility records (visibility archival) from persistence to a secondary data store after the retention period, thus allowing users to keep workflow history and visibility records as long as necessary without overwhelming Cadence primary data store. There are two reasons you may consider turning on archival for your domain:
1. **Compliance:** For legal reasons histories may need to be stored for a long period of time.
2. **Debugging:** Old histories can still be accessed for debugging.

The current implementation of the :archival:Archival: feature has two limitations:
1. **RunID Required:** In order to retrieve an archived workflow history, both workflowID and runID are required.
2. **Best Effort:** It is possible that a history or visibility record is deleted from Cadence primary persistence without being archived first. These cases are rare but are possible with the current state of :archival:. Please check the FAQ section for how to get notified when this happens.

## Concepts

- **Archiver:** Archiver is the component that is responsible for archiving and retrieving :workflow: histories and visibility records.  Its interface is generic and supports different kinds of :archival: locations: local file system, S3, Kafka, etc. Check [this README](https://github.com/cadence-workflow/cadence/blob/master/common/archiver/README.md) if you would like to add a new archiver implementation for your data store.
- **URI:** An URI is used to specify the :archival: location. Based on the scheme part of an URI, the corresponding archiver will be selected by the system to perform the :archival: operation.

## Configuring Archival

:archival:Archival: is controlled by both :domain: level config and cluster level config. History and visibility archival have separate domain/cluster configs, but they share the same purpose.

### Cluster Level Archival Config

A Cadence cluster can be in one of three :archival: states:
  * **Disabled:** No :archival:archivals: will occur and the archivers will be not initialized on service startup.
  * **Paused:** This state is not yet implemented. Currently setting cluster to paused is the same as setting it to disabled.
  * **Enabled:** :archival:Archivals: will occur.

Enabling the cluster for :archival: simply means workflow histories will be archived. There is another config which controls whether archived histories or visibility records can be accessed. Both configs have defaults defined in the static yaml and can be overwritten via dynamic config. Note, however, dynamic config will take effect only when :archival: is enabled in static yaml.

### Domain Level Archival Config

A :domain: includes two pieces of :archival: related config:
  * **Status:** Either enabled or disabled. If a :domain: is in the disabled state, no :archival:archivals: will occur for that :domain:.
  * **URI:** The scheme and location where histories or visibility records will be archived to. When a :domain: enables :archival: for the first time URI is set and can never be changed. If URI is not specified when first enabling a :domain: for :archival:, a default URI from the static config will be used.

## Running Locally

You can follow the steps below to run and test the :archival: feature locally:
1. `./cadence-server start`
2. `./cadence --do samples-domain domain register --gd false --history_archival_status enabled --visibility_archival_status enabled --retention 0`
3. Run the [helloworld cadence-sample](https://github.com/cadence-workflow/cadence-samples) by following the README
4. Copy the workflowID the completed :workflow: from log output
5. Retrieve runID through archived visibility record `./cadence --do samples-domain wf listarchived -q 'WorkflowID = "<workflowID>"'`
6. Retrieve archived history `./cadence --do samples-domain wf show --wid <workflowID> --rid <runID>`

In step 2, we registered a new :domain: and enabled both history and visibility :archival: feature for that :domain:. Since we didn't provide an :archival: URI when registering the new :domain:, the default URI specified in `config/development.yaml` is used. The default URI is `file:///tmp/cadence_archival/development` for history archival and `"file:///tmp/cadence_vis_archival/development"` for visibility archival. You can find the archived :workflow: history under the `/tmp/cadence_archival/development` directory and archived visibility record under the `/tmp/cadence_vis_archival/development` directory.

## Running in Production
Cadence supports uploading workflow histories to Google Cloud and Amazon S3 for archival in production.
Check documentation in [GCloud archival component](https://github.com/cadence-workflow/cadence/tree/master/common/archiver/gcloud) and [S3 archival component](https://github.com/cadence-workflow/cadence/tree/master/common/archiver/s3store).

Below is an example of Amazon S3 archival configuration:
```yaml
archival:
  history:
    status: "enabled"
    enableRead: true
    provider:
      s3store:
        region: "us-east-2"
  visibility:
    status: "enabled"
    enableRead: true
    provider:
      s3store:
        region: "us-east-2"
domainDefaults:
  archival:
    history:
      status: "enabled"
      URI: "s3://put-name-of-your-s3-bucket-here"
    visibility:
      status: "enabled"
      URI: "s3://put-name-of-your-s3-bucket-here" # most proably the same as the previous URI
```

## FAQ

### When does archival happen?
In theory, we would like both history and visibility archival happen after workflow closes and retention period passes. However, due to some limitations in the implementation, only history archival happens after the retention period, while visibility archival happens immediately after workflow closes. Please treat this as an implementation details inside Cadence and do not relay on this fact. Archived data should only be checked after the retention period, and we may change the way we do visibility archival in the future.

### What's the query syntax for visibility archival?
The `listArchived` CLI command and API accept a SQL-like query for retrieving archived visibility records, similar to how the `listWorkflow` command works. Unfortunately, since different Archiver implementations have very different capability, there's currently no universal query syntax that works for all Archiver implementations. Please check the README (for example, [S3](https://github.com/cadence-workflow/cadence/tree/master/common/archiver/s3store) and [GCP](https://github.com/cadence-workflow/cadence/tree/master/common/archiver/gcloud)) of the Archiver used by your domain for the supported query syntax and limitations.

### How does archival interact with global domains?
If you have a global domain, when :archival: occurs it will first run on the active cluster and some time later it will run on the standby cluster when replication happens.
For history archival, Cadence will check if upload operation has been performed and skip duplicate efforts.
For visibility archival, there's no such check and duplicated visibility records will be uploaded. Depending on the Archiver implementation, those duplicated upload may consume more space in the underlying storage and duplicated entries may be returned.

### Can I specify multiple archival URIs?
Each :domain: can only have one URI for history :archival: and one URI for visibility :archival:. Different :domain:domains:, however, can have different URIs (with different schemes).

### How does archival work with PII?
No cadence :workflow: should ever operate on clear text PII. Cadence can be thought of as a database and just as one would not store PII in a database PII should not be stored in Cadence. This is even more important when :archival: is enabled because these histories can be kept forever.

## Planned Future Work
* Support retriving archived workflow histories without providing runID.
* Provide guarantee that no history or visibility record is deleted from primary persistence before being archived.
* Implement **Paused** state. In this state no :archival:archivals: will occur but histories or visibility record also will not be deleted from persistence.
Once enabled again from paused state, all skipped :archival:archivals: will occur.
