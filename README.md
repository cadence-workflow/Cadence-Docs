# [Cadence docs](https://cadenceworkflow.io) &middot; ![Build and Deploy](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/publish-to-gh-pages.yml?label=Build%20and%20Deploy&link=https%3A%2F%2Fgithub.com%2Fcadence-workflow%2FCadence-Docs%2Factions%2Fworkflows%2Fpublish-to-gh-pages.yml) ![Nightly integration test](https://img.shields.io/github/actions/workflow/status/cadence-workflow/Cadence-Docs/nightly-integration-test.yml?label=Nightly%20integration%20test&link=https%3A%2F%2Fgithub.com%2Fcadence-workflow%2FCadence-Docs%2Factions%2Fworkflows%2Fnightly-integration-test.yml)



# cadenceworkflow.io

[Cadence docs](https://cadenceworkflow.io) is built using [Docusaurus](https://docusaurus.io/).



### Installation

```console
$ npm install
```

### Local Development

```console
$ npm run start
```

This command starts a local development server and opens up a browser window at http://localhost:3000/. Most changes are reflected live without having to restart the server.

### Build

```console
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Environment Variables

In order to deploy to multiple environments, some configuration options in `docusaurus.config.ts` are made available for override through environment variables.

```bash
# Can be replaced by your GH pages url, ie. https://<userId>.github.io/
CADENCE_DOCS_URL=https://cadenceworkflow.io

# For GitHub pages deployment, it is often /<projectName>/ defaults to `/`
BASE_URL=/cadence-docs/

# For Github pages only, this is your Github org/user name.
ORGANIZATION_NAME=cadence-workflow
```

### Deployment

Using SSH:

```console
$ USE_SSH=true npm run deploy
```

Not using SSH:

```console
$ GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.


# NPM Registry

Ensure you have a `.npmrc` [file](https://docs.npmjs.com/cli/v9/configuring-npm/npmrc/) configured with `registry=https://registry.npmjs.org/`.
This will ensure the dependencies are pulled from the correct source and to prevent internal npm registries from being pushed onto the package-lock.json

## License

MIT License, please see [LICENSE](https://github.com/cadence-workflow/Cadence-Docs/blob/master/LICENSE) for details.
