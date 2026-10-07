# Implementation Plan

## Current objective

Align the scoring-only frontend and documentation, then define backend contracts for LLM normalization, criterion inference, and weighted aggregation.

## Next milestone

Agree on typed criterion values, individual score scales, and priority-to-weight conversion before backend integration.

## Tasks

- [ ] Understand and structure the requirements.
- [ ] Identify the minimum functional solution.
- [ ] Define the domain model.
- [ ] Define and approve qualification/scoring behavior.
- [ ] Implement incrementally.
- [ ] Add tests for important rules and edge cases.
- [ ] Document setup, usage, design choices, and limitations.

## Deferred ideas

Keep optional enhancements here rather than automatically implementing them.

- External tool integrations beyond simple JSON or CSV import.
- Full reviewer workflow with statuses, notes, and collaboration.

## Open decisions

- Priority-tier conversion and score aggregation.
- Missing/ambiguous extracted-value handling and the human correction workflow.
- Backend configuration contract, normalized application schema, and CV ingestion.

Processing flow: raw submission → LLM normalization → validation → LLM criterion inference → weighted aggregation → ranking → human review.

The frontend still uses demo data; no normalization or scoring engine is implemented.

## Backend reminders

- Validate each extracted criterion value against its configured type; return a field-specific error for mismatches. Do not silently coerce invalid values.
- Revisit program attributes beyond name/description (for example lifecycle/status and dates) before defining the production creation contract.
- Intake will accept JSON/CSV files; decide parsing/mapping and CV references later.
- Configuration save triggers reassessment of all program applications, without versions. Decide stale-score display and failure handling.
- Human correction of flagged normalized fields is a recommendation, not yet an approved implementation.
