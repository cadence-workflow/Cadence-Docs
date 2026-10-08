---
title: Documentation Prose Style
description: Flags common AI writing patterns, stale references, and unsupported or contradictory claims in documentation prose
when: A .md or .mdx file under docs/, blog/, faq/, or community/ is created or updated
actions: Check added and modified prose against the style and content criteria, then report findings per file as non-blocking warnings
---

# Documentation Prose Style

When a pull request adds or modifies documentation prose, check only the added
or modified lines against the rules below. Read the rest of the changed file
and linked internal pages only when needed for context.

This check is informational only. It MUST NEVER block a PR. These checks are
heuristics and can be wrong. A contributor may dismiss any finding with a
reply.

## Scope

- Applies to changed `.md` and `.mdx` files under:
  - `docs/`
  - `blog/`
  - `faq/`
  - `community/`
- Applies to added and modified files.
- Report findings only for lines added or modified by the pull request.
- The full changed file may be read to understand context.
- For internal evidence checks, follow links only to files in this repository.

## Exemptions

Do not evaluate:

- `README.md` at any level.
- `docs/GLOSSARY.md`.
- Partials or includes whose basename begins with `_`.
- Pages under `docs/11-tech-review/` that contain only YAML frontmatter. These
  pages are works in progress by design.
- Text inside fenced code blocks.
- Text inside inline code spans.
- The pull request description.

## Thresholds

Apply these thresholds per changed file:

| Check | Warn when |
| --- | --- |
| Em dashes | More than 0 occurrences |
| AI vocabulary | More than 2 distinct listed terms |
| Connective tics | More than 1 distinct listed term |
| Bold on ordinary prose | More than 2 qualifying bold spans |
| Hedges in factual claims | More than 1 qualifying occurrence |
| Absolute Cadence Docs links | More than 0 occurrences |
| Promised but missing content | More than 0 findings |
| Stale references | More than 0 findings |
| Cross-page contradictions | More than 0 findings |
| Unsupported claims | More than 0 findings |

Count each AI vocabulary term once per file, regardless of repetition.
Case variants and the listed inflections count as the same term. For example,
`seamless` and `seamlessly` are one distinct term.

## Checks

Each check defines what to detect and what does not count. Apply the stated
exceptions before reporting a finding.

### 1. Em dashes

**Detect:** The literal em dash character `—`.

**Does not count:** En dashes (`–`), hyphens, minus signs, or occurrences
inside code.

**Bad:** `The worker keeps polling — even when idle.`

**Good:** `The worker keeps polling, even when idle.`

### 2. AI vocabulary

**Detect:** More than two distinct terms from this list:

- `delve`
- `testament`
- `pivotal`
- `underscore` or `underscoring`
- `tapestry`
- `robust`
- `landscape`
- `paramount`
- `fostering`
- `seamless` or `seamlessly`
- `multifaceted`
- `beacon`
- `leverage`
- `crucial`
- `comprehensive`
- `powerful`
- `unlock`
- `empower`
- `streamline`
- `intuitive`
- `holistic`
- `cutting-edge`
- `effortless`
- `journey`
- `realm`

**Does not count:** A term that is part of an identifier, configuration key,
product name, or quoted upstream text. Repeated uses of the same term count as
one distinct term.

Quote every qualifying term in its sentence so the contributor can judge each
use.

**Bad:** `Cadence offers a robust, comprehensive foundation for fostering reliable workflows.`

**Good:** `Cadence retries activities and persists workflow state across restarts.`

### 3. Connective tics

**Detect:** More than one distinct term or phrase from this list:

- `furthermore`
- `moreover`
- `in essence`
- `it's worth noting`
- `that said`
- `importantly`
- `notably`
- `crucially`
- `additionally`

**Does not count:** `Note that` inside an admonition block, or `additionally`
in a changelog or release-notes list.

**Bad:** `Furthermore, the timeout applies per attempt. Moreover, it's worth noting that a retry resets it.`

**Good:** `The timeout applies per attempt, and a retry resets it.`

### 4. Bold on ordinary prose

**Detect:** More than two `**...**` spans whose contents are ordinary English
prose.

**Does not count:** Configuration keys, environment variables, CLI flags,
file paths, field names, type names, table header cells, or a bold label that
opens a paragraph as a pseudo-heading.

**Bad:** `The domain is the **primary boundary**, and it is **not** a physical wall. This is **important** for isolation.`

**Good:** `The domain is the primary boundary, and it is not a physical wall. This distinction affects isolation.`

**Also good:** `Set **WRITE_GROUPS** on the domain.`

### 5. Hedges in factual claims

**Detect:** More than one qualifying use of:

- `most`
- `generally`
- `typically`
- `roughly`
- `largely`
- `usually`
- `often`

A use qualifies only when the sentence makes a checkable claim about software
behavior, configuration, compatibility, or an API.

**Does not count:** Statements about how operators, teams, or organizations
behave, because those practices can vary.

**Bad:** `Most admin endpoints require the admin permission. They generally reject domain write groups.`

**Good:** `Every admin endpoint requires the admin permission except the two domain-admin calls, which accept write-group membership.`

**Also good:** `Teams typically run three workers per task list.`

### 6. Absolute Cadence Docs links

**Detect:** A link whose destination begins with
`https://cadenceworkflow.io/docs/`.

**Does not count:** Links to the site root, links to non-docs paths, or URLs
inside code samples that readers must copy verbatim.

**Bad:** `[Get started](https://cadenceworkflow.io/docs/get-started)`

**Good:** `[Get started](/docs/get-started)`

### 7. Promised but missing content

**Detect:** For each topic explicitly enumerated in the frontmatter
`description`, confirm that the body contains at least one paragraph, list
item, or table entry addressing it. For a heading joined by `and`, `&`, or a
list of nouns, confirm that the section addresses every named topic.

**Does not count:** A description that summarizes the page without enumerating
topics, or a page that states in its opening that a named topic is covered
elsewhere.

**Bad:** Frontmatter says `Covers setup, tuning, and troubleshooting`, but the
body covers setup only.

**Good:** Change the description to `Covers setup`, add the missing sections,
or state in the opening where tuning and troubleshooting are covered.

### 8. Stale references

**Detect:**

- Hard-coded future dates, including bare future years and phrases such as
  `early next year`.
- Version-pinned documentation URLs such as `pkg.go.dev/...@v1.2.9`.
- Commit-pinned source URLs containing `/blob/<full-or-abbreviated-sha>/` when
  the surrounding text means the current implementation.

**Does not count:** Historical dates in release notes, changelogs, and blog
posts; a version that identifies when behavior changed; or a commit-pinned
source URL used as permanent evidence for a statement about that exact
revision.

**Bad:** `Support lands in early 2027.`

**Good:** `Support is tracked in issue 1234.`

### 9. Cross-page contradictions

**Detect:** For each factual assertion on an added or modified line, inspect
any linked page in this repository that covers the same subject. Report a
finding only when both pages make factual claims that cannot both be true.
Quote both claims and give both file paths. Do not decide which claim is
correct.

**Does not count:** A page linked only for background, a linked page that makes
no claim on the point, or differences in depth, scope, or wording that can
both be true.

**Bad:** The changed page says `A domain can be active in two clusters` while
its linked internal page says `A domain can be active in only one cluster`.

**Good:** State the supported behavior consistently on both pages, or qualify
each claim with the version or mode in which it applies.

### 10. Unsupported claims

**Detect:** When a sentence attributes a factual claim to an internal link
using wording such as `see`, `as described on`, or `that distinction is on`,
open the linked page and confirm that it contains evidence for that specific
claim.

**Does not count:** External URLs, links offered as general further reading,
or internal pages that support the claim using different but equivalent
wording.

**Bad:** `Retries always use exponential backoff. See [Retries](/docs/concepts/retries).`
The linked page does not describe a fixed backoff strategy.

**Good:** Remove the attribution, link a page that supports the claim, or
change the sentence to match what the linked page says.

## Warning format

Group findings by file. For each finding:

- Name the check.
- Give the line number and a short quote.
- Explain why the text met the check's threshold.
- Suggest the smallest useful change. Do not rewrite a paragraph or section.

Address the text, never the author. Do not use second-person judgments.

End the complete review with:

> These are optional prose checks and do not block merging. They are
> heuristics and can be dismissed with a reply when they do not fit the
> context.

Example:

> `docs/03-concepts/example-page.md`
>
> **Em dashes, line 24:** "The worker keeps polling — even when idle." This
> file contains an em dash. Replace it with a comma, colon, or period.
>
> These are optional prose checks and do not block merging. They are
> heuristics and can be dismissed with a reply when they do not fit the
> context.

## FORBIDDEN - Never do

- Do not block a pull request.
- Do not modify a file under review.
- Do not flag en dashes.
- Do not flag text inside fenced code blocks or inline code.
- Do not re-check frontmatter key presence or placeholder values. The
  `frontmatter-completeness.md` rule owns those checks. Check 7 evaluates
  whether the body delivers what a populated description says.
- Do not lint the pull request description. The `pr-description-quality.md`
  rule owns that text.
- Do not flag broken internal links. The Docusaurus build checks those.
- Do not rewrite prose on the contributor's behalf.
- Do not cite a real pull request, commit, author, or existing page as an
  example of a violation. Use invented examples only. A real file may be cited
  only as an example of the desired form.
- Do not flag a bold label that opens a paragraph as a pseudo-heading.
- Do not flag text on lines the pull request did not add or modify.
- Do not fetch an external URL.
