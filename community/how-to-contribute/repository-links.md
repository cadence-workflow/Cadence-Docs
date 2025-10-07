# Proposed Link Paragraphs for Repository CONTRIBUTING.md Files

These paragraphs can be added near the top of each repository's CONTRIBUTING.md file to point contributors to the centralized guide while maintaining repository-specific details.

---

## For cadence (server) repository

Add after the introduction but before "Development Environment":

```markdown
> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains Cadence server-specific setup and development instructions.
```

---

## For cadence-go-client repository

Add after the CLA note:

```markdown
> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains Go client-specific setup and development instructions.
```

---

## For cadence-java-client repository

Add after the CLA note:

```markdown
> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains Java client-specific setup and development instructions.
```

---

## For cadence-web repository

Add after the CLA note:

```markdown
> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains Cadence Web-specific setup and development instructions.
```

---

## For Cadence-Docs repository

If a CONTRIBUTING.md is created (currently empty), add:

```markdown
> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains documentation-specific contribution instructions.
```

---

## General Template

For any other Cadence repository:

```markdown
> 📚 **New to contributing to Cadence?** Check out our [Contributing Guide](https://cadenceworkflow.io/community/how-to-contribute/getting-started) for an overview of the contribution process across all Cadence repositories. This document contains {repository-name}-specific setup and development instructions.
```

---

## Notes

- The emoji (📚) is optional and can be removed if it doesn't fit the repository's style
- The link uses the production URL; update if testing on a different domain
- This should be added as a blockquote (using `>`) to make it visually distinct
- Place it early in the document so new contributors see it right away
- The phrasing emphasizes that the local CONTRIBUTING.md still contains important repository-specific details
