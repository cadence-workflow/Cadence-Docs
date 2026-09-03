---
layout: default
title: Installation & Initialization
description: How to install and initialize Cadence.
keywords:
  - cadence installation
  - cadence initialization
  - cadence setup
---

## Installation & Initialization

Cadence has documented installation paths for local development and evaluation, 
including both Docker-based and source-based setups.

For Docker-based installations, the project maintains Docker Compose configurations that 
start the Cadence server together with its required dependencies.

For contributors or users who want to run Cadence directly from source, the Contributor Development Guide documents 
how to build the Cadence binaries, initialize the required persistence schema, and start the Cadence services locally.

Detailed installation instructions are maintained in:

* [Cadence Server Installation](https://cadenceworkflow.io/docs/get-started/server-installation)
* [Docker quickstart and configuration](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md)
* [Contributor development setup](https://github.com/cadence-workflow/cadence/blob/master/CONTRIBUTING.md)

The Docker documentation also covers alternative persistence configurations,
use of released Cadence images, custom configuration, and  manual/production-oriented deployment options.

After the server has started successfully, its installation can be validated
using the Cadence CLI as described in [Validation](./02-validation.md).

Cadence CLI installation and usage are documented in the
[Cadence CLI documentation](https://cadenceworkflow.io/docs/cli).
