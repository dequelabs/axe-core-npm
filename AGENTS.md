# AGENTS.md

## Issue references in pull request descriptions

The **last line** of a pull request description is its footer, and it must
reference the issue the PR addresses:

```
Closes: #123
```

Use `Ref: #123` instead when the PR relates to an issue it should not close.

### Three ways this goes wrong

**1. A word between the keyword and the reference.**

Write `Closes: #123`. Do not write `Closes issue #123` or `Closes Issue: #123`.

GitHub renders `#123` as a working link either way, so the description looks
correct — but GitHub only attaches a PR to an issue when the reference directly
follows the keyword. With a word in between, the PR merges and the issue is left
open, unlinked, and invisible to anyone tracking it.

**2. Several issues on one line.**

In `Closes: #1, #2` only `#1` is linked. Give each issue its own line:

```
Closes: #1
Closes: #2
```

**3. Anything below the footer.**

The footer is the last line, and only the last line. A caveat, an AI-attribution
line, or a sentence that wraps onto a new line all become the footer and displace
the reference. Put that content above it.

### Accepted footer openings

`Closes:`, `Close:`, `Closed:`, `Fixes:`, `Fix:`, `Fixed:`, `Resolves:`,
`Resolve:`, `Resolved:`, `Refs:`, `Ref:`, `QA notes:`, or the standalone
`No QA required` / `No QA needed`.

Only the first eleven link an issue. `QA notes:` and `No QA required` satisfy the
automated check without linking anything, so reach for them only when the change
genuinely has no issue — not as a way to skip the reference.
