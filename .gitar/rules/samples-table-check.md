---
title: Samples Table Reminder
description: Warns when a new page under use-cases, concepts, java-client, go-client, or python-client is added without a Samples table
when: A new .md or .mdx file is added under docs/02-use-cases/, docs/03-concepts/, docs/04-java-client/, docs/05-go-client/, or docs/07-python-client/
actions: Check the new page for a Samples heading and table, and warn (non-blocking) with a pointer to the expected table format if missing
---

# Samples Table Reminder

When a pull request adds a **new** `.md` or `.mdx` file under the five client-facing doc sections, check whether that page includes a Samples table linking runnable examples, and warn if not.

This check is informational only. It MUST NEVER block a PR.

## Scope

- Applies to newly added (not modified) files matching:
  - `docs/02-use-cases/**/*.md`, `docs/02-use-cases/**/*.mdx`
  - `docs/03-concepts/**/*.md`, `docs/03-concepts/**/*.mdx`
  - `docs/04-java-client/**/*.md`, `docs/04-java-client/**/*.mdx`
  - `docs/05-go-client/**/*.md`, `docs/05-go-client/**/*.mdx`
  - `docs/07-python-client/**/*.md`, `docs/07-python-client/**/*.mdx`
- Only evaluate files that were added in this PR (git status `A`). Do not evaluate modified, renamed, or deleted files.
- Do not evaluate files outside these five trees (`docs/01-get-started/`, operation-guide, CLI, troubleshooting, releases, about, codelabs, and so on).

## Determine the section

| Path prefix | Section |
|---|---|
| `docs/02-use-cases/` | Use cases |
| `docs/03-concepts/` | Concepts |
| `docs/04-java-client/` | Java client |
| `docs/05-go-client/` | Go client |
| `docs/07-python-client/` | Python client |

## Exemptions (do not warn)

- Section indexes: basename `index.md`, `index.mdx`, `00-index.md`, or `00-index.mdx`
- Known overview/positioning page: `docs/04-java-client/01-client-overview.md` (already a samples index via repo links, no table)
- Partials: files whose basename starts with `_`
- Non-page files (images, `_category_.json`, and similar)

A new SEO or positioning page that is not in this list still gets a warning. The author can dismiss it; the warning text must say that is allowed.

## What counts as a Samples table

The new file **has** a samples table (no warning) when both are true:

1. A heading `## Samples` or `### Samples` exists. The heading text must be exactly `Samples` (case-insensitive).
2. Before the next heading of the same or higher level, a markdown table whose header row includes:
   - `Sample` or `Pattern`, and
   - `Code`, or separate `Go` / `Java` / `Python` columns (as on `docs/03-concepts/11-data-converter.md`)

A heading without a table, or a table elsewhere on the page with different columns, does not count.

## Warning format

For each new in-scope file missing the table, emit a warning (not a blocker) that:

- Names the file and section (Use cases / Concepts / Java client / Go client / Python client)
- States that it has no Samples table
- Points at the expected shape: a `## Samples` heading after the intro, then a 3-column `Sample | Description | Code` table linking runnable examples. Omit a language rather than using a placeholder. See `docs/03-concepts/02-activities.md` (multi-language) or `docs/05-go-client/02-create-workflows.md` (client-specific)
- Makes clear this is optional/informational; skip it for pages with no client code surface (server topology, SEO, section intros). It does not block merging.

Example warning text:

> This PR adds a new Concepts page (`docs/03-concepts/18-example.md`) with no Samples table. After the intro, add a `## Samples` heading and a `Sample | Description | Code` table linking runnable examples (omit a language rather than using a placeholder). See `docs/03-concepts/02-activities.md` for the format. If this page has no client code surface, you can ignore this warning. It does not block merging.

## FORBIDDEN - Never do

- Do not treat this as a blocker. It is always a warning/suggestion.
- Do not modify the newly added source file.
- Do not flag modified, renamed, or deleted files; only newly added ones.
- Do not flag files outside the five path prefixes above.
- Do not flag exempt files listed in Exemptions.
- Do not add a Samples table on behalf of the author.
