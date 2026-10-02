---
layout: default
title: Cloud Native Threat Modeling
description: Cadence least privilege requirements, certificate rotation, and secure software supply chain practices.
keywords:
  - cadence threat modeling
  - cadence least privilege
  - cadence certificate rotation
  - cadence supply chain security
---

## Least privilege

Cadence's privilege model has two layers.

- API authorization: when the [OAuth authorizer](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/README.md) is enabled, access is scoped per domain and not cluster-wide. A caller's JWT `groups` claim determines which domains and operations it can act on, and administrative operations (for example, domain create, update, and failover) require a separate `admin` claim. Without the OAuth authorizer, the [`NoopAuthorizer`](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/nopAuthorizer.go) grants unrestricted access. See [Cloud Native Security Tenets](/docs/tech-review/day-0-planning/security/security-tenets) for the tradeoff of shipping with it off by default.
- Process privilege: the official [Docker images](https://github.com/cadence-workflow/cadence/blob/master/Dockerfile) run as a non-root `cadence` user by default (the `alpine-nonroot` base stage), which limits the impact of a container compromise.

Cadence does not manage the credentials it uses to reach its dependencies. The server holds credentials for its persistence layer (Cassandra, MySQL, PostgreSQL) and, when archival is enabled, for a blobstore (S3, GCS, or filestore). Operators are responsible for scoping those credentials to what the server needs, for example by avoiding a database superuser account. Cadence neither prescribes nor enforces this today.

## Certificate rotation

TLS certificates are loaded once at process startup. [`common/config/tls.go`](https://github.com/cadence-workflow/cadence/blob/master/common/config/tls.go) calls `tls.LoadX509KeyPair` on the configured `certFile` and `keyFile`, and nothing watches those files afterward. Rotating a certificate therefore means restarting the process, typically with a rolling deploy, so it picks up the new files. 

## Secure software supply chain

This section follows the five stages of the [CNCF Software Supply Chain Best Practices](https://project.linuxfoundation.org/hubfs/CNCF_SSCP_v1.pdf) paper. The paper tags each recommendation as moderate or high assurance. Cadence targets the moderate baseline, and the gaps below are measured against it. Practices that the paper reserves for high assurance, such as reproducible builds and offline roots of trust, are not implemented and are not listed individually.

### Source code

- Every commit needs a DCO sign-off ([`.github/dco.yml`](https://github.com/cadence-workflow/cadence/blob/master/.github/dco.yml)). This is an attestation of origin, not a cryptographic signature, and the project does not require GPG or SSH signed commits.
- Branch protection on `master` requires approving reviews and blocks force pushes. The [`CODEOWNERS`](https://github.com/cadence-workflow/cadence/blob/master/.github/CODEOWNERS) file lists all maintainers as owners of the whole repository.
- The cadence-workflow GitHub organization requires multi-factor authentication for members.
- CI runs `golangci-lint` on every PR, and Snyk Code performs static analysis of the Go source.
- No secret scanner runs in CI. Maintainer credential practices (SSH keys, key rotation, short-lived tokens) are managed through GitHub and are not documented by the project.

### Materials

- Dependencies are Go modules pinned by `go.sum` checksums and compiled from source during the build.
- The [`fresh-go-deps-check`](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/fresh-go-deps-check.yml) workflow rejects PRs that pin dependencies published too recently for the community to have vetted them.
- [Snyk](https://snyk.io/) scans dependencies for known CVEs, checks licenses, and scans container images. It opens PRs for critical-severity CVEs only, as described on [Security Hygiene](/docs/tech-review/day-0-planning/security/security-hygiene). Other dependency updates arrive through ordinary PRs.
- Cadence does not maintain a dependency inventory (such as OWASP Dependency-Track) and does not vendor modules or mirror them in an internal registry.
- The base images (`golang` and `alpine`) are prebuilt Docker Hub images referenced by tag, not by digest.

### Build pipelines

- Builds run in [GitHub Actions](https://github.com/cadence-workflow/cadence/tree/master/.github/workflows) on GitHub-hosted runners, which GitHub provisions fresh for each job. Pipelines are defined as code in the repository.
- The Docker images use multi-stage builds and run as a non-root user (see [Least privilege](#least-privilege)).
- Third-party GitHub Actions are pinned by major version tag (for example `actions/checkout@v4`), not by commit SHA. Most workflows do not declare a `permissions:` block, so they run with the repository's default token permissions.
- Dockerfile `FROM` lines are not pinned by digest.
- These are known gaps and there are no committed plans to close them.

### Artefacts

Cadence does not generate a Software Bill of Materials (SBOM), sign container images or other artifacts, or publish build provenance attestations (for example with Sigstore/cosign or SLSA). The `docker/build-push-action` steps in [`docker_publish.yml`](https://github.com/cadence-workflow/cadence/blob/master/.github/workflows/docker_publish.yml) set no provenance or SBOM options. These are known gaps and are not on the roadmap today.

### Deployments

Images are published to Docker Hub by the Cadence server workflow when a GitHub release is published, using a Docker Hub username and access token stored as GitHub Actions secrets. Because nothing is signed or attested, users cannot cryptographically verify an image or its freshness before deploying it. Users who need that assurance can pin images by digest and verify them against their own build.

Release automation differs by repository. The Cadence server images and the Go client are released entirely through GitHub Actions. The Python and Java clients have partly manual release steps.

## Related documentation

- [Security Self-Assessment](/docs/tech-review/day-0-planning/security/security-self-assessment)
- [Cloud Native Security Tenets](/docs/tech-review/day-0-planning/security/security-tenets)
- [Security Hygiene](/docs/tech-review/day-0-planning/security/security-hygiene)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [`common/authorization` README](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/README.md)
