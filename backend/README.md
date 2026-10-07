# Backend

FastAPI with SQLAlchemy's async PostgreSQL engine and Psycopg.

## Run

Install dependencies with `uv sync`. Set `DATABASE_URL` in your environment or in a local `.env` file using `.env.example` as the template. Supply your existing PostgreSQL database and credentials; this app does not create a database or tables.

From this directory:

```sh
uv run --env-file .env uvicorn main:app --reload
```

Startup checks `SELECT 1` before serving requests. Missing/invalid configuration, connection failures, authentication errors, or a timed-out check abort startup. The pool is disposed on failure and shutdown. Connect timeout is 5 seconds; the overall check has a 10-second deadline. The initialized service is available at `request.app.state.database`; use its `sessions()` factory for a session per unit of work. Do not share one session across requests.

```sh
uv run python -m unittest discover -s tests -v
```

Tests cover startup gating and cleanup with mocks; they do not require a running PostgreSQL instance.
