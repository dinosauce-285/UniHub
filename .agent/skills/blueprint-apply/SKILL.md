---
name: blueprint-apply
description: Implement a specific UniHub task after reading the relevant Blueprint spec and code.
license: MIT
metadata:
  author: unihub-workshop
  version: "1.0"
---

Implement a specific requested UniHub task.

## Source Of Truth

- Read the relevant files in `blueprint/` before editing.
- Follow `blueprint/design.md` & `blueprint/proposal.md` 
- Application code lives in `server/` and `client/`.

## Workflow

1. Confirm the requested task maps to an existing Blueprint spec.
2. Read the relevant spec, `blueprint/design.md`, and current code files.
3. Make the smallest focused code changes needed for the requested task.
4. Do not invent features outside the Blueprint.
5. Do not modify `blueprint/` during implementation unless the user explicitly asks.
6. Preserve existing user changes and repo patterns.
7. Run targeted verification when feasible and report any command that cannot run.

## Output

Summarize changed files, implemented behavior, verification results, and remaining gaps.
