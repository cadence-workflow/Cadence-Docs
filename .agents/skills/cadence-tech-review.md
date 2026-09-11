# Cadence CNCF Tech Review

Use this skill when writing or reviewing content for the CNCF technical review section (`docs/11-tech-review/`).

## Context

Cadence is a CNCF Sandbox project answering a structured TOC questionnaire covering three phases:

- **Day 0 (Planning)**: scope, usability, design, installation, security
- **Day 1 (Installation & Deployment)**: configuration, enablement/rollback, rollout/upgrade/rollback
- **Day 2 (Operations)**: scalability, observability, dependencies, troubleshooting, compliance, security

Each question maps to one page under `docs/11-tech-review/`.

## Before writing

1. **Read the questionnaire** at `../toc/toc_subprojects/project-reviews-subproject/general-technical-questions.md` to find the exact question for the page you're working on.

2. **Read 2-3 reference tech reviews** from other CNCF projects to calibrate tone and depth:
   ```
   ../toc/projects/kyverno/tech-review/2026-02-02.md
   ../toc/projects/k8gb/tech-review/2026-01-30.md
   ../toc/projects/buildpacks/tech-review/2026-02-20.md
   ../toc/projects/karmada/tech-review/2026-04-21.md
   ../toc/projects/confidential-containers/tech-review/2026-02-24-gtr-coco-incubation.md
   ../toc/projects/kubeflow/tech-review/2026-06-18.md
   ../toc/projects/hami/tech-review/2026-04-14.md
   ```

3. **Search existing Cadence docs** for content to link to rather than duplicate:
   ```bash
   grep -rn "<topic>" docs/ --include="*.md"
   grep -rn "<topic>" ../cadence/docs/ ../cadence/config/
   grep -rn "<topic>" ../cadence-charts/charts/cadence/
   ```

The docs site is organized into: `01-get-started/`, `02-use-cases/`, `03-concepts/`, `05-go-client/`, `06-cli/`, `07-operation-guide/`, `08-workflow-troubleshooting/`. Browse these to find linkable content.

## Patterns from reference projects

- **Brevity is the norm.** Most projects answer in 1-3 sentences per topic plus links. Even longer answers rarely exceed a paragraph per question.
- **Links over explanation.** Link heavily to existing docs rather than explaining inline.
- **Cross-reference between phases.** Day 1 should say "refer to Day 0" rather than repeating install mechanics. Day 2 should reference Day 1 for deployment context.
- **Factual tone.** No marketing language. Describe what you do, not why it's great.
- **N/A is acceptable.** The questionnaire says "not every question will be addressable by every project."

## Style conventions

1. Concise prose. Prefer links over inline explanation.
2. Link to existing Cadence docs using Docusaurus route paths (e.g. `/docs/operation-guide/setup`).
3. End each page with a `## Related documentation` section.

## Frontmatter format

```yaml
---
layout: default
title: Page Title
description: One sentence describing the page.
keywords:
  - keyword one
  - keyword two
  - keyword three
---
```

No `permalink` for tech review pages. They use Docusaurus file-path-based routing.

## Verification

Build to verify no broken links (`onBrokenLinks: 'throw'`):

```bash
npm run build
```

For visual verification, use `npm run start` or deploy to personal GitHub Pages:

```bash
gh workflow run publish-to-gh-pages.yml --repo <your-user>/Cadence-Docs --ref <branch>
```

## Source repos

All repos are under `../` relative to Cadence-Docs:

- **`../cadence/`**: server, config, Docker Compose, persistence docs, canary/bench
- **`../cadence-charts/`**: Helm chart, example values files (note: `main` branch, not `master`)
- **`../cadence-web/`**: browser-based Web UI
- **`../cadence-go-client/`**: official Go SDK
- **`../cadence-java-client/`**: official Java SDK
- **`../cadence-samples/`**: Go sample workflows
- **`../cadence-java-samples/`**: Java sample workflows
- **`../cadence-python-client/`**: community Python SDK
- **`../cadence-idl/`**: Thrift and Protobuf IDL definitions
- **`../shard-manager/`**: shard management component
- **`../toc/`**: CNCF TOC repo (questionnaire and reference tech reviews)
