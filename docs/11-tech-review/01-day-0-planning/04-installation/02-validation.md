---
layout: default
title: Validation
description: How to validate a Cadence installation.
keywords:
  - cadence validation
  - cadence testing installation
  - cadence verification
---

## Validation

A running Cadence installation can be validated using the Cadence CLI by
registering a test domain and retrieving it again.

For example:

```bash
cadence --domain test-domain domain register
cadence --domain test-domain domain describe
```

A successful response to `domain describe` confirms that the domain exists and
is registered:

```text
Name: test-domain
Status: REGISTERED
```

This provides a simple installation smoke test by confirming that the CLI can
communicate with the Cadence frontend and that domain metadata can be written
to and read from persistence.

Users who want to continue beyond installation/validation and play more, can follow the
[Cadence samples](https://github.com/cadence-workflow/cadence-samples)
