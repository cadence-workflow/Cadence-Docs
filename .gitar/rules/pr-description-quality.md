---
title: PR Description Quality Standards
description: Ensures PR descriptions meet Cadence-Docs quality criteria using guidance from PR template
when: PR description is created or updated
actions: Read PR template for guidance then report requirement status
---

# PR Description Quality Standards

When evaluating a pull request description:

1. **Read the PR template guidance** at `.github/pull_request_guidance.md` to understand the expected guidance for each section
2. Apply that guidance to evaluate the current PR description
3. Provide recommendations for how to improve the description.

## Core Principle: Why Not How

From https://cbea.ms/git-commit/#why-not-how:
- **"A diff shows WHAT changed, but only the description can explain WHY"**
- Focus on: the problem being solved, the reasoning behind the solution, context
- The content itself documents WHAT - the PR description documents WHY

## Evaluation Criteria

### Required Sections (must exist with substantive content per PR template guidance)

1. **What changed?**
   - 1-2 line summary of WHAT changed in the docs
   - Focus on key doc change (file(s), topic), not line-level edits
   - Link issue when applicable
   - Template has good/bad examples

2. **Why?**
   - Full context and motivation
   - What was wrong or unclear before? Why this wording or structure?
   - **CRITICAL**: Rationale required for ALL changes (not just large ones)
   - Must explain WHY this fix or approach was chosen

3. **How did you verify it?**
   - Concrete, copyable steps (e.g. Docusaurus build and/or start, which pages checked)
   - If the PR changes published site content or behavior, it must include a
     personal GitHub Pages deployment link matching
     `https://<username>.github.io/Cadence-Docs/`, optionally followed by a page path
   - Link the affected page when one exists; the site root is acceptable when the change has no page-specific route
   - Local build commands and page checks support the verification but do not replace the required personal preview
   - ✅ GOOD: `npm run build` and `npm run start`, verified docs/concepts/search-workflows and operation-guide/troubleshooting
   - ✅ GOOD: Verified via GitHub Pages preview at `https://<username>.github.io/Cadence-Docs/docs/...`
   - ❌ BAD: `http://localhost:3000`, `https://cadenceworkflow.io/docs/...`, a GitHub Actions run, or a repository URL
   - ❌ BAD: "Built locally" or "Looks good"
   - If link checker or lint was used, include the command
   - **If the PR modifies non-text files** (see item 5 below), verification **must** include production preview and dark/light mode — flag if missing

4. **Personal GitHub Pages Preview (required for site changes)**
   - Require a personal GitHub Pages preview when the PR changes any of:
     - `docs/`, `blog/`, `faq/`, `community/`, `src/`, or `static/`
     - `.mdx`, CSS, or SCSS files
     - `docusaurus.config.*`, `sidebars.*`, scripts, or package files
   - Do not require a preview when every changed file is limited to `.gitar/`,
     `.github/`, or root-level repository documentation such as
     `CONTRIBUTING.md`, `README.md`, or `NOTICE`
   - Accept URLs matching `https://<username>.github.io/Cadence-Docs/` with an optional page path
   - Do not accept localhost, the production Cadence site, GitHub Actions run URLs, or repository URLs
   - If the link is missing or malformed, emit a `[Personal GitHub Pages Preview]` recommendation

5. **Production Preview Verification (required for non-text changes)**
   - **Applies when the PR modifies:** `.mdx` files, `docusaurus.config.*`, `sidebars.*`, `src/` directory, `static/` (non-markdown), CSS/SCSS, scripts, or package files — anything beyond prose edits in static `.md` files
   - Description must mention running `npm run preview:github-pages -- --serve`
   - Description must mention checking both dark mode and light mode on affected pages
   - Description should include checklist items:
     - `- [ ] Ran production preview (npm run preview:github-pages -- --serve)`
     - `- [ ] Checked dark mode and light mode on affected pages`
   - ✅ GOOD: "Ran `npm run preview:github-pages -- --serve`, verified /docs/concepts/search-workflows renders correctly in both dark and light mode"
   - ❌ BAD: Only ran `npm run start` for a component/config/style change (must use production preview)
   - **Not required** for text-only edits to `.md` files

### Optional Sections (N/A allowed when appropriate)

6. **Potential risks**
   - Broken internal/outbound links? Wrong version or code references?
   - Sidebar/navigation impact? Missing redirects?
   - N/A is fine for small typo fixes or obvious copy edits

7. **Related changes**
   - If this doc change accompanies a code change, link the issue or main-repo PR
   - N/A for standalone docs fixes (typos, clarity, new tutorial)

### Quality Checks

- **Skip obvious things** - Don't flag items clear from folder structure
- **Skip trivial edits** - Minor typo or formatting changes don't need deep rationale
- **Don't check automated items** - Issue links, CI, linting are automated
- **Flag non-text PRs missing production preview** - If changed files include anything beyond `.md` text edits, flag if description does not mention production preview (`npm run preview:github-pages -- --serve`) or dark/light mode verification

## FORBIDDEN - Never Include

- ❌ "Issues Found", "Testing Evidence Quality", "Documentation Reasoning", "Summary" sections
- ❌ "Note:" paragraphs or explanatory text outside recommendations
- ❌ Grouping recommendations by type

## Section Names (Use EXACT Brackets)

- **[What changed?]**
- **[Why?]**
- **[How did you verify it?]**
- **[Personal GitHub Pages Preview]** (required for site changes)
- **[Production Preview Verification]** (required for non-text changes, part of verification)
- **[Potential risks]**
- **[Related changes]**
