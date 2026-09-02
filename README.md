# Cadence docs

[![Build and Deploy](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/publish-to-gh-pages.yml?label=Build%20and%20Deploy)](https://github.com/cadence-workflow/Cadence-Docs/actions/workflows/publish-to-gh-pages.yml)
[![Nightly integration test](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/nightly-integration-test.yml?label=Nightly%20integration%20test)](https://github.com/cadence-workflow/Cadence-Docs/actions/workflows/nightly-integration-test.yml)

This repository is the source of [cadenceworkflow.io](https://cadenceworkflow.io), the documentation site for [Cadence](https://github.com/cadence-workflow/cadence). It is built with [Docusaurus](https://docusaurus.io/).

> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. For setup and development instructions specific to this site, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Quick start

Requires Node.js 22 or newer.

```console
npm install
npm run start
```

This starts a local development server at http://localhost:3000/ and opens a browser window. Most changes are reflected live without restarting the server.

To generate the static site into the `build` directory, which can be served by any static host:

```console
npm run build
```

[CONTRIBUTING.md](CONTRIBUTING.md) covers the rest: Node version pinning, npm registry configuration, the production preview you should run before opening a pull request, and how to add or move a page.

## How the site is deployed

The live site is published by the **Build and Deploy** workflow ([`publish-to-gh-pages.yml`](.github/workflows/publish-to-gh-pages.yml)), which runs on every push to `master` and can also be triggered manually. It builds with `npm ci && npm run build`, deploys the `build` directory to the `gh-pages` branch, and then asks the Algolia crawler to re-index the site.

`npm run deploy` also exists as a manual fallback that builds and pushes to `gh-pages` from your machine, using either `USE_SSH=true npm run deploy` or `GIT_USER=<your GitHub username> npm run deploy`. Day to day you should not need it; prefer letting the workflow deploy.

### Configuration

A few options in [`docusaurus.config.ts`](docusaurus.config.ts) can be overridden by environment variables so the site can be deployed to more than one place. The deploy workflow reads them from the repository's `production` environment settings.

The canonical cadenceworkflow.io deployment uses:

```bash
# Site origin, used to build absolute URLs.
CADENCE_DOCS_URL=https://cadenceworkflow.io

# Served from the domain root.
BASE_URL=/

# GitHub org that owns the repository.
ORGANIZATION_NAME=cadence-workflow
```

If a variable is not set, the workflow derives a sensible default from the repository name, so a fork deploys to `/<repo>/` without any configuration. Deploying your own fork for preview purposes is documented in [CONTRIBUTING.md](CONTRIBUTING.md); the values above are for the canonical site and should not be copied to a fork.

### Custom domain

Serving the site from a [custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) such as cadenceworkflow.io requires a `static/CNAME` file, because anything under `static/` is copied to the root of the build output. The file is not committed: the deploy workflow creates it from the `CUSTOM_DOMAIN` secret. Forks have no such secret and therefore no custom domain, which is the intended behavior.

## Contributing

Documentation contributions are welcome and are a good way to get started with the project. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up, verify, and submit a change to this site.

Two common tasks are documented there rather than here, since both are contributor workflows: [updating the featured reading carousel](CONTRIBUTING.md#updating-the-featured-reading-carousel) on the homepage, which is driven entirely by [`src/data/featuredLinks.yaml`](src/data/featuredLinks.yaml), and [updating release data](CONTRIBUTING.md#updating-release-data) under `static/data/releases/`, which is normally handled automatically by a scheduled workflow.

For questions, join the **#cadence-contributors** channel on the CNCF Slack workspace, or see the [contact page](https://cadenceworkflow.io/community/contact-us) for other options.

## License

The source code in this repository is licensed under the Apache License 2.0. The documentation content is licensed under the Creative Commons Attribution 4.0 International License. See [LICENSE.md](LICENSE.md) for details.
