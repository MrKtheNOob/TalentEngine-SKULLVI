# Decision Log

This file records decisions explicitly made or approved by the user. Suggestions are not settled decisions.

## D-001 — Use React and FastAPI

### Context
The take-home is a small internal tool for collecting, qualifying, scoring, and ranking program applicants. The assignment leaves technology choices open. The user is most comfortable with Python and prefers separate frontend and backend projects.

### Options considered
FastAPI with React; a Python-rendered interface using standard HTML, CSS, and JavaScript.

### Decision
Use FastAPI for the backend and React for the frontend.

### Rationale
This matches the user's experience and preference while keeping the service layer in Python. The internal-tool context does not call for server-rendered pages for SEO.

### Consequences / limitations
The frontend and backend are separate pieces to run and deploy. Browser API access and deployment routing need a straightforward configuration.

## D-002 — Focus the MVP on selective internship applications

### Context
SKULLVI's brief mentions applications for "programmes et activités," which could include many different things. The clearest concrete opportunity observed so far is internships.

### Options considered
Model all programs and activities generically; focus on internships first; invent a cohort or program type that is not yet well understood.

### Decision
The MVP will focus on selective internship applications. Test data may include backend, frontend, UX/UI design, and marketing internship tracks.

### Rationale
Internships fit the assignment's need to qualify, score, rank, and prioritize candidates. This keeps the project concrete without pretending to understand every SKULLVI program.

### Consequences / limitations
The first version will not cover every possible SKULLVI activity. Future selective programs can be added if their requirements are understood.

## D-003 — Do not build a full form builder

### Context
One possible approach was to let administrators dynamically create application forms for each opportunity. That would quickly become a Typeform or Tally style product, with field types, options, validation, editing, versioning, conditional questions, and rendering.

### Options considered
Build a form builder; rely on external intake tools and import their submissions; define a fixed internal application form only for the MVP.

### Decision
Talent Engine will not own full form creation in the MVP. Existing tools such as Tally, Google Forms, CSV exports, or similar systems may remain responsible for collecting applications.

### Rationale
Form building is not the core value of the challenge. The more relevant problem is organizing candidate data, qualifying profiles, scoring, ranking, and explaining results.

### Consequences / limitations
The MVP should start from application data that already exists or from a simple internal/demo input flow. It may still need a lightweight way to enter or import test applications.

## D-004 — Use a canonical application schema

### Context
Different intake sources may represent the same information using different field names and formats. The scoring engine should not depend directly on external form wording.

### Options considered
Score raw submissions directly; configure source-specific field mappings; normalize submissions into a stable internal schema before scoring.

### Decision
Applications will be normalized into a canonical internal schema before validation, LLM criterion scoring and weighted aggregation, and ranking.

### Rationale
This keeps qualification and scoring logic stable and testable. It also lets the frontend and backend reason about one application shape.

### Consequences / limitations
The canonical schema must be defined carefully. Missing or ambiguous data should be represented explicitly rather than guessed.

## D-005 — LLM criterion scoring with weighted aggregation

### Context
The user superseded the deterministic criterion-scoring approach to avoid building a generic evaluation layer.

### Options considered
Deterministic criterion scoring; LLM-inferred individual scores with weighted aggregation in application code.

### Decision
The LLM normalizes raw submissions and infers individual criterion scores and concise explanations. Validate extracted types and returned score bounds. Code applies the configured weights and sums contributions into the global application score. Rank by that score; final selection remains human and there is no automatic rejection or eligibility system.

### Rationale
This keeps criterion assessment flexible while making the final arithmetic consistent with the displayed breakdown.

### Consequences / limitations
Individual assessments may vary. Priority-to-weight conversion and criterion score scale still require definition. Type mismatches must surface as field-specific errors rather than silent coercion. `needs_review` is for missing, ambiguous, or low-confidence extracted data, never low scores. Preserve raw submissions and CV references; motivation is optional.

## D-007 — Use `Program` as the primary domain term

### Decision

Use `Program` rather than `Event`.

Examples:
- Backend Internship
- Frontend Internship
- UX/UI Internship
- Community Manager Internship

### Rationale

`Event` suggests webinars or calendar activities, while the system is centered on selective programs that receive and evaluate applications.

---

## D-008 — Keep the frontend as a restrained admin dashboard

### Decision

The MVP frontend will use a standard internal admin-dashboard structure rather than a highly visual or marketing-style UI.

The main pages are:

```text
/programs
/programs/{programId}
/programs/{programId}/candidates/{candidateId}
```

### Rationale

The core value is the qualification, scoring, ranking, and explainability logic. The frontend should expose that clearly rather than become a separate design project.

---

## D-009 — Programs dashboard

### Route

```text
/programs
```

### Content

Top KPI cards:
- Active Programs
- Closed Programs
- Total Candidates

Programs table:
- Name
- Status
- Candidate count
- Last updated

Each row is clickable and opens the corresponding program.

Example rows:
- Backend Internship
- Frontend Internship
- UX/UI Internship
- Community Manager Internship

Basic controls may include:
- search;
- status filter;
- sorting.

A `Create program` action may exist, but creation remains simple in the MVP.

---

## D-010 — Program detail page

### Route

```text
/programs/{programId}
```

### Main sections

The page is organized around:

```text
Overview
Candidates
Configuration
```

The Candidates section is the main operational view.

### Summary information

Possible program-level KPIs:
- total candidates;
- candidates requiring review;
- average score.

### Candidate table

Candidates are displayed in ranked order.

Suggested columns:

```text
Rank
Candidate
Score
Processing / Review Status
Applied At
```

Candidate ranking is based on total score. Processing status represents extraction and validation quality, independent of score. A low-scoring application can be ready; missing or ambiguous extracted data can require review even with a high score.

---

## D-011 — Program configuration UI

### Decision

Do not build a visual rule engine.

Program scoring configuration should be editable using simple forms.

Update: the user approved fixed criterion types (number, text, select, multiselect), user-entered options, and priority tiers rather than direct percentage inputs. The example below is historical; the tier conversion formula is still to be agreed.

Example:

```text
Skills          30%
Projects        30%
Experience      15%
Availability    10%
Motivation      15%
```

Configuration contains program-specific scoring criteria only. There is no eligibility or prerequisite section. The LLM assesses each criterion; application code calculates weighted contributions and their total.

### Rationale

The scoring system needs to be configurable, but building a generic drag-and-drop rules engine would introduce unnecessary complexity for the MVP.

---

## D-012 — Candidate detail page emphasizes explainability

### Route

```text
/programs/{programId}/candidates/{candidateId}
```

### Content

The page should show:

- candidate identity and basic information;
- overall score;
- score breakdown;
- normalized application data;
- processing / extraction details;
- review status.

Example score breakdown:

```text
Backend Skills   27 / 30
Projects         25 / 30
Experience       14 / 15
Availability     10 / 10
Motivation       13 / 15
```

### Processing information

Where relevant, show:

```text
Source: Tally
Normalization: AI-assisted
Processing status: ready
```

### Rationale

The reviewer should be able to understand not just the final score, but how the candidate reached that score and where the extracted data came from.

---

## D-013 — Application processing should be asynchronous

### Decision

Receiving an application should not wait synchronously for LLM normalization and subsequent LLM criterion scoring and weighted aggregation.

Suggested flow:

```text
Application received
        ↓
Raw submission stored
        ↓
Status = received
        ↓
Background processing job
        ↓
LLM normalization
        ↓
Schema validation
        ↓
LLM criterion scoring and weighted aggregation
        ↓
Status = ready / needs_review / failed
```

`needs_review` identifies missing, ambiguous, or low-confidence extraction. Scoring never sets rejection or review status based on a low total.

### Suggested processing states

```text
received
processing
ready
needs_review
failed
```

### API behavior

Application ingestion may return:

```text
202 Accepted
```

while processing continues asynchronously.

---

## D-014 — Ranking does not require a separate ranking process

### Decision

Each processed candidate stores or exposes:
- final score;
- processing/review status.

The ranking view can simply query candidates ordered by score:

```sql
ORDER BY score DESC
```

### Rationale

This avoids maintaining a separate ranking artifact or recomputing a ranking structure after every application.

---

## D-015 — The UI helps define backend boundaries

The selected UI implies the following capabilities:

```text
GET /programs
GET /programs/{id}

GET /programs/{id}/candidates
GET /programs/{id}/candidates/{candidateId}

GET /programs/{id}/configuration
PUT /programs/{id}/configuration

POST /programs/{id}/applications
```

Candidate-list queries may support parameters such as:

```text
search
status
ordering=-score
```

### Rationale

Designing the UI early clarifies which backend resources, states, and queries are actually necessary.

---

## Resulting MVP flow

```text
Programs
   ↓
Program
   ├── Overview
   ├── Candidates
   └── Configuration
          ↓
Candidate details
          ↓
Score explanation
```

Behind the UI:

```text
External application
        ↓
Ingest
        ↓
Normalize
        ↓
Validate
        ↓
Deterministic score
        ↓
Rank
        ↓
Human review
```

The frontend remains intentionally simple so that the engineering focus stays on the Talent Engine’s core logic.

## Current domain and API assumptions

These describe the intended backend contract; endpoints are not implemented yet.

- Candidate stores identity; Application links a candidate to a program and stores raw/normalized data, CV reference, processing status, extraction warnings, nullable total score, and criterion breakdowns.
- Program configuration contains scoring criteria only, with fixed number/text/select/multiselect types, priority tiers, and type-specific scoring options or ranges. No `EligibilityRule`, eligible flag, prerequisite result, or configurable rejection policy.
- Configuration GET/PUT payloads contain program ID and criteria. Application/list responses expose total score, breakdown where relevant, processing status, and extraction warnings. No eligibility filters or fields.
- Existing candidate-scoped detail routes represent that candidate's application to the specified program; multiple submissions by the same candidate are not yet specified.
- Status filters concern processing; ranking uses total score. Unevaluated applications have a null score and no rank. Equal scores need a stable tie-break; the demo uses application ID.
- UI `/app` routing prefix does not imply an API prefix.


## D-016 — One configuration per program; edits trigger reassessment

### Context
The user rejected configuration versioning as excessive for the MVP.

### Options considered
Versioned configurations; one current configuration with reassessment on edits.

### Decision
Each program has one current scoring configuration. Saving edits triggers fresh LLM inference for all its applications and recomputes totals/ranking. Do not introduce configuration history or versions.

### Rationale
Keep the MVP simpler and evaluate applications against the same current criteria.

### Consequences / limitations
Reassessment is not instantaneous; handling stale scores, failures, and in-progress batches still needs definition. The frontend currently saves configuration in memory and does not implement reassessment.

## D-017 — Program creation and later file intake

### Context
The user requested a reusable child-content Dialog and a program creation form.

### Decision
Program creation asks for name and description. Reuse Dialog for modal presentation. A later application-intake interface will accept JSON/CSV file uploads; its parsing and mapping behavior remain open.

### Rationale
Provide a small creation flow and defer intake details until discussed.

### Consequences / limitations
Other program attributes must be revisited before finalizing the backend contract. The demo creates an Active program with no criteria and zero applications; that is a visible fixture default, not an approved production lifecycle. Creation is memory-only.


## D-018 — PostgreSQL connectivity gates API startup

### Context
The user requested a shared database service and startup failure when PostgreSQL cannot be reached.

### Decision
Use PostgreSQL through the scaffold's SQLAlchemy dependency. The shared DatabaseService verifies connectivity before FastAPI serves requests; a failed check aborts startup. Dispose the pool on shutdown or failed startup.

### Rationale
The API should not accept work without its required database.

### Consequences / limitations
DATABASE_URL must be supplied. The implementation uses async Psycopg, a bounded SELECT 1 startup check, and a session factory. It does not create the database. Alembic manages tables as described in D-020. Live connectivity was verified during migration setup and seeding.

## D-019 — SQLAlchemy table creation without Alembic

Superseded by D-020 after the user approved Alembic.

### Context
The model tables were not being created. The user explicitly chose SQLAlchemy without Alembic.

### Decision
Create missing tables with `Base.metadata.create_all()` during API startup, after checking connectivity and before accepting requests.

### Rationale
Keep initial schema setup small and use the existing SQLAlchemy dependency.

### Consequences / limitations
Table creation failure aborts startup. This creates missing tables but does not migrate existing columns or constraints; those changes require explicit SQL. The PostgreSQL database must already exist.

## D-020 — Alembic migrations

### Context
The user reviewed the documentation and approved Alembic for generating migrations, then requested database seeding.

### Options considered
SQLAlchemy `create_all()` creates missing tables but does not evolve existing ones. Alembic generates reviewable schema-change scripts.

### Decision
Use Alembic with the existing SQLAlchemy models and DATABASE_URL. Remove startup `create_all()`. Generate, review, and apply migrations explicitly. Provide a repeatable demo seed script.

### Rationale
Support schema changes while keeping startup and schema management separate.

### Consequences / limitations
Generated migrations need review, especially renames. The existing database matched the initial model schema and was stamped at revision 0001. `alembic check` passed. Seeding created four programs, seven candidates, and seven received applications; a second run created none. Missing email, scoring, and extraction data remain schema gaps.


## D-021 — Program Overview without lifecycle status

### Context
The user requested Overview with editable program attributes and agreed Open/Closed has no useful behavior in this application.

### Options considered
Retain a display-only lifecycle, or remove it and focus on application processing progress.

### Decision
Remove program Open/Closed status, its filters and KPIs, and backend `is_active`. Enable Overview with editable name/description and counts for total applications, review, pending/processing, and failures. Application processing statuses remain.

### Rationale
Expose useful program information without inventing an intake lifecycle. Attribute edits do not affect scoring configuration.

### Consequences / limitations
Frontend editing uses the existing demo store until API integration. Backend read/update endpoints exist, and migration 0002 removes the status column. Historical decisions mentioning Active/Closed are superseded here. Application model/migration drift predates this change and remains to resolve.


## D-022 — Explicit Axios services and Result responses

### Context
The user specified the frontend API integration style and asked for endpoints and schemas for current screens.

### Decision
Use Axios, one service file per model, and explicit functions returning Promise<Result<T>> with data/error fields. Hooks own data access; components remain presentation code. Put backend Pydantic schemas in module schemas.py files.

### Rationale
Keep API calls easy to find and replace without introducing service classes or generic request patterns.

### Consequences / limitations
Services preserve Axios errors, including field-validation details. Screen hooks still use mocks until integration. Application endpoints expose existing persisted fields; extraction/warnings and configuration reassessment are not fabricated.


## D-023 — Configuration module and explicit rescoring

### Context
The user requested a nested configuration module, JSON persistence, confirmation dialogs, and control over potentially costly rescoring.

### Options considered
Automatic rescoring on every save, or a reviewer-controlled save-and-rescore choice plus a separate rescore action.

### Decision
Keep the program's single JSON configuration, owned by programs/configuration. Confirm saves with the shared Dialog and let reviewers choose save-only or save-and-rescore. Provide a separate rescore button. All frontend data-access hooks use Axios model services; table filters run on the API.

### Rationale
Persist the existing configuration shape and give the reviewer explicit control over LLM costs.

### Consequences / limitations
This supersedes earlier automatic-rescoring instructions. The engine is not implemented: rescore returns 501, leaving saved config and existing scores intact. Scores can reflect prior criteria until reassessment. Candidate details use a single scoped endpoint; missing extraction data remains unavailable. Tests verify JSON validation, persistence, global ranking under filters, and ambiguous application selection.

## D-024 — Injected program service

### Context
The programs API mixed routing with queries, ranking, and persistence.

### Options considered
Keep everything in route handlers, extract functions, or use a service class; a separate repository would add another layer.

### Decision
Use a `ProgramService` class initialized with the request's database session and injected into routes through FastAPI dependencies. Keep the existing program-scoped operations and API contracts together for now.

### Rationale
The user requested the class and database injection. Routes delegate to explicit methods without a repository layer.

### Consequences / limitations
Behavior remains unchanged. The service still uses existing HTTP exceptions; it is not a framework-independent domain layer. Configuration remains in its existing module.

## D-025 — OpenRouter through the OpenAI SDK

### Context
Application processing needs an LLM connection. The user requested an LLM service using the OpenAI SDK with an OpenRouter API key.

### Decision
Use `AsyncOpenAI` pointed at OpenRouter in `shared/llm.py`. Read the key and selected model from `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.

### Rationale
Follow the requested SDK and provider without introducing another framework.

### Consequences / limitations
The connection service is implemented. Model selection, normalization/scoring contracts, and processing integration remain undecided or unfinished; no live LLM calls were made during verification.


## D-026 — Durable import and scoring jobs without object storage

### Context
Imports need independent row processing, traceability and durability despite Render's ephemeral filesystem. The user approved implementation after clarifying separate import/scoring operations.

### Options considered
Object storage, one generic job with child items, or separate operation-specific jobs with raw submissions in PostgreSQL.

### Decision
Use ImportJob (program, raw rows, progress/errors, created applications) and ScoringJob (program and one application). Parse files before acknowledgement and persist raw rows. Keep CVs at their external source URLs and download them temporarily for reading. Run an asyncio polling worker alongside the API. LLM normalization and criterion scoring remain separate; backend computes the weighted 0–100 total using 3/2/1 priorities.

### Rationale
Avoid unfamiliar queue infrastructure and file archives while retaining incremental results and restart checkpoints.

### Consequences / limitations
A free Render instance pauses work when sleeping. PDF text extraction has no OCR. Failed rows remain recorded, with no automatic retry UI. Worker configuration snapshots describe executions, not program configuration versions. Original CV access depends on its host. Import limits and two-decimal score display are implementation defaults.

## D-027 — Application contains applicant identity

### Context
The user explicitly confirmed that candidate and application are now one model during processing implementation.

### Decision
Merge identity/contact data into ProgramApplication; remove the separate Candidate ORM model and API contract. Detail routes identify applications directly.

### Rationale
The MVP reviews applications within programs and does not need cross-program identity management.

### Consequences / limitations
Migration 0004 copies existing linked candidate data before dropping candidates. Application IDs remain unchanged; old candidate-detail URLs are replaced. Reverting the merge requires a database backup. This supersedes earlier Candidate → Application relationship decisions.
