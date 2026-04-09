# [Cadence docs](https://cadenceworkflow.io) &middot; ![Build and Deploy](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/publish-to-gh-pages.yml?label=Build%20and%20Deploy&link=https%3A%2F%2Fgithub.com%2Fcadence-workflow%2FCadence-Docs%2Factions%2Fworkflows%2Fpublish-to-gh-pages.yml) ![Nightly integration test](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/nightly-integration-test.yml?label=Nightly%20integration%20test&link=https%3A%2F%2Fgithub.com%2Fcadence-workflow%2FCadence-Docs%2Factions%2Fworkflows%2Fnightly-integration-test.yml)



# cadenceworkflow.io

[Cadence docs](https://cadenceworkflow.io) is built using [Docusaurus](https://docusaurus.io/).

> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains Cadence backend specific setup and development instructions.

### Installation

```console
npm install
```

### Local Development

```console
npm run start
```

This command starts a local development server and opens up a browser window at http://localhost:3000/. Most changes are reflected live without having to restart the server.

### Build

```console
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Preview the production / GitHub Pages build

Our [website](https://cadenceworkflow.io) is deployed by using GitHub pages, which are static HTML pages generated from the codebase whereas `npm run start` runs Docusaurus in development mode, injecting styles and updates them with HMR. Before you land your changes you need to check how they are going to look like in the website. Here are the steps to perform that test:

Run this once:

```console
chmod +x scripts/preview-github-pages-build.sh
```

Run this before every test:

```console
./scripts/preview-github-pages-build.sh --serve      # then open http://localhost:4173/
```

Alternatively, you can run the following:

```console
npm run preview:github-pages -- --serve
```

### Environment Variables

In order to deploy to multiple environments, some configuration options in `docusaurus.config.ts` are made available for override through environment variables.

```bash
# Can be replaced by your GH pages URL, i.e., https://<userId>.github.io/
CADENCE_DOCS_URL=https://cadenceworkflow.io

# For GitHub Pages project sites (e.g. username.github.io/Cadence-Docs/), use /<repo>/
# Official cadenceworkflow.io build uses BASE_URL=/
BASE_URL=/Cadence-Docs/

# For GitHub pages only, this is your GitHub org/user name.
ORGANIZATION_NAME=cadence-workflow
```

#### CNAME

A file `static/CNAME` should be present to use a [custom domain for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) (e.g. cadenceworkflow.io). The deploy workflow creates it from **`secrets.CUSTOM_DOMAIN`** (`finnp/create-file-action`).

### Deployment

Using SSH:

```console
USE_SSH=true npm run deploy
```

Not using SSH:

```console
GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.


### Updating Release Data

The release pages rely on data from GitHub that is persisted as JSON files under `static/data/releases/`.
In order to update the release information for display, this can be done manually or be set up as part of the CI/CD process by running the `scripts/fetch-releases.sh` script. Script uses the [GitHub CLI](https://cli.github.com/) to fetch the release data.

Automatic updates to release data are performed by a GitHub Action `fetch-release-data`, which will check if new data is available, and if so, update the release data with the latest information and open a branch named `fetch-release-data` and open a PR if one is not open already.

Manual approval is required before merging and continuing to deployment.

# NPM Registry

Ensure you have a `.npmrc` [file](https://docs.npmjs.com/cli/v9/configuring-npm/npmrc/) configured with `registry=https://registry.npmjs.org/`.
This will ensure the dependencies are pulled from the correct source and to prevent internal npm registries from being pushed onto the package-lock.json

## License

The source code in this repository is licensed under the Apache 2.0 License.
The documentation in this repository is licensed under the Creative Commons Attribution 4.0 International License.
See [LICENSE](https://github.com/cadence-workflow/Cadence-Docs/blob/master/LICENSE) for details.
