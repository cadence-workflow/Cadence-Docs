---
title: Featured Links Reminder
description: Warns when a new Doc, FAQ, Community, or Blog page is added without a corresponding entry in the homepage featured-links carousel
when: A new .md or .mdx file is added under blog/, docs/, faq/, or community/
actions: Compute the new page's URL, check it against src/data/featuredLinks.yaml, and warn (non-blocking) with a pointer to README instructions if missing
---

# Featured Links Reminder

When a pull request adds a **new** `.md` or `.mdx` file under `blog/`, `docs/`, `faq/`, or `community/`, check whether that page has also been added to the homepage "Featured reading" carousel (`src/data/featuredLinks.yaml`), and warn if not.

This check is informational only. It MUST NEVER block a PR.

## Scope

- Applies to newly added (not modified) files matching:
  - `blog/**/*.md`, `blog/**/*.mdx`
  - `docs/**/*.md`, `docs/**/*.mdx`
  - `faq/**/*.md`, `faq/**/*.mdx`
  - `community/**/*.md`, `community/**/*.mdx`
- No exemptions. Every new file in these four trees is checked, including index/landing pages.
- Only evaluate files that were added in this PR (git status `A`). Do not evaluate modified, renamed, or deleted files.

## Determine the category

Derive the featured-links `tag` value from the top-level directory of the new file:

| Path prefix | Category (`tag`) |
|---|---|
| `blog/` | `Blog` |
| `docs/` | `Doc` |
| `faq/` | `FAQ` |
| `community/` | `Community` |

## Compute the page's URL

To check whether a page is already featured, compute the URL it will be served at, then compare it against the `href` values in `src/data/featuredLinks.yaml`.

### docs / faq / community

Read the `permalink` key from the file's YAML frontmatter. That value is the `href` to look for verbatim.

Examples from this repo:
- `faq/cadence-faq.mdx` has `permalink: /faq/cadence-faq`
- `community/meetup.mdx` has `permalink: /community/meetup`
- `docs/03-concepts/16-schedules.md` has `permalink: /docs/concepts/schedules`

### blog

Blog posts don't declare a `permalink`; the URL is derived from the file's date and filename as `/blog/<YYYY>/<MM>/<DD>/<slug>`:

- `YYYY-MM-DD` comes from the filename's date prefix (or the `date:` frontmatter key if the filename has no date prefix).
- **Flat post** (`blog/YYYY-MM-DD-slug.md`): `<slug>` is the filename with the leading date prefix and extension removed.
  - Example: `blog/2026-06-23-cadence-schedules.md` → `/blog/2026/06/23/cadence-schedules`
- **Folder-based post** (`blog/YYYY-MM-DD-slug/YYYY-MM-DD-slug.mdx`): the dated folder name is kept **as-is** (it is NOT stripped of its date prefix); only the trailing filename's date prefix is stripped.
  - Example: `blog/2026-06-17-encrypt-cadence-history/2026-06-17-encrypt-cadence-history.mdx` → `/blog/2026/06/17/2026-06-17-encrypt-cadence-history/encrypt-cadence-history`
  - This matches the existing `featuredLinks.yaml` entry for that post exactly.

## Check against featuredLinks.yaml

1. Read `src/data/featuredLinks.yaml`.
2. Compare the computed URL against each entry's `href`.
3. If a match is found, the page is already featured — do not warn.
4. If no match is found, emit the warning below.
5. If the URL can't be confidently computed (e.g. `permalink` or date frontmatter is missing/malformed), still emit the warning, but note that the URL could not be determined rather than silently skipping the file.

## Warning format

For each new file with no matching entry, emit a warning (not a blocker) that:

- Names the file and its inferred category (Doc / FAQ / Community / Blog).
- States that it does not appear to be listed in `src/data/featuredLinks.yaml`.
- Points to the "Updating the Featured Reading Carousel" section of `README.md` for full instructions on the required (`title`, `description`, `href`, `tag`) and optional (`image`, `cta`) fields, and the valid `tag` values (`src/data/featuredTags.ts`).
- Makes clear this is optional/informational, not required to merge.

Example warning text:

> This PR adds a new Doc page (`docs/03-concepts/16-schedules.md`) that doesn't appear to be listed in the homepage featured-links carousel (`src/data/featuredLinks.yaml`). If you'd like it featured, add an entry with `title`, `description`, `href: /docs/concepts/schedules`, and `tag: Doc` — see the "Updating the Featured Reading Carousel" section in `README.md` for the full format. This is optional and does not block merging.

## FORBIDDEN - Never do

- Do not treat this as a blocker. It is always a warning/suggestion.
- Do not modify `featuredLinks.yaml` or the newly added source file.
- Do not flag modified, renamed, or deleted files — only newly added ones.
- Do not flag `src/data/featuredLinks.yaml` itself, or non-page files living alongside a post (images, `index.tsx` components in folder-based blog posts, `_category_.json`, etc.) — only the new `.md`/`.mdx` page file.
- Do not invent or guess a `permalink`/`href` when it truly cannot be determined; report the uncertainty instead.
