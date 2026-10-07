# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.


## API services

Model services live in `src/services`: `programService`, `candidateService`, and `programApplicationService`. Each explicit Axios function returns `Promise<Result<T>>` with either data or an Error. Axios errors retain HTTP responses and field-validation details; use `axios.isAxiosError(result.error)` when inspecting them. There are no interceptors or generic request wrappers.

The shared Axios instance defaults to `/api`. Vite proxies `/api` to `http://127.0.0.1:8000` during development. Set `VITE_API_URL` to override the base URL. Production needs its own `/api` reverse proxy or a configured API URL. All screen data-access hooks now call model services. Forms await successful writes before closing; failed writes retain inputs. Table hooks send search/status/sort to the API. Backend response types keep snake_case fields; narrow hooks map them to display types. Configuration uses the existing camelCase JSON shape.

Service tests: `node --test tests/services.test.cjs`.

Configuration is persisted through its service/hook. Save confirmation offers save-only or save-and-rescore; a separate button requests rescoring using saved criteria. Rescoring currently returns HTTP 501 because no LLM engine exists. Saved changes are kept even if rescoring fails. Extracted candidate fields, warnings, and score explanations display as unavailable until the backend stores them; mock details are not mixed with live records.

Candidate detail uses one scoped endpoint returning program and application. Table links retain candidate routes and include applicationId to identify the exact application. Ambiguous older links report an error rather than selecting arbitrarily. API prefixes are preserved through the development proxy. Restart the backend after loading new routes.
