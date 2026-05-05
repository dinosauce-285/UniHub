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

- `blueprint/proposal.md`, `blueprint/design.md`, and `openspec/specs/*.md` define the product and technical scope.
- Follow `blueprint/design.md` & `blueprint/proposal.md` 
- Use `server/` for NestJS and `client/` for React.

## Workflow

1. Read the relevant Blueprint docs first.
2. Identify the smallest production-ready slice that satisfies the requested scope.
3. Map the plan to concrete `server/` and `client/` modules.
4. List assumptions, dependencies, risks, and suggested verification.
5. Do not write application code.
6. Do not edit `blueprint/` unless the user explicitly asks for a documentation update.

## Output

Do not just return a textual plan. Create an implementation proposal in `openspec/changes/<change-name>/` with the following files:
- `/specs/<spec-name>/spec.md`: the spec file for the feature to be implemented.
- `proposal.md`: A high-level overview explaining "Why", "What Changes", "Capabilities", and "Impact".
- `design.md`: Technical details including "Overview", "Flow" (with Mermaid diagrams), "Module Mapping", etc.
- `tasks.md`: A detailed implementation plan broken down into actionable checkbox tasks (e.g., `## 1. Backend`, `- [ ] 1.1 ...`).
- `.openspec.yaml`: A metadata file containing `schema: spec-driven` and `created: YYYY-MM-DD`.
Keep the plan bounded to the requested Blueprint scope.
