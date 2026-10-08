# Frontend

React, TypeScript, Vite, Tailwind and Lucide. UI data access stays in hooks; Axios services return explicit `Result<T>` values with data/error fields.

## Run

```sh
npm install
npm run dev
```

The Axios client defaults to `/api`. Vite proxies that prefix to `http://127.0.0.1:8000` without rewriting it. Production needs a reverse proxy or `VITE_API_URL` pointing to the backend; a different origin also needs backend CORS configuration.

## Pages

- `/app/programs`: list/search/sort and create programs.
- `/app/programs/:programId`: overview, applications and scoring configuration.
- `/app/programs/:programId/applications/:applicationId`: identity, flexible extracted facts, CV/portfolio links, warnings and score breakdown.
- `/app/imports`: upload CSV/JSON and follow import/scoring jobs.

Application identity is flat in the API; no separate Candidate model/service exists. Candidate names remain in presentation component filenames and reviewer-facing terminology.

## Import and scoring integration

`FileImportForm`, `ImportFilePicker` and `ImportJobsPanel` keep upload presentation separate from job data access. `jobService` and `useImports` submit multipart files and read persisted job progress. A checkbox controls automatic scoring when saved criteria exist. Success means the import was accepted and persisted, not that processing finished.

Screens fetch on entry. One program-scoped job check refreshes detail/overview/application data every three seconds only while import or scoring jobs are pending/running, with a final refresh on completion. Successful rescore requests restart this check. Import history follows the same active-job rule and restarts after uploads. Polls are scheduled after each request finishes to avoid overlap. Import history shows progress and row failures; scoring history links to each application. API parsing and validation are authoritative; file extensions and empty-file checks are only early frontend feedback.

Configuration save offers save-only or save-and-rescore, plus a separate rescore button. A successful request queues evaluations (202). Scores remain until successful reevaluation; saved configuration changes remain even if queue submission fails. Missing LLM settings return 503.

Model services are `programService`, `programApplicationService`, `configurationService` and `jobService`. There are no interceptors or generic request wrappers. API response fields use snake_case; narrow hooks adapt display types. Configuration retains its existing camelCase JSON shape.

Apply backend migration 0004 and configure the OpenRouter model/key before using processing. Mock fixtures are not used as replacements for live data. Original import files are not archived; original remote CV links remain available subject to their source host.

## Checks

```sh
npm run build
npm run lint
node --test tests/*.test.cjs
```
