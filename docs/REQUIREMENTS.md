# Requirements

## Assignment requirements

- Receive applications for SKULLVI programs and activities.
- Collect essential applicant information.
- Qualify applicant profiles.
- Assign a score.
- Rank candidates.
- Identify profiles to review first.
- Keep the solution simple, functional, tested, and documented.

## Current interpretation

- The MVP focuses on selective internship applications, because internships are the clearest concrete opportunity observed so far.
- Example internship tracks for testing and demonstration: backend, frontend, UX/UI design, and marketing.
- The system should start from existing application data rather than owning every form-creation detail.
- Applications should be represented internally through a canonical schema before type validation and LLM criterion scoring.
- Use LLM normalization and individual criterion-score inference, with validation and code-calculated weighted totals.
- Each criterion produces an explainable contribution; total score determines ranking.
- One configuration applies to all applications in a program; saved edits offer explicit rescoring rather than automatically triggering it.
- Display field-specific errors when extracted values do not match configured criterion types.
- Create programs with name and description; other attributes remain to review.
- Intake supports UTF-8 CSV (comma-separated rows) and JSON (arrays of objects), with durable raw submissions and background processing.
- `needs_review` means missing, ambiguous, or low-confidence extracted data, not a low score.
- Do not automatically reject candidates; humans make final selection decisions.
- Preserve a reference to the original CV; motivation is optional when supplied.

## Assumptions

- SKULLVI may use external intake tools such as Tally, Google Forms, CSV exports, or similar systems.
- Different internship tracks can share a common application shape while using track-specific scoring weights.
- Human reviewers remain responsible for final selection decisions.

## Out of scope

- Full dynamic form builder.
- Authentication and user roles for the MVP unless needed later.
- Replacing SKULLVI's existing application intake tools.
- Fully automated final candidate selection or rejection.
- Separate eligibility/prerequisite rules, results, and configuration.

## Possible extensions

- Import adapters for external tools.
- Reviewer notes, statuses, and collaboration workflows.
- Additional selective opportunity types beyond internships.

Optional ideas must not silently become MVP requirements.


## Approved program overview update

Programs have no Open/Closed lifecycle. Overview exposes editable name and description and application processing counts: total, needs review, pending/processing, and failed. Program attribute edits do not trigger scoring. Application processing statuses remain separate from candidate selection.


## Approved configuration workflow
Configuration remains one JSON document per program. Saving prompts the reviewer to choose save-only or save-and-rescore; rescoring can also be requested separately against saved criteria. Saving alone does not trigger potentially expensive LLM calls. Rescore requests queue independent application evaluations. Existing scores remain until successful reassessment.


## Approved processing direction

Application owns applicant identity; no separate Candidate entity is maintained. Use separate ImportJob and ScoringJob tables. Imports retain raw rows in PostgreSQL, process each independently, and create applications progressively. The original CSV/JSON file is not archived. CVs remain external HTTPS links, downloaded temporarily for PDF text extraction and retained as links for reviewer access. Import can optionally queue scoring when criteria exist. LLM criterion scores use a 0–100 scale; backend averages them with high/medium/low weights of 3/2/1. Failed or ambiguous processing remains visible; low scores never trigger rejection.
