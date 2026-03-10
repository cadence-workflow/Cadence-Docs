---
layout: default
title: Versioning
permalink: /docs/java-client/versioning
---

As outlined in the _Workflow Implementation Constraints_ section, :workflow: code has to be deterministic by taking the same
code path when replaying history :event:events:. Any :workflow: code change that affects the order in which :decision:decisions: are generated breaks
this assumption. The solution that allows updating code of already running :workflow:workflows: is to keep both the old and new code.
When replaying, use the code version that the :event:events: were generated with and when executing a new code path, always take the
new code.

Use the `Workflow.getVersion` function to return a version of the code that should be executed and then use the returned
value to pick a correct branch. Let's look at an example.

```java
public void processFile(Arguments args) {
    String localName = null;
    String processedName = null;
    try {
        localName = activities.download(args.getSourceBucketName(), args.getSourceFilename());
        processedName = activities.processFile(localName);
        activities.upload(args.getTargetBucketName(), args.getTargetFilename(), processedName);
    } finally {
        if (localName != null) { // File was downloaded.
            activities.deleteLocalFile(localName);
        }
        if (processedName != null) { // File was processed.
            activities.deleteLocalFile(processedName);
        }
    }
}
```

Now we decide to calculate the processed file checksum and pass it to upload.
The correct way to implement this change is:

```java
public void processFile(Arguments args) {
    String localName = null;
    String processedName = null;
    try {
        localName = activities.download(args.getSourceBucketName(), args.getSourceFilename());
        processedName = activities.processFile(localName);
        int version = Workflow.getVersion("checksumAdded", Workflow.DEFAULT_VERSION, 1);
        if (version == Workflow.DEFAULT_VERSION) {
            activities.upload(args.getTargetBucketName(), args.getTargetFilename(), processedName);
        } else {
            long checksum = activities.calculateChecksum(processedName);
            activities.uploadWithChecksum(
                args.getTargetBucketName(), args.getTargetFilename(), processedName, checksum);
        }
    } finally {
        if (localName != null) { // File was downloaded.
            activities.deleteLocalFile(localName);
        }
        if (processedName != null) { // File was processed.
            activities.deleteLocalFile(processedName);
        }
    }
}
```

Later, when all :workflow:workflows: that use the old version are completed, the old branch can be removed.

```java
public void processFile(Arguments args) {
    String localName = null;
    String processedName = null;
    try {
        localName = activities.download(args.getSourceBucketName(), args.getSourceFilename());
        processedName = activities.processFile(localName);
        // getVersion call is left here to ensure that any attempt to replay history
        // for a different version fails. It can be removed later when there is no possibility
        // of this happening.
        Workflow.getVersion("checksumAdded", 1, 1);
        long checksum = activities.calculateChecksum(processedName);
        activities.uploadWithChecksum(
            args.getTargetBucketName(), args.getTargetFilename(), processedName, checksum);
    } finally {
        if (localName != null) { // File was downloaded.
            activities.deleteLocalFile(localName);
        }
        if (processedName != null) { // File was processed.
            activities.deleteLocalFile(processedName);
        }
    }
}
```

The ID that is passed to the `getVersion` call identifies the change. Each change is expected to have its own ID. But if
a change spawns multiple places in the :workflow: code and the new code should be either executed in all of them or
in none of them, then they have to share the ID.

## Controlled Version Selection with GetVersionOptions

By default, `Workflow.getVersion` records `maxSupported` as the version when it is called for the first time on a given changeID (i.e., no version is cached yet). `GetVersionOptions` lets you override this behavior, giving operators fine-grained control over which version is recorded on first-write — without deploying new code.

If a version is already cached for the changeID, options are ignored and the cached version is returned.

### Version Selection Priority

When no cached version exists for a changeID, the version to record is selected as follows:

1. `customVersion` is set → use that version
2. `useMinVersion` is `true` → use `minSupported`
3. Default (no options) → use `maxSupported` (original behavior)

### API

There are three ways to use the new options:

**Using `GetVersionOptions` directly:**

```java
int version = Workflow.getVersion(
    "checksumAdded", Workflow.DEFAULT_VERSION, 2,
    GetVersionOptions.executeWithVersion(1));
```

**Using convenience methods:**

```java
// Force a specific version on first-write
int version = Workflow.getVersionWithCustomVersion(
    "checksumAdded", Workflow.DEFAULT_VERSION, 2, 1);

// Force minSupported on first-write
int version = Workflow.getVersionWithMinVersion(
    "checksumAdded", Workflow.DEFAULT_VERSION, 2);
```

### Safe Three-Step Deployment Strategy

These options enable a safe deployment pattern for gradually rolling out new code paths:

**Step 1: Deploy code that supports both versions.**

Deploy :workflow: code that handles both the old and new code paths using `getVersion` with dynamic `GetVersionOptions`. The options are controlled by a configuration or feature flag (e.g., `shouldEnableNewFeature()`), defaulting to `executeWithMinVersion()` so all new :workflow: executions use the old code path.

```java
// Controlled by operator configuration / feature flag
GetVersionOptions options = shouldEnableNewFeature()
    ? GetVersionOptions.executeWithVersion(1)
    : GetVersionOptions.executeWithMinVersion();

int version = Workflow.getVersion("newFeature", 0, 1, options);
if (version == 0) {
    // Old code path (all new workflows go here by default)
    activities.oldProcess();
} else {
    // New code path (not yet activated)
    activities.newProcess();
}
```

**Step 2: Selectively activate the new version.**

Without deploying new code, flip the feature flag (e.g., `shouldEnableNewFeature()`) to return `true` for specific :workflow:workflows: or gradually increase the rollout percentage. Since the dynamic options infrastructure was already deployed in Step 1, this runtime configuration change causes `shouldEnableNewFeature()` to return `true`, selecting `executeWithVersion(1)` and activating the new code path immediately.

**Step 3: Retire the old code.**

Once all old :workflow: executions are complete and the new version is fully rolled out, remove the old branch — just as with standard `getVersion` usage.
