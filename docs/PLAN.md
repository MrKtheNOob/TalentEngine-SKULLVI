# Implementation Plan

## Current objective
Complete the application processing flow behind the API-backed interface.

## Completed milestone
Program creation/editing, Overview counts, application tables/detail, and configuration JSON persistence use Axios services through hooks. Table filters/sorting run on the API. Configuration save/rescore confirmation dialogs are implemented. No mock extraction or scoring data is mixed with live records.

## Next milestone
Agree on normalization output, criterion score scale, and priority-to-weight conversion, then process one real submission end to end.

## Tasks
- [ ] Finalize application source/CV and extracted-field schemas.
- [ ] Approve criterion inference and weighted aggregation behavior.
- [ ] Implement normalization, validation, scoring, and explicit rescoring.
- [ ] Add JSON/CSV intake and realistic failure tests.
- [ ] Document setup and remaining limitations.

## Backend reminders
- Return field-specific errors for criterion type/option mismatches; do not silently coerce invalid values.
- One configuration per program, no versions. Save does not automatically rescore: the reviewer chooses whether to rescore after saving or uses the separate button.
- Existing scores may reflect earlier criteria until successful reassessment; settle how to mark stale scores when the engine exists.
- Rescore currently returns 501 honestly; it does not queue work or erase scores.
- Human correction of extracted fields remains to design.

## Deferred ideas
External integrations and full reviewer collaboration workflows.
