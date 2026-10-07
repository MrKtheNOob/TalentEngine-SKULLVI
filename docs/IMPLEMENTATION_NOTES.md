# Implementation notes

This file describes current code and integration boundaries. REQUIREMENTS.md, DECISIONS.md, and PLAN.md remain authoritative for scope and approved direction.

## Workspace

`frontend/` is the only application source project in the inspected workspace. Stack: React, TypeScript, Vite, React Router, Tailwind, Lucide, and Oxlint. No backend source files were found. The repository root previously did not contain a Git repository; verify Git organization before establishing version control.

Run from frontend:

```sh
npm run dev
npm run build
npm run lint
```

## Routes

| Route | Current behavior |
| --- | --- |
| `/app` | Temporary Programs landing page |
| `/app/programs` | Programs list |
| `/app/dashboard` | Dashboard placeholder |
| `/app/programs/:programId` | Program detail, Candidates/Configuration sections |
| `/app/programs/:programId/candidates/:candidateId` | Candidate's application within a program |

Program and candidate fixtures use numeric IDs. Route parameters arrive as strings and are converted for lookup. Missing records have not-found views. The bare `/` route has no explicit landing redirect. The documents' conceptual routes omit `/app`; this is a frontend routing prefix, not an API prefix. Multiple submissions by the same candidate to one program are not yet specified.

## Data access and state

| Hook | Responsibility |
| --- | --- |
| `usePrograms` | Program fixtures and list totals |
| `useProgram` | One program lookup |
| `useProgramApplications` | Applications scoped to a program |
| `useCandidateDetail` | Program, application, and detail fixture lookup |
| `useProgramConfiguration` | Per-program local draft and saved configuration |
| `useProgramsTable` | Program list controls and derived rows |
| `useCandidatesTable` | Candidate controls, ranking, and derived rows |

Pages and widgets obtain records through hooks rather than importing fixtures. These hooks currently return synchronous demo data, not loading/error results. Add API access only after contracts are agreed. Avoid turning them into a large provider or unrelated-responsibility model object.

## Model boundaries

- Program: numeric ID, name, Active/Closed status, candidate count, updated date.
- Candidate: numeric ID, name, nullable email.
- Application: numeric ID, program ID, candidate, nullable score, processing status, submission date, nullable CV reference, extraction warnings.
- ApplicationDetail: nullable normalized fields, source, normalization description, evaluation summary, criterion breakdown.
- NormalizedApplication: location, education, skills, experience, portfolio URL, availability, optional motivation. Current fixture shape is provisional.
- ProgramConfiguration: program ID and criteria only.
- ScoringCriterion: stable criterion ID, name, fixed type, priority, guidance, options, ranges, and unit. Type-specific fields are retained as empty arrays/strings where unused; this is not yet a finalized backend discriminated-union schema.
- CriterionAssessment: criterion ID, label, awarded points, maximum contribution, explanation.

There is no EligibilityRule, prerequisite result, eligible flag, or automatic rejection state. The Candidate/Application conceptual relationship is approved; embedding candidate identity in the frontend response does not prescribe database tables.

## Processing semantics

`received`, `processing`, `ready`, `needs_review`, `failed` are processing states. needs_review is for missing, ambiguous, or low-confidence extracted data. It is not triggered by a low score, and does not mean rejected. Failure represents a technical processing failure, not an unsuitable candidate. Final selection belongs to humans.

The LLM normalizes submissions. Deterministic application code computes scores from validated normalized fields and configuration. Explanation should identify matched rules and evidence; it must not claim an unimplemented LLM evaluation occurred. Do not show an arbitrary confidence percentage.

## Configuration UI

The form owns editing interactions and validation messages. The program configuration hook owns draft/saved records, preserving edits across conditional tab mounts. CriterionCard renders type/name/priority; CriterionValuesEditor switches between range, option, chip, and text presentations. ScoreTierSelect is independent of priority selection.

- Number: minimum-inclusive, maximum-exclusive ranges; null maximum means unbounded. The UI labels this convention. Validation rejects invalid/overlapping bounds; it does not yet require complete coverage or define unmatched-value scoring.
- Select: individually editable options with low/medium/high score tiers.
- Multiselect: removable preferred-option chips; added options carry a high score tier in the demo schema. Matching/aggregation is not yet defined.
- Text: evaluation guidance remains in the editor, but guidance alone is not a deterministic scoring rule. Define a supported deterministic strategy before connecting the scorer; do not silently fall back to LLM-generated scores.
- Priority: low/medium/high. No numeric conversion is approved. Earlier 1/2/3 normalization was a proposal only.

Cancel restores the locally saved record. Saving validates and updates memory; it is not backend persistence. Demo scores do not react to configuration edits.

## Presentation components

Program widgets: header, tabs, table, controls, row, status badge, candidates section. Candidate widgets: controls, row, processing badge, scoring sidebar, profile header, evaluation summary, contribution breakdown, processing details, application details. Configuration widgets: criterion card/editor, score-tier selector, sidebar, and form. Shared: BackLink, Button, KPICard, Sidebar, MainLayout.

The candidate table keeps scoring information beside it at desktop widths and stacks at smaller widths. A magnifying-glass Link opens each profile and has an accessible label. Table headers and cells follow Rank → Candidate → Score → Status → Date → Action. Empty-state colspan is six after removing prerequisites.

## Backend/API assumptions

Intended capabilities, not implemented endpoints:

```text
GET /programs
GET /programs/{id}
GET /programs/{id}/candidates
GET /programs/{id}/candidates/{candidateId}
GET /programs/{id}/configuration
PUT /programs/{id}/configuration
POST /programs/{id}/applications
```

List queries may support search, processing status, and score ordering. No eligibility filters or payload fields. Configuration payloads contain criteria only. Application ingestion is intended to store raw input and process asynchronously; 202 Accepted is proposed behavior in the decision log. Queue technology, retries, idempotency, uploads, persistence, and endpoint response schemas remain undefined. Program creation exists only as a disabled UI action and has no agreed contract.

## Known integration gaps

- Mock list counts and small application datasets differ.
- Demo normalized availability is free text; select-option matching still needs a stable representation.
- Criterion names do not yet map explicitly to normalized field keys.
- Text scoring, missing-value contributions, tiers, weights, and rounding are unresolved.
- Processing fixtures illustrate states without implementing transitions.
- No provider/model, CV parser, queue, DB, ORM, migration tool, or hosting choice is finalized.
- No committed unit/integration tests or browser-based validation suite yet.

## Frontend-to-API audit (2026-10-06)

Historical audit: items about deterministic scoring and configuration versions are superseded by the 2026-10-07 update below. Read-only code review; these findings and recommendations are not approved product changes. This was not a browser visual audit.

### Settle before finalizing API contracts

1. **Configurable criteria versus fixed normalized fields.** A criterion has a label/type but no mapping to extracted application data. Normalized experience/availability are strings, whereas configured number/select criteria require typed values. Decide whether normalization returns values keyed by stable criterion IDs, or criteria bind to supported canonical field keys. Keep identity/CV/general profile fields separate from criterion-specific answers. Do not infer the mapping from display names.
2. **Text criterion behavior.** The form accepts free-text evaluation guidance but the approved scorer is deterministic. Guidance cannot independently produce a reproducible contribution. Decide whether text is unscored display data, or has explicitly supported scoring rules. Number/select/multiselect also need tier values, weighting, matching, unmatched values, and missing-value rules.
3. **Program creation.** Create program is disabled; creation fields, initial configuration, status behavior, and creation endpoint are undefined. Decide whether new programs start unconfigured and how applications are processed in that state. Do not silently introduce a draft status.
4. **Application intake and CV.** There is no demo/import flow to submit an application. Decide on one minimal intake flow (such as supplied demo JSON) and where the CV comes from. Attachment metadata/access, file versus URL intake, failed extraction, and missing-CV presentation affect payloads. Real browser downloads may need a backend Content-Disposition response instead of relying on the cross-origin download attribute.
5. **Human data review.** needs_review is displayed but has no follow-up action. A simple candidate-detail correction form could let a reviewer fix extracted values and request validation/rescoring. Alternatively review can be read-only, but that limitation should be explicit. Do not equate approving data quality with selecting a candidate.
6. **Configuration changes.** Saved state does not rescore applications. Decide whether evaluations retain their original configuration version, or saving queues rescoring. Detail/list responses should not present old scores as calculated under the latest sidebar configuration. Unsaved changes also need a chosen navigation/discard behavior.
7. **Application identity.** Candidate detail currently selects the first matching candidate+program application. Decide whether one application per candidate/program is enforced, or detail navigation identifies application ID. Candidate identity/deduplication is not solved by route wiring.
8. **Ranking and list metadata.** Ranking is computed locally across the entire fixture dataset before filtering. With API filtering/pagination, the server must expose rank if it means global program rank. Decide tie handling and null-score ordering. Program counts should come from the same applications, with unique-person counts distinguished from application counts.

### UI behaviors needed when connecting HTTP

- Separate loading, not-found, network-error, empty, and processing views. Current synchronous hooks cannot represent these, and missing detail fixture data is treated as not-found even when an application exists.
- Save-in-progress, server validation errors, failed save with draft preserved, retry, and success feedback. Mock saving always succeeds.
- Refresh/poll or a manual refresh for processing applications. Background processing otherwise remains stale until navigation/reload.
- Keep list filters and selected program tab when returning from candidate detail if desired. Current route remount resets both.
- Handle normalized-but-missing separately from not-yet-normalized and extraction-failed. A skills empty array currently conflates extracted empty with missing.
- Decide minimal structured data-quality warnings (field/criterion identifier and reason) if correction controls need to target fields; current warnings are display strings.

### Presentation work that does not block the backend

- Overview and Dashboard are placeholders; decide whether to build both or narrow the navigation.
- Bare `/` and unknown URLs have no explicit routing fallback.
- Criterion type changes currently erase options/ranges without confirmation; deleting criteria can also lose edits.
- Sidebar labels mix English and French; normalize labels during polish.
- Desktop/table overflow and keyboard tab interaction need browser checks at practical viewport widths.
- Dataset counts, CV fixture labels, and synthetic breakdown notices must be replaced or clearly distinguished when live data arrives.

### Suggested next milestone

Agree on a single example application payload, its normalized criterion values, and the resulting deterministic breakdown for one program. Then implement the smallest program-creation/configuration/intake flow around that example and connect the existing screens. Completing every decorative widget first will not resolve the scoring contract.


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
