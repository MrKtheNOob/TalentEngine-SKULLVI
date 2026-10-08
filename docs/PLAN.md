# Implementation Plan

## Current objective
Validate the complete import → normalization → scoring workflow with a real configured model.

## Completed milestone
Application now owns applicant identity. Separate ImportJob and ScoringJob tables persist work. Imports commit raw rows before acknowledgement and save applications progressively. An asyncio worker handles normalization, temporary PDF reading, validation, weighted scoring, and restart checkpoints. Frontend upload, job progress, application details and explicit rescore actions use the API.

## Next milestone
Apply migration 0004 to a running PostgreSQL database, import a small real export, and verify CV extraction and LLM criterion results.

## Tasks
- [ ] Apply and check the migration against PostgreSQL (local server was unavailable during implementation).
- [ ] Choose/configure the OpenRouter model and test a real text PDF link.
- [ ] Review extraction warnings, field-type validation errors and score explanations.
- [ ] Confirm how reviewers should correct uncertain data; define a numeric confidence threshold if needed.
- [ ] Verify deployment restart recovery and document Render free-tier sleep behavior.

## Deferred ideas
Application deletion from the UI/API (including the behavior for associated jobs).

Object storage/original-file archives, OCR, automatic retry policies, configuration versions, separate always-on workers and reviewer collaboration.
