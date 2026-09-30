---
layout: default
title: Cloud Native Security Tenets
description: How Cadence satisfies cloud native security tenets and guides users in adjusting security defaults.
keywords:
  - cadence security tenets
  - cadence secure by default
  - cadence security defaults
---

This page reviews the [Cloud Native Security Tenets](https://github.com/cncf/contribute-site/blob/main/docs/community/tags/security-and-compliance/publications/secure-defaults-cloud-native-8.md) published by TAG Security, describes how Cadence meets them today, and explains how operators loosen security from Cadence's defaults.

## How Cadence satisfies the tenets

| Tenet | Cadence's posture |
| --- | --- |
| 1. Security is a design requirement | [Mutual TLS](/docs/concepts/mutual-tls) and JWT-based authorization ([`common/authorization`](https://github.com/cadence-workflow/cadence/tree/master/common/authorization)) are pluggable components built into the server. |
| 2. Secure configuration has the best UX | Not fully met. TLS and authorization are both off in the stock `config/development.yaml`, so enabling them takes extra configuration. This is a known gap, covered below. |
| 3. Insecure configuration is a conscious decision | Partially met. An operator has to add a `tls:` or `authorization:` block to turn security on, which is the reverse of the tenet's intent (secure by default, with an explicit opt-out). Uber's own production deployments always run with TLS and authorization enabled. |
| 4. Insecure-to-secure transitions are possible | Met. TLS, mTLS, and OAuth authorization can each be enabled independently and incrementally without a breaking migration. The [`NoopAuthorizer`](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/nopAuthorizer.go) can be swapped for the OAuth authorizer without a schema or protocol change. |
| 5. Secure defaults are inherited | Not directly applicable. Cadence does not sit on another cloud native security layer, such as a service mesh, that it inherits defaults from. It manages its own TLS and authorization configuration. |
| 6. Exception lists have first-class support | Partially met. The [`NoopAuthorizer`](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/nopAuthorizer.go) is an explicit, named configuration choice and not a silent fallback, but Cadence does not log when an operator is running in that mode. |
| 7. Secure defaults protect against pervasive exploits | Met for what is enabled. With TLS and OAuth turned on, Cadence enforces certificate validation, JWT signature verification, and JWT TTL bounds (`maxJwtTTL`). None of this applies when the features are left off. |
| 8. Security limitations are explainable | Partially met. The [`common/authorization` README](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/README.md) documents the two authorizer options and their tradeoffs, but there is no consolidated document of known security limitations. |

AuthN and AuthZ are under active development. That work is expected to address tenets 2 and 3 by making secure configuration the default path.

## Loosening security defaults

Cadence ships with transport and application-layer security disabled by default, so operators loosen security by leaving these off:

- Authorization: with no `authorization:` block in the server config, every RPC is allowed, which is equivalent to the explicit [`NoopAuthorizer`](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/nopAuthorizer.go). Enabling it requires configuring [`oauthAuthorizer`](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/README.md) with a JWKS URL or a static public key.
- Transport encryption: with no `tls:` block, connections between clients, services, and datastores are plaintext. See [`common/config/tls.go`](https://github.com/cadence-workflow/cadence/blob/master/common/config/tls.go) and [Mutual TLS](/docs/concepts/mutual-tls).
- Host verification: when TLS is enabled without setting `enableHostVerification`, it defaults to false and server certificate hostname checks are skipped. Set `enableHostVerification: true` for full certificate validation.
- Client certificates: `requireClientAuth` defaults to false, so TLS is one-way and only the server is authenticated. Mutual TLS requires `requireClientAuth: true`.

Cadence has no document written specifically about loosening security. The [`common/authorization` README](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/README.md) and the [Mutual TLS](/docs/concepts/mutual-tls) page describe how to turn each control on, and leaving that configuration out gives the loosened state.

## Related documentation

- [Security Self-Assessment](/docs/tech-review/day-0-planning/security/security-self-assessment)
- [Security Hygiene](/docs/tech-review/day-0-planning/security/security-hygiene)
- [Cloud Native Threat Modeling](/docs/tech-review/day-0-planning/security/threat-modeling)
- [Mutual TLS](/docs/concepts/mutual-tls)
- [`common/authorization` README](https://github.com/cadence-workflow/cadence/blob/master/common/authorization/README.md)
