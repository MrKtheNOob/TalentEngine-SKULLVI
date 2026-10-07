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
- One configuration applies to all applications in a program; saved edits trigger fresh inference for all of them.
- Display field-specific errors when extracted values do not match configured criterion types.
- Create programs with name and description; revisit other attributes before backend implementation.
- Later intake will support a JSON/CSV upload interface; details remain to be discussed.
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
