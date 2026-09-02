# Contributing to Cadence Docs

Welcome, and thank you for helping improve the Cadence documentation. This repository is the source of [cadenceworkflow.io](https://cadenceworkflow.io), built with [Docusaurus](https://docusaurus.io/).

> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains setup and development instructions specific to the documentation site.

Docs contributions are one of the most valuable things you can do for the project, and they are a great way to get started. If anything here does not make sense, or does not work when you run it, that is a bug in this guide. Please open an issue and tell us.

- [Ways to contribute](#ways-to-contribute)
- [Find an issue](#find-an-issue)
- [Ask for help](#ask-for-help)
- [Development environment](#development-environment)
- [Run the site locally](#run-the-site-locally)
- [Verify your change](#verify-your-change)
- [What CI runs on your pull request](#what-ci-runs-on-your-pull-request)
- [Sign your commits](#sign-your-commits)
- [Pull request conventions](#pull-request-conventions)
- [Common documentation tasks](#common-documentation-tasks)
- [Publish a personal GitHub Pages preview](#publish-a-personal-github-pages-preview)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Ways to contribute

Fixing a typo is a real contribution and you do not need permission to do it. Beyond that, we welcome:

- Corrections to anything inaccurate or out of date
- Clarifying pages that confused you when you were learning Cadence
- New guides, codelabs, FAQ entries, and blog posts
- Improvements to site structure, navigation, and search
- Accessibility and rendering fixes
- Reporting docs bugs you do not have time to fix yourself

For the full picture of contributor roles across the project, see [Ways to Contribute](https://cadenceworkflow.io/community/how-to-contribute/ways-to-contribute).

## Find an issue

Browse [open issues in this repository](https://github.com/cadence-workflow/Cadence-Docs/issues). Cadence aggregates many issues in the [main Cadence repository](https://github.com/cadence-workflow/cadence/issues), so it is worth checking there too, particularly the [good first issues](https://github.com/cadence-workflow/cadence/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22%20label%3Aup-for-grabs).

Once you find something you want to work on, comment on the issue to say so. That prevents duplicated effort and gives maintainers a chance to add context before you start.

If you cannot find a suitable issue but you know something is wrong or missing, open a new issue describing the problem. You do not need to have the fix ready.

## Ask for help

The fastest way to reach maintainers is the **#cadence-contributors** channel on the CNCF Slack workspace. If you are not already a member, request an invite at [slack.cncf.io](https://slack.cncf.io/). Other ways to get in touch are listed on the [contact page](https://cadenceworkflow.io/community/contact-us).

You can also comment on the issue or pull request you are working on. Asking early is encouraged, and a partially finished pull request is a perfectly good place to start a conversation.

## Development environment

### Node.js

This site requires **Node.js 22 or newer**. The version is pinned in [`.nvmrc`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.nvmrc) and [`.node-version`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.node-version), and enforced by the `engines` field in [`package.json`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/package.json). CI builds on the current Node 22 LTS release.

If you use [nvm](https://github.com/nvm-sh/nvm):

```console
nvm install
nvm use
```

If you use [direnv](https://direnv.net/), this repository ships an [`.envrc`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.envrc) that selects the pinned Node version for you and sets `NODE_OPTIONS=--openssl-legacy-provider`, which some dependencies still need. Put any personal environment overrides in `.envrc.local`, which is loaded automatically and is not tracked by git.

### npm registry

Make sure you have an [`.npmrc`](https://docs.npmjs.com/cli/v9/configuring-npm/npmrc/) configured with:

```
registry=https://registry.npmjs.org/
```

This ensures dependencies resolve from the public registry, and stops an internal corporate registry from leaking into `package-lock.json`.

### Install dependencies

```console
npm install
```

## Run the site locally

```console
npm run start
```

This starts the Docusaurus development server at http://localhost:3000/ and opens a browser window. Most edits appear immediately without a restart.

The development server is the right tool while you are writing. It is *not* sufficient for verifying a change before you open a pull request, because it injects styles and serves content differently from the deployed site. See below.

## Verify your change

Work through the steps that apply to your change. This is the same verification the [pull request template](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.github/pull_request_template.md) asks you to describe, and the detailed rules live in [`.github/pull_request_guidance.md`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.github/pull_request_guidance.md).

### 1. Build the site

```console
npm run build
```

Always run this. The build is your main safety net for links: [`docusaurus.config.ts`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/docusaurus.config.ts) sets both `onBrokenLinks: 'throw'` and `onBrokenMarkdownLinks: 'throw'`, so a broken internal link fails the build rather than shipping quietly. It also validates the featured carousel data described below.

### 2. Type-check, if you touched TypeScript

```console
npm run typecheck
```

Worth knowing: this is **not** part of CI today, so it only protects you if you run it. Use it whenever you change anything under `src/`, `docusaurus.config.ts`, or the sidebar files.

### 3. Preview the production build

```console
npm run preview:github-pages -- --serve
```

Then open http://localhost:4173/.

This produces the same static HTML that GitHub Pages serves, copies it into the gitignored `.preview-pages/` directory, and serves it without single-page-app fallback so that redirects and 404s behave the way they will in production. It runs `npm ci` and a full build, so expect it to take longer than `npm run start`.

You can also invoke the script directly, which requires making it executable once:

```console
chmod +x scripts/preview-github-pages-build.sh
./scripts/preview-github-pages-build.sh --serve
```

The script accepts `PORT`, `PREVIEW_DIR`, `BASE_URL`, and `CADENCE_DOCS_URL` as environment variables.

**The production preview is required for any change beyond prose edits in `.md` files.** That includes `.mdx`, `docusaurus.config.*`, `sidebars.*`, anything under `src/`, non-markdown files under `static/`, CSS or SCSS, scripts, and package files. Pull requests that need it and do not mention it will be sent back.

### 4. Check dark mode and light mode

For any change that affects rendering, check affected pages in both color modes using the theme toggle in the site header.

## What CI runs on your pull request

- **Build** ([`build.yml`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.github/workflows/build.yml)) runs `npm ci && npm run build` on every push and pull request. This is the check that catches broken internal links.
- **Link check** ([`link-check-pr.yml`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.github/workflows/link-check-pr.yml)) runs [lychee](https://github.com/lycheeverse/lychee) against external `http(s)` links in the markdown files your pull request changed. Internal links are deliberately left to the build, which understands Docusaurus routing. This check is currently advisory: it reports failures but does not block merging. That is temporary, so please read its output and fix genuinely broken links rather than ignoring it.
- **DCO** verifies every commit is signed off. See below.

Maintainers must approve workflow runs for first-time contributors, so your checks may sit idle briefly before they start.

## Sign your commits

Cadence uses the [Developer Certificate of Origin](https://developercertificate.org/) (DCO), not a CLA. Every commit must carry a `Signed-off-by` line matching the author's name and email:

```console
git commit -s -m "Your commit message"
```

Sign-off is required for everyone, including maintainers. If you forget on a commit you have not pushed yet:

```console
git commit --amend -s --no-edit
```

GPG signing satisfies the check as well. Setup instructions for both approaches are in [Pull Request Conventions](https://cadenceworkflow.io/community/how-to-contribute/pull-request-conventions).

## Pull request conventions

Pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/), start with an uppercase letter, and use the imperative mood:

```
docs: Clarify memo versus search attributes
fix(carousel): Correct fallback image for video items
```

Most changes here use the `docs` type. Full conventions, including the type list, are documented in [Pull Request Conventions](https://cadenceworkflow.io/community/how-to-contribute/pull-request-conventions).

Write the pull request description for a maintainer reading it a year from now. Explain what changed and, more importantly, why: what was wrong or unclear before. See [How to Write a Git Commit Message](https://cbea.ms/git-commit/) for the underlying habit. The [pull request template](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.github/pull_request_template.md) prompts you for each part, and [`.github/pull_request_guidance.md`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/.github/pull_request_guidance.md) has worked examples of good and bad answers.

Before you submit, confirm that you have:

- [ ] Run `npm run build` successfully
- [ ] Run the production preview if your change is anything beyond prose in a `.md` file
- [ ] Checked affected pages in dark mode and light mode
- [ ] Listed the specific pages you verified, in the description
- [ ] Signed every commit with `-s`
- [ ] Noted any moved or renamed page so a redirect can be added

Two maintainer approvals are required to merge. Expect review comments on everything, from anyone; that is normal and not a judgment of your work. Comments prefixed with `nit:` are stylistic preferences that do not block merging.

## Common documentation tasks

### Adding, moving, or renaming a page

Documentation lives under `docs/`, organized into numbered directories and files such as `docs/05-go-client/23-batch-future.md`. The numeric prefixes control ordering only; Docusaurus strips them from the published URL, so that file is served at `/docs/go-client/batch-future`.

Two things catch people out:

- **Sidebars are explicit, not generated.** [`sidebars.ts`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/sidebars.ts) lists every page by ID, and the filesystem-autogenerated option is deliberately commented out. A new page will build fine and be reachable by URL, but it will not appear in the sidebar until you add it to the right category. The community and FAQ sections have their own files, [`sidebarsCommunity.js`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/sidebarsCommunity.js) and [`sidebarsFAQ.js`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/sidebarsFAQ.js).
- **Moved or renamed pages need a redirect.** Add an entry to the `plugin-client-redirects` configuration in [`docusaurus.config.ts`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/docusaurus.config.ts) so existing links and search results keep working. Redirects only take effect in a production build, so `npm run start` will not show them. Verify them with the production preview.

### Updating the featured reading carousel

The homepage "Featured reading" carousel is driven entirely by [`src/data/featuredLinks.yaml`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/src/data/featuredLinks.yaml). No code changes are needed to add, remove, or reorder items. Items render in the order they appear in the file, so add a new entry wherever it should show up.

Each entry supports:

- `title` (required): Card headline.
- `description` (required): One or two short sentences.
- `href` (required): Internal route (e.g. `/docs/...`) or a full external URL.
- `tag` (required): One of `Blog`, `Doc`, `Community`, `FAQ`, `Video`, defined in [`src/data/featuredTags.ts`](https://github.com/cadence-workflow/Cadence-Docs/blob/master/src/data/featuredTags.ts). An unrecognized tag fails the build with a clear error.
- `image` (optional): Overrides the tag's default image. A path under `static/` (e.g. `/img/foo.png`) or a full URL.
- `cta` (optional): Call-to-action label; defaults to "Read more".

```yaml
- title: "Introducing Cadence Schedules"
  description: Cadence Schedules bring first-class recurring workflow execution to the platform.
  href: /blog/2026/06/23/cadence-schedules
  tag: Blog
  cta: Read post
```

For `Video` items linking to YouTube, the carousel automatically pulls the video's thumbnail as the card image, falling back to the tag's default image if the thumbnail fails to load.

### Updating release data

The release pages read from JSON files under `static/data/releases/`. To refresh them manually, run `scripts/fetch-releases.sh`, which uses the [GitHub CLI](https://cli.github.com/).

Normally you do not need to. The `fetch-release-data` GitHub Action checks for new release data, and when it finds some, pushes a `fetch-release-data` branch and opens a pull request if one is not already open. Those pull requests need manual approval before merging.

## Publish a personal GitHub Pages preview

Optional, and only useful for larger changes. You can deploy your fork to your own GitHub Pages site, giving you a shareable URL such as `https://<your-username>.github.io/Cadence-Docs/`.

This is worth doing when a local preview is not enough:

- You want to share a rendered page with a reviewer, or gather feedback before opening a pull request.
- Your change touches links or assets, and you need to catch paths that break when the site is served from a subpath rather than the domain root. `npm run start` serves from `/`, so it never exercises this. The canonical site also runs at `/`, but a fork's project site runs under `/Cadence-Docs/`.

Note that a fork deploys with `BASE_URL=/Cadence-Docs/` and no custom domain. Do not set `CUSTOM_DOMAIN` or commit a `static/CNAME` file on your fork; those exist for the canonical cadenceworkflow.io deployment only, and setting them on a fork will send your preview to the wrong hostname.

<!-- TODO: Paste the step-by-step personal GitHub Pages setup here.
     Should cover: forking, enabling GitHub Pages on the fork, the repo
     variables to set (BASE_URL, ORGANIZATION_NAME, CADENCE_DOCS_URL),
     triggering the deploy workflow, and how to confirm the site is live. -->

## Code of Conduct

Cadence follows the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md). By participating you agree to uphold it. Report unacceptable behavior to the [CNCF Code of Conduct Committee](mailto:conduct@cncf.io).

## License

By contributing, you agree that your contributions are licensed under this repository's terms: source code under the Apache License 2.0, and documentation content under the Creative Commons Attribution 4.0 International License. See [LICENSE.md](https://github.com/cadence-workflow/Cadence-Docs/blob/master/LICENSE.md) for details.
