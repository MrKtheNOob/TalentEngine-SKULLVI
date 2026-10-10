# Backend

FastAPI, async SQLAlchemy/PostgreSQL, and the OpenAI SDK pointed at OpenRouter. All routes use the `/api` prefix.

## Run

```sh
uv sync
# Set DATABASE_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL and CORS_ORIGINS in .env.
# Export JWT_SECRET before starting the API (currently read at module import).
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

PostgreSQL connectivity is checked on startup. The API does not create or migrate tables automatically. Missing LLM settings leave reads and program editing available, but import/scoring submissions return 503.

Migration `0004` copies existing candidate identity/contact into applications, preserves application IDs, removes the candidates table and stored rank, and adds processing data plus job tables. This consolidation has no automatic downgrade: use a backup to restore the former schema.

## Authentication and deployment

All routes require a valid `access_token` cookie except POST `/api/auth/login`, POST `/api/auth/logout` and CORS preflights. GET `/api/auth/me` returns the current user. Login sets a 30-minute JWT in an HttpOnly cookie; logout expires that cookie. Swagger is also protected. Each middleware lookup and endpoint service uses its own database session.

`CORS_ORIGINS` is a comma-separated list of exact frontend origins, without paths/trailing slashes. `COOKIE_SECURE=false` uses a local HTTP cookie with SameSite=Lax; `true` uses Secure and SameSite=None for cross-site HTTPS deployment. Credentialed CORS is enabled. `JWT_SECRET` is currently read before config loads dotenv, so export it before startup or configure it directly on Render. The fallback signing key is not suitable for deployment. Logout does not revoke copied JWTs; no roles, password recovery, dedicated CSRF protection or token revocation store is implemented.

See the root [README](../README.md#authentification-et-déploiement) for Render/Vercel commands and variables. Deployment is reported working by the project owner; hosted worker restart recovery remains unverified.

## Application and jobs

Application is the single identity + submission model (`ProgramApplication` in code). It belongs to a program and optionally an import job. Identity fields are name, nullable email/phone, CV URL, and portfolio URL. Raw data, flexible normalized facts, extraction metadata, and score breakdowns are stored as JSON. The final score is nullable and rounded to two decimals. Rank is calculated dynamically before table filtering.

There are two separate job tables, with no job inheritance or item table:

- `ImportJob`: program, filename, raw rows, next-row checkpoint, per-row errors, auto-score option, status and timestamps. Its applications are related through `import_job_id` and `import_row`.
- `ScoringJob`: program, application, configuration used for that execution, status, error and timestamps. Program-wide rescoring creates one job per normalized application. Identical pending/running requests are skipped. Edited criteria replace an unstarted job’s config or enqueue a follow-up after a running evaluation.

Job statuses are pending/running/completed/failed. An import can complete with row failures; its progress distinguishes successful and failed rows. Failed raw rows remain in its database payload, with errors identifying their one-based submission positions.

## Processing

The API parses uploads and commits raw submissions before returning 202. Original CSV/JSON files are not archived and object storage is not required.

```text
Import job → each raw row → LLM identifies facts and CV URL
  → download/read PDF (OCR fallback if no text) → LLM incorporates CV text
  → validate → save application + optional scoring job + checkpoint

Scoring job → normalized facts + saved criteria
  → LLM returns criterion scores, values and explanations
  → validate → calculate weighted average → save score + breakdown
```

Every row commits independently. A failure does not undo preceding applications or stop following rows. When auto-score is selected and criteria exist, successful imports enqueue scoring jobs. Evaluation runs after pending imports; the worker processes jobs sequentially.

The worker is an asyncio task launched during FastAPI lifespan and polls PostgreSQL every two seconds. A PostgreSQL advisory lock elects one worker across API processes; job claiming uses row locks. Sessions belong to the worker rather than an HTTP request. Shutdown cancels the task before closing clients.

On restart, the elected worker requeues interrupted running jobs. Application creation and import checkpoint updates share a transaction, avoiding duplicate applications on resume. An interrupted LLM call can be repeated and billed again. Failed jobs/rows are not retried automatically. The SDK retains its own request retry behavior.

A worker inside a Render free web service stops when that service sleeps. Persisted jobs resume when it wakes; this is not an always-on processing guarantee.

## Supported imports and CVs

- UTF-8 JSON: nonempty array of objects.
- UTF-8 CSV: comma-separated, with distinct nonempty headers and one submission per row.
- Imports are limited to 10 MiB and 1,000 submissions.
- CVs use external HTTPS links accessible without interactive authentication. Original URLs are preserved for reviewers, including access-token query parameters.
- CV download limits: 10 MiB, 30 PDF pages, 30-second network timeout and bounded redirects. Local/private network destinations are rejected. Document extraction runs off the event loop.
- Text PDFs use pypdf first. Valid PDFs without text use `shared/ocr_service.py`, which sends the downloaded bytes to OpenRouter's `file-parser` plugin with `mistral-ocr`. It reuses the existing OpenRouter client/key/model and reads extracted text from file annotations, not the model's answer. OCR incurs provider charges in addition to the completion; no local OCR installation or object storage is needed.
- Encrypted/malformed PDFs do not trigger OCR. OCR failures or empty results produce review warnings without discarding the form answers. Blurry scans can still be misread; normalized extraction remains subject to human review. The system does not archive its own copy, so later access depends on the source host.

Normalization validates identity, flexible facts and confidence/warnings. Missing email or an unreadable CV produces a warning. If a name cannot be identified, that row fails without fabricating identity. `needs_review` follows extraction/scoring warnings or validation failures, never a low score. No numeric confidence threshold is imposed yet; the normalization prompt requires warnings for uncertain extraction.

The scoring output must contain exactly the configured criterion IDs, numeric 0–100 scores, explanations and interpreted values. Values must match configured types/options; missing values are explicitly flagged. The LLM supplies judgment, not the official total:

```text
high = 3, medium = 2, low = 1
final score = sum(criterion score × weight) / sum(weights)
```

A failed rescore retains the previous score and breakdown and records an error for review. Saving config alone does not enqueue work. Existing scores may reflect earlier criteria until successful reassessment; no configuration versions or freshness marker are implemented. Final selection remains human.

## API

| Endpoint (under /api) | Behavior |
| --- | --- |
| GET/POST `/programs/` | List/create programs |
| GET/PATCH `/programs/{id}` | Read/edit name and description |
| GET `/programs/{id}/overview` | Processing counts |
| GET `/programs/{id}/applications` | Search, status filter and sorting |
| GET `/programs/{id}/applications/{application_id}` | Scoped application |
| DELETE `/programs/{id}/applications/{application_id}` | Delete application and its scoring jobs; 204, or 409 while scoring runs |
| GET `/programs/{id}/applications/{application_id}/detail` | Program plus application processing details |
| GET/PUT `/programs/{id}/configuration` | Read/validate/save the single JSON configuration |
| POST `/programs/{id}/configuration/rescore` | Queue evaluations; 202, or 409 without criteria |
| POST `/jobs/imports` | Multipart `file`, `program_id`, `auto_score`; 202 after persistence |
| GET `/jobs/imports` | Import progress/errors; optional program_id filter |
| GET `/jobs/imports/{id}` | One import's progress/errors |
| GET `/jobs/scoring` | Scoring history; optional program_id filter |
| POST `/jobs/scoring/{program_id}/{application_id}` | Queue one application evaluation |

Program filters: `search` (case/accent insensitive), `sort=updated|name|candidates`. Application filters: `search`, `status=all|received|processing|ready|needs_review|failed`, `sort=score|recent`. Unscored applications remain visible with null scores/ranks. Programs have no Open/Closed lifecycle.

Application deletion is confirmed on the frontend detail page. It preserves the program/configuration and import history/checkpoint, including the original raw row. Pending scoring jobs are locked and removed along with completed/failed evaluations. Running scoring must finish before deletion; job cancellation is not implemented.

## Tests and demo data

```sh
uv run pytest
uv run python seed.py
```

Tests exercise SQL queries, upload endpoints, checkpoints/recovery, row failures, CV handling, strict score validation, weighted arithmetic and configuration snapshots. LLM calls and CV download content are mocked: tests incur no provider charges.

Pytest and pytest-asyncio are development dependencies installed by `uv sync`. Async tests run automatically. Shared fixtures in `tests/conftest.py` create and clean up an isolated SQLite database per test; they never connect to the development PostgreSQL database. Run one module with `uv run pytest tests/test_jobs.py`, or select a behavior with `uv run pytest -k scoring`. Standard-library `unittest.mock` is retained for mocks; test cases and assertions use pytest.

Seed creates four fictional programs and seven applications, matching by program/email on reruns. Existing data is not overwritten. Seed applications have no fabricated extraction or score; scoring requires normalization data from an import. `docs/examples/import.json` is a small fictional input example.

Seed also creates the demo account `admin@example.com` (username `admin`) using the fixed demo password currently defined in `seed.py`, stored as a bcrypt hash. Rerunning preserves existing accounts/passwords. No credential environment variables are needed. The current console output can display an application email instead of the account email; use the account defined in the script. This is a local/demo account, not production provisioning. Apply `uv run alembic upgrade head` before seeding; do not run the seeder automatically on service startup.

`shared/llm_service.py` uses [OpenRouter's SDK-compatible endpoint](https://openrouter.ai/docs/quickstart). Select an OpenRouter model through the environment; no default model is chosen. The LLM service uses a 60-second timeout, rejects empty/incomplete completions, and leaves JSON validation to the processing schemas.
