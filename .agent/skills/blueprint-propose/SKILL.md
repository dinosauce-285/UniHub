---
name: blueprint-propose
description: Create or update a small implementation plan from the UniHub Blueprint docs.
license: MIT
metadata:
  author: unihub-workshop
  version: "1.0"
---

Prepare a small implementation plan for UniHub Workshop.

## Source Of Truth

- `blueprint/proposal.md`, `blueprint/design.md`, and `blueprint/specs/*.md` define the product and technical scope.
- `TASK.MD` is planning context only.
- Use `server/` for NestJS and `client/` for React.

## Workflow

1. Read the relevant Blueprint docs first.
2. Identify the smallest production-ready slice that satisfies the requested scope.
3. Map the plan to concrete `server/` and `client/` modules.
4. List assumptions, dependencies, risks, and suggested verification.
5. Do not create folders or write application code.
6. Do not edit `blueprint/` unless the user explicitly asks for a documentation update.

## Output

Return a concise implementation plan with ordered steps and the files to read or edit. Keep the plan bounded to the requested Blueprint scope.
