# Repository Instructions

## General working style

- Do not jump straight to a finished solution when a feature or problem is introduced. First understand the problem, codebase, constraints, and current requirements.
- Prefer the smallest solution that satisfies the requirement. Add technologies, abstractions, patterns, services, or dependencies only for a clear reason.
- Do not silently make important product or architecture decisions.

## Before implementation

For meaningful features or design decisions:

1. Briefly restate the problem.
2. Identify assumptions, ambiguities, edge cases, and failure cases.
3. Present the main alternatives and trade-offs when they matter.
4. Challenge proposed approaches with obvious weaknesses.
5. Recommend an approach and distinguish recommendations from established decisions.
6. Wait for approval before implementation unless asked to implement immediately.

Abbreviate this process for tiny mechanical changes.

## Design discussion

- While reasoning, prioritize questions and trade-offs over code. Help derive the solution, surface overlooked assumptions, and avoid overcomplication.
- State clearly when an idea is weak and why; avoid excessive agreement or praise.

## Decision ownership

`docs/DECISIONS.md` records decisions personally made or explicitly approved by the user. Suggestions and drafts are welcome, but do not record an important decision as settled without approval.

Each decision records its context, relevant alternatives, final decision, rationale, and consequences or limitations.

## Requirements

`docs/REQUIREMENTS.md` contains the current understanding of system behavior. Distinguish assignment requirements, assumptions, and optional enhancements. Never silently promote an assumption or enhancement into a requirement.

## Planning

Keep `docs/PLAN.md` small and incremental. Identify the next useful milestone, avoid speculative future work, and update it when decisions materially change.

## Implementation

Once approved, inspect relevant files before changing them, make focused changes, separate domain logic from transport or framework code where sensible, favor readable and explainable code, handle realistic failures, and avoid premature abstractions.

## Testing

Tests are part of implementation. Prioritize business rules, scoring or qualification logic, edge cases, invalid inputs, regressions, and behavior that could silently be wrong. Do not add meaningless tests for coverage alone.

## After implementation

Report what changed and why, important trade-offs, tests added or run, and remaining assumptions or risks. Be clear if generated code falls short of the agreed design.

## AI usage

The user owns the project: understanding the problem, defining requirements, choosing alternatives, approving architecture and domain decisions, reviewing generated code, and validating behavior. The assistant helps explore alternatives, find overlooked issues, implement, suggest tests, review, and explain. Do not describe suggestions as user decisions without approval.

## Frontend implementation policy

The frontend may be heavily AI-assisted.

### User-owned decisions

Do not independently redefine:

- page hierarchy;
- routes;
- domain terminology;
- what data appears on each screen;
- backend API contracts;
- state transitions;
- eligibility/scoring behavior;
- product workflows.

These decisions must come from the user or be explicitly approved by the user.

### Agent-owned implementation work

The agent is encouraged to handle repetitive or mechanical frontend work, including:

- JSX/TSX scaffolding;
- Tailwind or CSS styling;
- translating approved UI mockups into components;
- tables, cards, badges, tabs, forms, and layout code;
- responsive adjustments;
- icon integration;
- loading, empty, and error-state presentation;
- extracting reusable presentation components;
- replacing mock data with approved API calls.

The user should not be required to hand-write boilerplate merely to demonstrate ownership of the project.

### Frontend workflow

For each screen:

1. Review the approved UI description or reference image.
2. Identify the required data and interactions.
3. Check that those requirements match existing backend contracts.
4. If a required field or behavior does not exist, stop and raise it rather than inventing it.
5. Implement the screen using mock data first when useful.
6. Keep components small and readable.
7. Connect the screen to the API only after the visual structure and data requirements are understood.
8. Add loading, empty, error, and processing states where relevant.

### Architecture constraints

Prefer a simple structure such as:

```text
routes/pages
    ↓
feature components
    ↓
small hooks / API client
    ↓
backend
```

Avoid introducing:

- Redux;
- Zustand;
- complex providers;
- generalized state machines;
- unnecessary context layers;
- large custom hook abstractions;
- new UI frameworks;

unless there is a concrete need and the user approves it.

Do not create a large hook or provider that hides many unrelated responsibilities behind an abstract object such as `model`.

Prefer explicit names and narrow responsibilities.

### Reference-image implementation

When a UI reference image has been approved:

- reproduce its overall structure, spacing, hierarchy, and interaction patterns;
- do not treat every visual detail as a strict requirement;
- prioritize maintainable code over pixel-perfect hacks;
- preserve consistency across screens;
- do not add features simply because they appear plausible in the design.

### AI ownership boundary

AI may produce most of the frontend implementation code.

This is acceptable because the important project ownership remains with the user through:

- product decisions;
- UI structure;
- domain modeling;
- API design;
- workflow design;
- review of generated implementation;
- acceptance or rejection of changes.

Generated frontend code must remain understandable enough for the user to explain and modify.