---
layout: default
title: Security Hygiene
description: Frameworks, practices, and procedures Cadence uses to maintain project security health.
keywords:
  - cadence security hygiene
  - cadence security practices
  - cadence vulnerability management
---

## Frameworks, practices, and procedures

Cadence maintains basic project health and security with contribution controls, automated CI gates, and vulnerability monitoring. Across all cadence-workflow projects:

- Contribution controls: every commit needs a [Developer Certificate of Origin](https://github.com/cadence-workflow/cadence/blob/master/.github/dco.yml) sign-off, PR titles must follow [Conventional Commits](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/semantic-pr.yml), and branch protection requires approving reviews, with force pushes blocked. The [`CODEOWNERS`](https://github.com/cadence-workflow/cadence/blob/master/.github/CODEOWNERS) file lists all maintainers as owners of the whole repository.
- Static analysis: `make lint` (`go vet` plus staticcheck-style linters) runs in CI on every PR via [`ci-checks.yml`](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/ci-checks.yml).
- Vulnerability scanning: Cadence uses [Snyk](https://snyk.io/) to scan dependencies for known CVEs, check licenses, scan container images, and analyze the Go source (Snyk Code). It also opens remediation pull requests. The project disabled GitHub's Dependabot because its default alerting threshold was too noisy. Snyk is currently tuned to raise PRs only for critical-severity vulnerabilities.
- Vulnerability disclosure: security issues are reported privately through [GitHub Security Advisories](https://github.com/cadence-workflow/cadence/security/advisories) under the project's [security policy](https://github.com/cadence-workflow/cadence/security/policy). Security fixes are backported to releases from the last two years.

Within the cadence-workflow/cadence repository:
- Dependency freshness: the [`fresh-go-deps-check`](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/fresh-go-deps-check.yml) workflow blocks pull requests that pin a Go module dependency published too recently. This reduces exposure to compromised or unvetted releases that land right after publication.

Cadence does not currently run `govulncheck`, CodeQL, or OpenSSF Scorecard in CI, and does not publish an SBOM. These are known gaps and are not on the roadmap today.

## Evaluating feature risk if unmaintained

The project has no formal, documented process for deciding which features become a security risk if they go unmaintained. Maintainers handle this case by case, through review during PR discussion and through deprecation notices in [`RELEASES.md`](https://github.com/cadence-workflow/cadence/blob/master/RELEASES.md) when a feature or configuration path is phased out. A more structured process, such as explicitly flagging experimental config options and legacy persistence or authorization paths, is a candidate for future work alongside the AuthN and AuthZ hardening described on [Cloud Native Security Tenets](/docs/tech-review/day-0-planning/security/security-tenets).

## Related documentation

- [Security Self-Assessment](/docs/tech-review/day-0-planning/security/security-self-assessment)
- [Cloud Native Security Tenets](/docs/tech-review/day-0-planning/security/security-tenets)
- [Cloud Native Threat Modeling](/docs/tech-review/day-0-planning/security/threat-modeling)
- [Security policy](https://github.com/cadence-workflow/cadence/security/policy)
