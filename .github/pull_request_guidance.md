<!-- 1-2 line summary of WHAT changed in the docs:
- Link the relevant GitHub issue when applicable (e.g. doc change accompanying a code change)
- Good: "Updated 09-search-workflows.md to clarify memo vs search attributes #123"
- Good: "Added troubleshooting section to operation-guide/04-troubleshooting.md"
- Bad: "fixed docs" or "typo fixes" -->
**What changed?**


<!-- Your goal is to provide context for a future maintainer to understand the reasons for making this change (see https://cbea.ms/git-commit/#why-not-how).
What was wrong or unclear before? Why this wording or structure? Why this fix?
- Good: "The search workflows page did not explain that memo is not indexed; users were confused about when to use memo vs search attributes. This change adds a clear comparison and links to the relevant APIs."
- Bad: "Improves clarity" -->
**Why?**


<!-- Include specific verification steps so a reviewer can reproduce. For docs we verify by building and checking the result.

ALL changes:
- Run `npm run build` and `npm run start`, and list which pages you checked

REQUIRED for changes to published site content or behavior (includes docs/,
blog/, faq/, community/, src/, static/, .mdx, Docusaurus configuration,
sidebars, CSS/SCSS, scripts, and package files):
- Deploy the branch to your personal GitHub Pages site and include the URL:
  `https://<your-username>.github.io/Cadence-Docs/`
- Link the affected page when one exists. The site root is acceptable when the
  change has no page-specific route.
- Follow [Publish a personal GitHub Pages preview](../CONTRIBUTING.md#publish-a-personal-github-pages-preview)
  for deployment and one-time setup instructions.
- A preview is not required when every changed file is limited to `.gitar/`,
  `.github/`, or root-level repository documentation such as
  `CONTRIBUTING.md`.

REQUIRED for non-text changes (anything beyond prose edits in .md files — includes .mdx, docusaurus.config.*, sidebars.*, src/, static/ non-markdown, CSS/SCSS, scripts, package files):
- Run the production preview: `npm run preview:github-pages -- --serve` and verify affected pages at http://localhost:4173/
- Check both dark mode and light mode on affected pages
- Include these checklist items in your description:
  - [ ] Ran production preview (`npm run preview:github-pages -- --serve`)
  - [ ] Checked dark mode and light mode on affected pages

- If you used a link checker or lint, include the command

- Good: "Ran `npm run preview:github-pages -- --serve`, verified /docs/concepts/search-workflows in dark and light mode, and published https://octocat.github.io/Cadence-Docs/docs/concepts/search-workflows"
- Good: "Ran `npm run build` and `npm run start`, verified docs/concepts/search-workflows, and published https://octocat.github.io/Cadence-Docs/docs/concepts/search-workflows" (text-only .md change)
- Bad: "Built locally" or "Looks good"
- Bad: `http://localhost:3000`, `https://cadenceworkflow.io/docs/...`, a GitHub Actions run, or a repository URL. None is a personal GitHub Pages preview.
- Bad: Only ran `npm run start` for a component/config/style change (must use production preview)

Site-changing pull requests missing a personal GitHub Pages preview will be flagged.
Non-text changes missing production preview verification will also be flagged. -->
**How did you verify it?**


<!-- Docs-specific risks. If none apply, you can mark N/A.
- Broken internal links or outbound links?
- Wrong version or code references that could mislead users?
- Sidebar or navigation impact (e.g. new doc, moved doc)?
- Missing redirects for moved or renamed pages?
- N/A is fine for small typo fixes or obvious copy edits -->
**Potential risks**


<!-- If this doc change accompanies a code change, link the cadence-workflow issue or the Cadence (main repo) PR here.
- If this is a standalone docs fix (typos, clarity, new tutorial), use N/A -->
**Related changes**

