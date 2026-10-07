# Backend

All routes below are mounted under `/api` (for example `/api/programs/`).

FastAPI with SQLAlchemy's async PostgreSQL engine and Psycopg.

## Run

Install dependencies with `uv sync`. Set `DATABASE_URL` in your environment or in a local `.env` file using `.env.example` as the template. Supply an existing PostgreSQL database. Apply Alembic migrations before starting the API; startup does not modify the schema.

From this directory:

```sh
uv run alembic upgrade head
uv run --env-file .env uvicorn main:app --reload
```

Startup checks `SELECT 1` before serving requests. Missing/invalid configuration, connection failures, authentication errors, or a timed-out check abort startup. The pool is disposed on failure and shutdown. Connect timeout is 5 seconds; the overall check has a 10-second deadline. The initialized service is available at `request.app.state.database`; use its `sessions()` factory for a session per unit of work. Do not share one session across requests.

## Program service

`programs/api.py` injects `ProgramService` through `get_program_service`, which receives the request session from `get_db`. The class in `programs/service.py` owns queries, ranking, and persistence for program-scoped operations. Routes declare HTTP inputs and delegate to its methods. Configuration retains its separate module; no repository layer is introduced.

## Programs query parameters

`GET /programs/?sort=candidates&search=backend`

- `sort`: `updated` (default, newest first), `name` (ascending), or `candidates` (highest count first). Name and ID break ties.
- `search`: optional trimmed, case- and accent-insensitive name substring.

Counts include all applications and retain programs with zero applications. Responses include `updated_at`. Sorting uses database collation rather than the browser's French locale. Name search runs in Python for this small, unpaginated MVP. Invalid sort values return HTTP 422.

Run query tests with `uv run python -m unittest discover -s tests -v`.

## Schema changes

After changing models:

```sh
uv run alembic revision --autogenerate -m "Describe the schema change"
# Review the generated migration before applying it.
uv run alembic upgrade head
uv run alembic check
```

Autogenerate compares models with the live database; it does not safely infer every change (especially renames). Initial migration `0001` creates the three model tables. For tables previously created with `create_all()`, use `alembic stamp 0001` only after verifying that the existing schema matches that revision.

## Demo data

```sh
uv run python seed.py
```

Seeds four fictional internship programs, seven candidates, and seven applications. Reruns skip matching programs by name, candidates by email, and applications by program/candidate; existing records are preserved. Run one seed process at a time. These matching rules are seed mechanics, not domain uniqueness constraints.

Applications start as `received`; no evaluation is fabricated. Scores and extracted details are not yet modeled. The missing-email demo candidate is omitted because the current schema requires email. Awa's CV path refers to the existing frontend demo asset. Program configurations remain unconfigured.

## Program overview and editing

`GET /programs/{id}/overview` returns `total`, `review` (`needs_review`), `processing` (`received` + `processing`), and `failed` application counts. Missing programs return 404.

`PATCH /programs/{id}` accepts optional `name` and `description`. Names are trimmed and cannot be blank or null. Description may be cleared. Other attributes are rejected. Editing these fields does not rescore applications.

Programs have no Open/Closed lifecycle. Migration 0002 removes `is_active`; downgrading restores the column with `true` but cannot recover former status values. Frontend hooks call these endpoints; program edits persist across reloads.

## Application list and detail

- `POST /programs/`: create a program with name and optional description.
- `GET /programs/{id}/applications?status=needs_review&sort=recent&search=awa`: application table data.
- `status`: `all` (default), `received`, `processing`, `ready`, `needs_review`, or `failed`.
- `sort`: `score` (default, highest first, null scores last) or `recent` (newest submission first). ID breaks ties.
- `search`: trimmed case/accent-insensitive substring of candidate name/email.
- `GET /programs/{id}/applications/{application_id}`: one application scoped to its program.

Responses include candidate identity/contact, score, stored rank, processing status, and creation timestamp. Rank is computed across all scored program applications before filtering, using descending score and ID to break ties. Unscored applications have null rank. These endpoints do not infer scores. Candidate relations are eagerly loaded for async serialization. Missing programs/applications return 404. No eligibility filtering or rejection is introduced.

Pydantic models live in `programs/schemas.py`, `candidates/schemas.py`, and `program_applications/schemas.py`. Configuration persistence is implemented in the nested module. LLM reassessment and extracted details/warnings remain pending.

## Program configuration

The `programs/configuration` module owns its JSON field mapping, Pydantic schemas, and routes. The JSON remains in the programs table; no extra table or configuration versions are introduced.

- `GET /programs/{id}/configuration`: saved criteria, or an empty criteria list.
- `PUT /programs/{id}/configuration`: validate and replace the current JSON configuration. The body uses the frontend's `programId`, `criteria`, and `scoreTier` fields. The URL and body program IDs must match.
- `POST /programs/{id}/configuration/rescore`: explicit rescore request. Returns 409 without saved criteria, or 501 while the LLM engine is unavailable. It never clears existing scores or reports nonexistent work.
- `GET /programs/{id}/candidates/{candidate_id}?application_id={id}`: program/application detail in one request. Missing or mismatched records return 404; multiple applications without selection return 409.

Config validation rejects unknown types/priorities, blank names/guidance, duplicate IDs/names/options, nonfinite numeric bounds, and overlapping ranges. Saving does not rescore automatically. Existing scores remain unchanged and may correspond to the previous configuration until successful reassessment.
