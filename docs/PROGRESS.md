# Progress and handoff

Historical snapshot: 2026-10-06. See the latest update below for superseding decisions. This is a status report, not a source of new decisions. Approved behavior lives in DECISIONS.md; implementation gaps remain explicit.

## Progression

1. Established AGENTS.md and concise requirements, decision, and plan documents before application work. The user owns product and architecture decisions; the assistant explains alternatives and implements approved work.
2. Reviewed the SKULLVI assignment: collect applications, organize essential information, qualify, score, rank, and prioritize human review. A small functional project matters more than breadth.
3. Chose Python/FastAPI and a separate React frontend. No Next.js requirement. Database, ORM, Alembic, hosting, authentication, and production deployment have not been finalized.
4. Narrowed the ambiguous “programs and activities” scope to selective internship applications. Backend, frontend, design, and marketing/community examples are demo tracks, not verified SKULLVI program definitions. Avoid inventing an HCP cohort.
5. Excluded a dynamic form builder. External intake or a simple demo import should supply raw applications. Program configuration defines evaluation, not applicant form creation.
6. Used UI discussion and reference images to expose data needs before backend implementation. Settled on Programs, program detail with tabs, and candidate/application detail.
7. Built the React shell, nested routing, sidebar, palette, Programs KPIs, tables, search, filters, sorting, and navigation. Added numeric mock IDs and Lucide icons; program-specific icons were intentionally omitted.
8. Built program tabs and a configuration editor: typed criteria, priorities, number ranges, select score levels, multi-select chips, and text guidance. Draft and saved state are separate, in memory only.
9. Built the candidate table, processing badges, fictional application fixtures, and individual candidate detail layout. Added original CV access/download, optional motivation, missing-data states, and score explanations.
10. Refactored data access into hooks and large presentation blocks into components. Used React SubmitEvent; switch for mutually exclusive branches; readable guards for missing data.
11. Explored direct LLM scoring and a separate eligibility/prerequisite system. These are superseded by the user's latest scoring-only decision. Historical screenshots still show obsolete eligibility controls.
12. Current approved flow: raw submission → LLM normalization → validation → deterministic scoring → ranking → human review. No automatic rejection. needs_review concerns extracted-data quality only.

## Implemented

- Programs list with KPI totals derived from program fixtures, accent-insensitive search, status filtering, sorting, and detail links.
- Program detail header and top section selector. Candidates and Configuration mount conditionally; Overview remains disabled.
- Candidate table scoped to the selected program, score ranking, processing filters, search, date sorting, empty states, and profile links.
- Rank is derived before filtering; unscored rows have no rank. Equal demo scores use application ID as a stable tie-break.
- Candidate detail: breadcrumb, identity, overall score, contribution breakdown, normalized application details, processing information, warnings, CV link/download, and missing-data states.
- Configuration: fixed number/text/select/multiselect types, criterion names, priority tiers, structured options/ranges, add/remove controls, form validation, summary, local JSON preview, and cancel.
- Removed prerequisite/eligibility fields and UI, and removed the separate configurable required-information panel. Missing-data warnings remain application information.
- Styling uses the user's slate/blue palette with emerald/amber/red states and Lucide icons. Sidebar and content occupy the dynamic viewport; content scrolls independently.

## What is still a demonstration

All application records, scores, explanations, configurations, and the sample CV are fictional. No LLM, scoring engine, HTTP client, database, queue, or backend endpoint is implemented in the inspected workspace. The candidate-detail fixture for Awa has normalized data; other profiles intentionally show missing data. The original CV example is a clearly labeled text fixture, not a PDF-upload pipeline.

Configuration changes do not recalculate demo scores. The illustrative 50/50 breakdown is not an approved priority-to-weight conversion. Saved configuration is local React state and is lost when the program page unmounts or the browser reloads. Mock program counts are independent of the smaller application fixtures and therefore do not reconcile yet.

## Latest validation

- Production build: passed (TypeScript and Vite).
- Oxlint: passed.
- One-off fixture checks: passed; no prerequisite fields, breakdown sums match totals, unscored breakdowns are empty, needs_review fixtures carry warnings, and a low-score application can remain ready.
- These checks are not a committed automated test suite. Browser appearance and end-to-end interactions have not been systematically verified.

## Remaining work

1. Agree on normalized application and configuration API contracts.
2. Define criterion-to-field mapping and deterministic scoring for each type, especially text.
3. Approve priority conversion, score-level values, missing/out-of-range handling, and total calculation.
4. Decide configuration versioning and what changes do to existing evaluations.
5. Scaffold FastAPI, select persistence, and implement a small program/application API slice.
6. Connect existing data hooks to approved endpoints, adding loading/error states.
7. Implement raw intake, CV ingestion/storage, LLM normalization, validation, and background processing.
8. Implement and test the deterministic scorer, then connect ranking and breakdowns.
9. Build program creation and Overview; document setup and actual behavior.

Do not reopen settled framework or scoring-only decisions without a concrete reason. Do not interpret mock shapes as finalized backend contracts.


## Latest update — 2026-10-07

This supersedes earlier statements about deterministic criterion scoring, disabled program creation, and proposed configuration versions.

- LLM infers individual criterion scores and explanations; code applies weights and sums contributions. No deterministic criterion-scoring engine is planned. Score scale and tier conversion remain open.
- A single current configuration applies to every application in a program. Saving changes must trigger fresh inference for all of them; no configuration versions. Actual reassessment is not implemented.
- Extracted criterion values must match declared types. Backend mismatch errors should identify the field/criterion and expected type; frontend should display them. Do not silently accept malformed values.
- Dialog now wraps injected children using native dialog presentation. CreateProgramForm accepts name/description, validates trimmed inputs, and creates a program in a small shared in-memory demo store accessed through hooks. Lists and detail lookups see the same records. Reload loses them.
- New demo programs are Active, with no criteria and no applications. Production status/lifecycle and other program attributes need discussion. Empty configuration is supported for navigation; scoring before configuration is undefined.
- Application intake will use JSON/CSV upload; parsing/mapping/CV details are deferred.
- Proposed needs_review resolution: show only flagged normalized fields and their source evidence, allow corrections, then validate and reassess. This recommendation is not implemented or approved yet.
- Build and lint passed after the Dialog and creation changes. Browser modal interactions have not been systematically tested.

## Latest implementation — durable processing

- Applicant identity is merged into Application; candidate ORM/API identity contracts are removed.
- Migration 0004 preserves existing application IDs and copies linked candidate data before consolidation.
- Separate ImportJob and ScoringJob models replace the generic job scaffold; no item table or object storage.
- CSV/JSON uploads are parsed and persisted before 202. Worker checkpoints and application writes commit together per row.
- Asyncio worker polls PostgreSQL, processes rows independently, recovers interrupted running work and queues per-application scoring.
- Temporary CV downloads are read through pypdf; external URLs are kept for review. Unreadable PDFs produce warnings.
- Structured normalization and scoring outputs are validated; 3/2/1 weighted averages are calculated by Python, with explainable breakdowns.
- Frontend upload, job history, application facts/warnings/scores and rescore dialogs are connected. Relevant screens poll for updates.
- Automated tests cover parsing, endpoints, restart checkpoints, partial failures, strict scoring/type validation and preserved scores on failure. No paid LLM calls were made.
- Local PostgreSQL was unavailable: migration SQL was generated successfully, but online migration/check and live-provider verification remain pending.
