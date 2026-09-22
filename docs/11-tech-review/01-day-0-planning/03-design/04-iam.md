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

Every user-facing request enters through Frontend. History, Matching, and Cadence's own internal Worker service (archival, replication, scanners) are not client APIs. **Application workers** are separate processes you run; they host workflow and activity code and poll Frontend for tasks.

| Caller | Typical identity | How it reaches Frontend |
| --- | --- | --- |
| Language SDKs and application workers | Service identity via [mutual TLS](/docs/concepts/mutual-tls). The [Go](https://github.com/cadence-workflow/cadence-go-client/blob/036e70300a20bafa247c8fb335dc46d7c52daa35/internal/client.go#L418) and [Java](https://github.com/cadence-workflow/cadence-java-client/blob/c4d82a268737eff2e5c24df07ef9f189375b75ce/src/main/java/com/uber/cadence/serviceclient/ClientOptions.java#L81) clients can also set an `AuthorizationProvider` that attaches a `cadence-authorization` header on each RPC. | gRPC (or TChannel) long poll and RPC |
| [CLI](/docs/cli) | JWT (`--jwt` or `--jwt-private-key`) and optional TLS client cert | Same Frontend ports as SDKs |
| [Cadence Web](https://github.com/cadence-workflow/cadence-web) | JWT in the `cadence-authorization` cookie when the `jwt` auth strategy is enabled | gRPC to Frontend on behalf of the browser session |
| Internal Cadence services (the Worker service[^worker-service], cross-cluster replication) | JWT minted from a configured private key | Outbound RPC to Frontend, with the token attached as the `cadence-authorization` header |
| Humans | Whatever the organization's IdP already is | Through Web, CLI, or an SDK wrapper the platform team provides |

[^worker-service]: The **Worker service** is a Cadence server role (archival, scanners, replication), not an application worker. Application workers are processes you run: they host workflow and activity code and poll Frontend for tasks.

Cadence never dials into application workers. Those workers connect as **clients** of Frontend, which is why they can run in private networks. See [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements#worker-and-client-requirements).

## Authentication

Cadence does not run login, SSO, or a user directory. **Authentication** (who the caller is) happens before traffic reaches Frontend: an IdP, mTLS certificates, or a gateway the adopter already operates. Something in that path must put credentials on each request (a JWT header, a cookie, a client cert) so Frontend has claims to evaluate. If no credentials are present, authorization decides what to do with an empty request.

**Transport** is the Cadence-side check that can actually authenticate a peer. TLS is configurable on client-to-Frontend, inter-service, replication, and datastore connections. Mutual TLS is documented for SDK clients: both sides present certificates, so the cluster can require a known client cert before any RPC is accepted. Certificate issuance and rotation stay with the adopter's CA. A runnable setup is in the [mTLS sample](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/client_tls).

The JWT path described next is **authorization**. The shipped OAuth authorizer checks that a token is well-formed, signed, and not expired. It does not, by itself, answer who the caller is beyond whatever claims the issuer put in the token.

## Authorization

Authorization runs as a wrapper around Frontend's client and admin APIs. Each call is turned into a small attribute set (API name, domain, permission, task list when present, and a request body with payloads stripped for logging) and handed to an `Authorizer`. The result is allow or deny. Deny surfaces to the client as an access-denied error and is counted on Frontend authorization metrics.

The `Authorizer` interface is the plugin point. Adopters can supply their own implementation that reads whatever credential is already on the wire and asks a central policy engine. That is the usual path when tokens are minted only in the network layer and application code has no `AuthorizationProvider` to get or sign them.

Out of the box, Cadence ships two authorizers:

- **No-op**, the local and proof-of-concept default. Every request is allowed, so a laptop cluster does not require an IdP.
- **OAuth**, enabled with `authorization.oauthAuthorizer.enable`. Frontend reads a JWT from the `cadence-authorization` RPC header and verifies **RS256** tokens either with an **internal** key pair (CLI, Go admin JWT helper, and internal services sign with the matching private key; issuer `internal-jwt`) or with an **external** identity provider (JWKS URL, with groups and an admin flag extracted via [JMESPath](https://jmespath.org/)). Tokens must expire, and remaining lifetime cannot exceed a configured maximum TTL. Missing, expired, over-TTL, or invalid tokens are denied.

The OAuth authorizer maps an allow or deny onto **domain-scoped groups** stored in domain data, plus one cluster-wide escape hatch:

| Permission | What it covers | Domain data key |
| --- | --- | --- |
| Read | Describe, list, history, query, and similar inspect APIs | `READ_GROUPS` |
| Write | Start, signal, cancel, terminate, reset, schedule mutations, and domain failover | `WRITE_GROUPS` |
| Process | Poll for decision and activity tasks | `PROCESS_GROUPS` |
| Admin | Register, update, deprecate, and delete domain, and most admin RPCs | JWT `Admin` claim, or write-group membership for the domain-admin APIs |

A token with `Admin: true` is allowed for every API. Otherwise the token's groups (space-separated) must intersect the groups listed on the target domain. Write groups are included in every check, so a write group can also read and process on that domain.

This is group-based access at **domain** granularity, which is the same isolation boundary Cadence uses for retention, archival, and replication. It is not a per-workflow ACL. Poll APIs also put the **task list** on the attribute object. The shipped OAuth authorizer still decides process permission from domain groups, so one team's application workers are not isolated from another team's task lists unless those lists live in different domains or a **custom Authorizer** uses the task list field to deny the poll.

Admin RPCs that are not tied to a domain still go through the same wrapper. Most of them require admin permission, so they are effectively cluster-operator operations.

## Where this sits relative to the rest of the stack

Domains are the authorization unit, not a physical tenancy wall: Two teams on the same cluster can be denied each other's APIs by group membership and still share the same datastore. Task-list checks, when a custom authorizer implements them, further limit which queues an application worker may poll inside a domain. When two workloads must not share storage or a trust boundary, the mechanism is separate clusters. That distinction is on [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty#domains-are-a-logical-boundary-not-a-physical-one).

Infrastructure IAM is complementary: The [Helm chart](https://github.com/cadence-workflow/cadence-charts) ships Kubernetes RBAC, network policy, and service account templates for the pods themselves. Datastore credentials, cloud IAM for S3 or GCS archival, and SASL for Kafka are configured on those backends. None of that is a substitute for Frontend authorization, and Frontend authorization is not a substitute for locking down those backends.

The Web UI is a client, not a second control plane: Cadence Web talks to Frontend with the same APIs as the CLI. Its JWT strategy is optional and disabled by default; when enabled, the browser holds a `cadence-authorization` cookie and Cadence Web forwards it. Batch actions in the UI can be scoped to everyone, domain admins, or users with write access, still against the same Frontend checks.

## What adopters own

Cadence supplies the Frontend enforcement point, the `Authorizer` plugin interface, the shipped no-op and OAuth authorizers, domain group keys, mTLS, and client hooks (CLI flags, Web cookie, Go and Java `AuthorizationProvider`, internal-service token injection). Adopters still need to supply:

- An **authentication** source in front of every ingress (CLI, Web, SDKs, application workers), so each request already carries credentials
- A **way to pass those credentials** onto the wire (JWT header, cookie, mTLS client cert, or a network-layer token the custom authorizer knows how to read)
- An **authorization** decision: either enable the OAuth authorizer and map groups on each domain, or plug in a custom `Authorizer`

A platform team typically wires the organization's IdP to application workers, CLI users, and Cadence Web, sets `READ_GROUPS` / `WRITE_GROUPS` / `PROCESS_GROUPS` on each domain (or equivalent rules in a custom authorizer), and keeps cluster-admin tokens to a small operator set. That is the production IAM shape Cadence is built for.

## Related documentation

- [Mutual TLS](/docs/concepts/mutual-tls)
- [CLI](/docs/cli)
- [Architecture requirements](/docs/tech-review/day-0-planning/design/architecture-requirements)
- [Production integrations](/docs/tech-review/day-0-planning/usability/production-integrations)
- [Sovereignty](/docs/tech-review/day-0-planning/design/sovereignty)
- [Compliance requirements](/docs/tech-review/day-0-planning/design/compliance-requirements)
- [Access control](/docs/tech-review/day-2-operations/security/access-control)
- [Deployment topology](/docs/concepts/topology)
