# Cadence docs

[![Build and Deploy](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/publish-to-gh-pages.yml?label=Build%20and%20Deploy)](https://github.com/cadence-workflow/Cadence-Docs/actions/workflows/publish-to-gh-pages.yml)
[![Nightly integration test](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/nightly-integration-test.yml?label=Nightly%20integration%20test)](https://github.com/cadence-workflow/Cadence-Docs/actions/workflows/nightly-integration-test.yml)

[cadenceworkflow.io](https://cadenceworkflow.io) is the documentation site for [Cadence](https://github.com/cadence-workflow/cadence). This repository contains its [Docusaurus](https://docusaurus.io/) source.

> 📚 **Contributing to Cadence?** The [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) covers the project-wide process. For site setup and development, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Quick start

Requires Node.js 22 or newer.

```console
npm install
npm run start
```

The development server runs at http://localhost:3000/ and opens a browser window. Most edits reload without a restart.

To write the static site to `build/` for any static host, run:

```console
npm run build
```

[CONTRIBUTING.md](CONTRIBUTING.md) also covers Node version pinning, npm registry setup, running a production preview before you open a pull request, and adding or moving pages.

## How the site is deployed

The live site is published by the **Build and Deploy** workflow ([`publish-to-gh-pages.yml`](.github/workflows/publish-to-gh-pages.yml)), which runs on every push to `master` and can also be triggered manually. It builds with `npm ci && npm run build`, deploys the `build` directory to the `gh-pages` branch, and then asks the Algolia crawler to re-index the site.

You can also run `npm run deploy` locally to build and push to `gh-pages`, using either `USE_SSH=true npm run deploy` or `GIT_USER=<your GitHub username> npm run deploy`. In normal use, let the workflow handle deployment.

### Configuration

Environment variables can override selected settings in [`docusaurus.config.ts`](docusaurus.config.ts) for other deployment targets. The workflow reads them from the repository's `production` environment.

For cadenceworkflow.io, set:

```bash
# Site origin, used to build absolute URLs.
CADENCE_DOCS_URL=https://cadenceworkflow.io

# Served from the domain root.
BASE_URL=/

# GitHub org that owns the repository.
ORGANIZATION_NAME=cadence-workflow
```

When a variable is unset, the workflow uses defaults based on the repository name, so a fork deploys to `/<repo>/` with no extra configuration. Fork preview setup is documented in [CONTRIBUTING.md](CONTRIBUTING.md). The values above apply only to cadenceworkflow.io and should not be copied to a fork.

### Custom domain

A [custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) such as cadenceworkflow.io needs a `static/CNAME` file. Content under `static/` is copied to the build root, placing that file at the site root. The file is not committed; the deploy workflow writes it from the `CUSTOM_DOMAIN` secret. Forks do not have that secret or a custom domain.

## Contributing

Documentation changes are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to set up the site locally, verify your work, and open a pull request.

That guide also covers [homepage carousel updates](CONTRIBUTING.md#updating-the-featured-reading-carousel), driven by [`src/data/featuredLinks.yaml`](src/data/featuredLinks.yaml), and [release data updates](CONTRIBUTING.md#updating-release-data) under `static/data/releases/`. A scheduled workflow usually handles the release data.

For questions, join the **#cadence-contributors** channel on the CNCF Slack workspace, or see the [contact page](https://cadenceworkflow.io/community/contact-us) for other options.

## License

The source code in this repository is licensed under the Apache License 2.0. The documentation content is licensed under the Creative Commons Attribution 4.0 International License. See [LICENSE.md](LICENSE.md) for details.
