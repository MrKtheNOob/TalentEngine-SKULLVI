# Implementation Plan

## Current objective
Package the deployed MVP for reviewer handoff; avoid adding features.

## Completed milestone
- Programs, overview/editing, scoring configuration, applications, candidate details and imports are connected to the API.
- Applications own applicant identity. Persistent import/scoring jobs support incremental saves and checkpoints. CV reading uses PDF extraction with OCR fallback; LLM criterion scores are validated and combined by weighted average.
- Migrations have been applied locally. The user verified live import, OCR and scoring with persisted applications.
- Cookie authentication, login/logout, protected API routes and frontend guards are implemented. Local HTTP tests and headless Chromium verified login, refresh, access denial and logout with isolated test data.
- Frontend is hosted on Vercel and backend on Render; the user reports deployment working. The dashboard was removed; Programs is the entry page.

## Next milestone
Deliver a reproducible setup and a short reviewer walkthrough of the deployed app.

## Remaining tasks
- [ ] Add the exact Vercel demo URL to the README and send reviewer credentials separately.
- [ ] Confirm deployed login → refresh → import → scoring → logout and anonymous API denial before handoff.
- [ ] Verify pending-job recovery after Render sleep/restart; do not claim hosted recovery has been tested yet.
- [ ] Confirm a private JWT secret is configured and demo credentials are appropriate for the shared environment. The code still has a fallback signing secret and a fixed-password demo seeder.

## Deferred ideas
Manual correction of uncertain extraction, object storage/original-file archives, automatic retries, configuration versions, separate always-on workers, roles and reviewer collaboration. Security hardening beyond the current demo includes CSRF protection and token revocation.
