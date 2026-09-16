---
layout: default
title: Identity & Access Management
description: How Cadence implements Identity and Access Management.
keywords:
  - cadence iam
  - cadence identity
  - cadence access management
  - cadence authentication
  - cadence authorization
---

Cadence is not an identity provider. It does not store users, issue passwords, or broker SSO. Callers arrive at the Frontend already holding credentials the adopter issued, and Cadence decides whether that caller may run a given API on a given domain.

Identity lives in the organization's existing directory, certificates, or token issuer. Access control lives in Cadence as a **policy enforcement point** on Frontend, with a pluggable **authorizer** as the decision point. Related pages: [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements) for where Frontend sits, [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty) for where data lives, [Compliance requirements](/docs/tech-review/day-0-planning/design/compliance-requirements) for how this maps to program controls, and Day 2 [access control](/docs/tech-review/day-2-operations/security/access-control) for operating it.

## Who talks to Cadence, and how they identify

Every user-facing request enters through Frontend. History, Matching, and the internal Worker are not client APIs.

| Caller | Typical identity | How it reaches Frontend |
| --- | --- | --- |
| Language SDKs and workers | Service identity via [mutual TLS](/docs/concepts/mutual-tls), application identity via JWT | gRPC (or TChannel) long poll and RPC |
| [CLI](/docs/cli) | JWT (`--jwt` or `--jwt-private-key`) and optional TLS client cert | Same Frontend ports as SDKs |
| [Cadence Web](https://github.com/cadence-workflow/cadence-web) | JWT in the `cadence-authorization` cookie when the `jwt` auth strategy is enabled | gRPC to Frontend on behalf of the browser session |
| Internal Cadence services (Worker, cross-cluster replication) | JWT minted from a configured private key | Outbound RPC to Frontend, with the token attached as the `cadence-authorization` header |
| Humans | Whatever the organization's IdP already is | Through Web, CLI, or an SDK wrapper the platform team provides |

Cadence never dials into workers. Workers authenticate as **clients** of Frontend, which is why they can run in private networks. See [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#worker-and-client-requirements).

## Authentication

Two independent layers are available:

**Transport.** TLS is configurable on client-to-Frontend, inter-service, replication, and datastore connections. Mutual TLS is documented for SDK clients: both sides present certificates, so the cluster can require a known client cert before any RPC is accepted. Certificate issuance and rotation stay with the adopter's CA. A runnable setup is in the [mTLS sample](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/client_tls).

**Application.** When the OAuth authorizer is enabled, Frontend reads a JWT from the `cadence-authorization` RPC header. The shipped authorizer verifies **RS256** tokens in two ways:

- An **internal** key pair. The cluster holds the public key; the CLI, Go admin JWT helper, and internal services sign with the matching private key. These tokens use the issuer `internal-jwt`.
- An **external** identity provider. The authorizer fetches signing keys from a JWKS URL and extracts groups and an admin flag with [JMESPath](https://jmespath.org/) expressions against the token claims. The development config comments show this against a generic OIDC provider.

Tokens must expire, and remaining lifetime cannot exceed a configured maximum TTL. Missing, expired, over-TTL, or invalid tokens are denied.

When the OAuth authorizer is **not** enabled, Frontend uses a no-op authorizer that allows every request. That is the local and proof-of-concept default, so a laptop cluster does not require an IdP. Production clusters that need API authorization turn the OAuth authorizer on.

## Authorization

Authorization runs as a wrapper around Frontend's client and admin APIs. Each call is turned into a small attribute set (API name, domain, permission, and a request body with payloads stripped for logging) and handed to an `Authorizer`. The result is allow or deny. Deny surfaces to the client as an access-denied error and is counted on Frontend authorization metrics.

The shipped OAuth authorizer maps that decision onto **domain-scoped groups** stored in domain data, plus one cluster-wide escape hatch:

| Permission | What it covers | Domain data key |
| --- | --- | --- |
| Read | Describe, list, history, query, and similar inspect APIs | `READ_GROUPS` |
| Write | Start, signal, cancel, terminate, reset, schedule mutations, and domain failover | `WRITE_GROUPS` |
| Process | Poll for decision and activity tasks | `PROCESS_GROUPS` |
| Admin | Register, update, deprecate, and delete domain, and most admin RPCs | JWT `Admin` claim, or write-group membership for the domain-admin APIs |

A token with `Admin: true` is allowed for every API. Otherwise the token's groups (space-separated) must intersect the groups listed on the target domain. Write groups are included in every check, so a write group can also read and process on that domain.

This is group-based access at **domain** granularity, which is the same isolation boundary Cadence uses for retention, archival, and replication. It is not a per-workflow ACL, and the shipped authorizer does not make a decision from task list or workflow type even though those fields exist on the attribute object for a custom authorizer.

Admin RPCs that are not tied to a domain still go through the same wrapper. Most of them require admin permission, so they are effectively cluster-operator operations.

## Where this sits relative to the rest of the stack

**Domains are the authorization unit, not a physical tenancy wall.** Two teams on the same cluster can be denied each other's APIs by group membership and still share the same datastore. When two workloads must not share storage or a trust boundary, the mechanism is separate clusters. That distinction is on [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty#domains-are-a-logical-boundary-not-a-physical-one).

**Infrastructure IAM is complementary.** The [Helm chart](https://github.com/cadence-workflow/cadence-charts) ships Kubernetes RBAC, network policy, and service account templates for the pods themselves. Datastore credentials, cloud IAM for S3 or GCS archival, and SASL for Kafka are configured on those backends. None of that is a substitute for Frontend authorization, and Frontend authorization is not a substitute for locking down those backends.

**The Web UI is a client, not a second control plane.** Cadence Web talks to Frontend with the same APIs as the CLI. Its JWT strategy is optional and disabled by default; when enabled, the browser holds a `cadence-authorization` cookie and Cadence Web forwards it. Batch actions in the UI can be scoped to everyone, domain admins, or users with write access, still against the same Frontend checks.

## What adopters own

Cadence supplies the enforcement point, the JWT verification, the domain group keys, mTLS, and the client hooks (CLI flags, Web cookie, Go admin JWT provider, internal-service token injection). Adopters supply the identity source, the mapping of people and services onto groups, the certificates, and the decision of when the no-op authorizer is acceptable.

A platform team typically wires the organization's IdP (or an internal JWT minting service) to workers, CLI users, and Cadence Web, sets `READ_GROUPS` / `WRITE_GROUPS` / `PROCESS_GROUPS` on each domain, and keeps cluster-admin tokens to a small operator set. That is the production IAM shape Cadence is built for.

## Related documentation

- [Mutual TLS](/docs/concepts/mutual-tls)
- [CLI](/docs/cli)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty)
- [Compliance requirements](/docs/tech-review/day-0-planning/design/compliance-requirements)
- [Access control](/docs/tech-review/day-2-operations/security/access-control)
- [Deployment topology](/docs/concepts/topology)
