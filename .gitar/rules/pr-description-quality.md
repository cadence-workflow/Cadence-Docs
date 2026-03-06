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
   - ✅ GOOD: `npm run build` and `npm run start`, verified docs/concepts/search-workflows and operation-guide/troubleshooting
   - ❌ BAD: "Built locally" or "Looks good"
   - If link checker or lint was used, include the command

### Optional Sections (N/A allowed when appropriate)

4. **Potential risks**
   - Broken internal/outbound links? Wrong version or code references?
   - Sidebar/navigation impact? Missing redirects?
   - N/A is fine for small typo fixes or obvious copy edits

5. **Related changes**
   - If this doc change accompanies a code change, link the issue or main-repo PR
   - N/A for standalone docs fixes (typos, clarity, new tutorial)

### Quality Checks

- **Skip obvious things** - Don't flag items clear from folder structure
- **Skip trivial edits** - Minor typo or formatting changes don't need deep rationale
- **Don't check automated items** - Issue links, CI, linting are automated

## FORBIDDEN - Never Include

- ❌ "Issues Found", "Testing Evidence Quality", "Documentation Reasoning", "Summary" sections
- ❌ "Note:" paragraphs or explanatory text outside recommendations
- ❌ Grouping recommendations by type

## Section Names (Use EXACT Brackets)

- **[What changed?]**
- **[Why?]**
- **[How did you verify it?]**
- **[Potential risks]**
- **[Related changes]**
