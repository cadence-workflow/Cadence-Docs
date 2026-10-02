---
layout: default
title: Release Processes
description: Cadence release processes for major, minor, and patch releases.
keywords:
  - cadence release process
  - cadence versioning
  - cadence release cadence
permalink: /docs/tech-review/day-0-planning/design/release-processes
---

Cadence publishes stable versions as GitHub Releases. The server, language SDKs, Helm chart, and Web UI have independent versions and release schedules. Review the release notes for every component that you upgrade.

The server uses one pipeline for every official release. Maintainers publish the scope in a tracking issue, tag merged commits as prereleases, and verify those builds in Uber production clusters. They then announce in CNCF Slack that the release is coming and open the tracking issue for the following release. After that, they publish the verified commit with release notes and announce that the release is out.

## Version numbers

Server versions use the `vMAJOR.MINOR.PATCH` form, but the numbers are coarser than strict [semantic versioning](https://semver.org). Every official release, including one that only changes the last number, is a feature release. Prereleases are the small, incremental builds between official releases.

| Kind | Example | What it contains |
| --- | --- | --- |
| **Major** | [`v1.0.0`](https://github.com/cadence-workflow/cadence/releases/tag/v1.0.0) | A new version line. Expect breaking changes. Make sure you carefully read the release notes for upgrade. Current server releases are on the 1.x line. |
| **Minor** | [`v1.4.0`](https://github.com/cadence-workflow/cadence/releases/tag/v1.4.0) | A larger milestone, such as a major new capability or a broad cleanup of deprecated configuration. |
| **Patch** | [`v1.4.1`](https://github.com/cadence-workflow/cadence/releases/tag/v1.4.1) | A full feature release. It usually contains new features, bug fixes, and performance work, and can require schema or configuration changes. Treat it as at least a semantic-versioning minor upgrade. |
| **Prerelease** | `v1.4.1-prerelease33` | An incremental build from `master`, verified in production before an official release. Consecutive prereleases are usually a small set of commits apart. |

Because the last number already covers a feature release, read the release notes for every official upgrade. They list migration steps such as schema updates or new configuration, whichever number changed.

The gap between official releases follows the scope of the tracking issue and how many prereleases it takes to verify the build.

Schema and public-interface changes go through the repository's [breaking-change review](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/breaking_change_pr_template.md). Major or controversial feature deprecations can require a Technical Steering Committee decision. See [Deprecations and removals](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/deprecations) and [governance](/community/governance).

## How a server release is cut

### 1. Open a tracking issue

Maintainers open a release-tracking issue in the open-source repository and link the features and bug fixes planned for the next version. Each item stays in its own issue. The tracking issue is the heads-up: users can see the intended scope while the changes are still landing on `master`.

Users comment on the tracking issue to request a feature or fix, or to link an issue they already opened. Maintainers use the same issue to keep the planned scope current.

[Release Tracking: Cadence v1.4.2](https://github.com/cadence-workflow/cadence/issues/8300) is an example. It is labeled [`release-operation`](https://github.com/cadence-workflow/cadence/issues?q=label%3Arelease-operation) and lists planned features and bug fixes separately.

### 2. Tag prereleases and verify them in production

Changes merge to `master` through normal pull-request review. Once a candidate set of commits is on `master`, maintainers tag that commit as a prerelease. Tag names look like `v1.4.1-prerelease33` and [`v1.2.19-prerelease07`](https://github.com/cadence-workflow/cadence/releases/tag/v1.2.19-prerelease07).

Maintainers pull that prerelease into Uber, test it, and roll it out to Uber production clusters. The rollout moves from development and staging into production, higher-tier clusters first. A release often takes several prereleases. Each later tag points at a newer commit on `master`. Earlier prerelease tags stay in the repository as the record of those candidates.

[Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing) describes that staged rollout, including the scale of the clusters involved.

### 3. Announce that the release is coming and open the next tracking issue

Once a prerelease is verified, maintainers announce in [CNCF Slack `#cadence-users`](https://inviter.co/cncf) that the official release is coming. [Join the CNCF Slack workspace](https://inviter.co/cncf) and open `#cadence-users` to see these posts and ask questions.

With that announcement, they open a new release-tracking issue for the following version and start linking the features and bug fixes planned for it. That issue is the scope list for the next cycle, in the same form as [Release Tracking: Cadence v1.4.2](https://github.com/cadence-workflow/cadence/issues/8300).

### 4. Promote the verified build and publish release notes

Maintainers tag that same verified commit as the official release and write the release notes. The official version number is chosen at that point. It can keep the prerelease line, as with [`v1.4.1`](https://github.com/cadence-workflow/cadence/releases/tag/v1.4.1) and `v1.4.1-prerelease33` (both commit `3410187`), or move to the next minor, as with [`v1.4.0`](https://github.com/cadence-workflow/cadence/releases/tag/v1.4.0) and `v1.3.7-prerelease34` (both commit `1a42a94`). The prerelease tag remains; the official tag is the version operators adopt.

Release notes are published on [GitHub Releases](https://github.com/cadence-workflow/cadence/releases). They are the written record for that version: migration steps, features, bug fixes, and behavior changes. Deprecations and removals called out there are also described on [Deprecations and removals](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/deprecations).

### 5. Announce that the release is out

After the official release is published, maintainers post again in `#cadence-users` and point to the release notes.

## What to deploy

Pin the official release tag and the container image built for it. Prerelease tags identify builds still moving through production verification. The image workflow publishes version tags for each GitHub Release. See [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility).

## Related documentation

- [Deprecations and removals](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/deprecations)
- [Upgrade and rollback testing](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/upgrade-rollback-testing)
- [Infrastructure compatibility](/docs/tech-review/day-1-installation/rollout-upgrade-rollback/infrastructure-compatibility)
- [Server releases](https://github.com/cadence-workflow/cadence/releases)
