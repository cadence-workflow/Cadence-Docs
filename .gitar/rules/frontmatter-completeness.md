---
title: Markdown Frontmatter Completeness
description: Ensures .md/.mdx files under blog/ and docs/ have complete, populated frontmatter headers
when: A .md or .mdx file under blog/ or docs/ is created or updated
actions: Validate YAML frontmatter keys and values, then report missing or empty fields with fix suggestions
---

# Markdown Frontmatter Completeness

When evaluating a changed `.md` or `.mdx` file under `blog/` or `docs/`:

1. Determine the content type from the file path (`blog/` vs `docs/`).
2. Parse the YAML frontmatter at the top of the file.
3. Check the structural, required-key, and quality criteria below.
4. Report findings per file with actionable suggestions. Do not rewrite the file.

## Scope

- Applies to `blog/**/*.md`, `blog/**/*.mdx`, `docs/**/*.md`, `docs/**/*.mdx`.
- Exempt files (do not evaluate):
  - `README.md` at any level
  - `docs/GLOSSARY.md`
  - Partials / includes beginning with `_` (e.g., `_category_.json` siblings, `_partial.md`)

## Structural checks

- File MUST begin with `---` on line 1.
- Frontmatter MUST close with a matching `---` before any body content.
- Frontmatter MUST be valid YAML (no unbalanced quotes, no stray tabs, consistent indentation).
- The file MUST have body content after the closing `---` (not an empty page).

## Required frontmatter keys

### Blog posts (`blog/**`)

Modeled on `blog/2025-11-12-help-cadence-reach-cncf-incubation.md`:

- `title` — non-empty string
- `description` — non-empty sentence describing the post (not a placeholder, not a duplicate of `title`)
- `keywords` — list of SEO keywords, at least 3 entries
- `date` — `YYYY-MM-DD`; when the filename begins with a date prefix, it MUST match
- `authors` — non-empty (string or list)
- `tags` — non-empty list (e.g., `announcement`, `community-spotlight`)

Reference example:

```yaml
---
title: Help Cadence Reach CNCF Incubation
description: Cadence is a CNCF sandbox project working toward incubation status. Learn how adding your company to ADOPTERS.md helps the project grow and benefits the entire community.
keywords:
  - cadence CNCF incubation
  - cadence adopters
  - cadence sandbox project
date: 2025-11-12
authors: enderdemirkaya
tags:
  - announcement
---
```

### Docs (`docs/**`)

Modeled on `docs/01-get-started/01-server-installation.md`:

- `layout` — non-empty (typically `default`)
- `title` — non-empty string
- `description` — non-empty, meaningful sentence describing the page
- `keywords` — list of SEO keywords, at least 3 entries
- `permalink` — non-empty, starts with `/docs/`

Reference example:

```yaml
---
layout: default
title: Server Installation
description: This page explains how to install and run a Cadence server locally using Docker, register a domain, and set up a worker service to get started.
keywords:
  - cadence server installation
  - cadence docker
  - cadence local setup
permalink: /docs/get-started/installation
---
```

## Quality checks (populated, not just present)

Flag a key as "empty or placeholder" when its value matches any of the following:

- Empty string, whitespace-only, `null`, or YAML `~`
- `TODO`, `TBD`, `N/A`, `FIXME`, `XXX` (case-insensitive)
- Identical to the filename (minus extension) or identical to `title`
- For `description`: shorter than ~40 characters (likely too thin)
- For `keywords` / `tags`: list with 0 items or only placeholder strings
- For `permalink`: does not start with `/docs/`
- For `date`: not in `YYYY-MM-DD` format, or does not match the filename date prefix when one exists

## Output format

For each evaluated file, report:

- Path to the file
- Missing required keys (if any)
- Empty or placeholder keys (if any)
- Structural issues (if any)
- A suggested frontmatter snippet drawn from the matching example above (blog vs. doc), with the file's current values preserved where valid

Group findings by file. Do not rewrite the file; only report.

## FORBIDDEN - Never do

- Do not infer or invent values the author did not write (no guessing `authors`, `date`, `permalink`, etc.).
- Do not flag correctly-populated optional keys as problems.
- Do not flag files outside `blog/` and `docs/`.
- Do not modify the file under review.
