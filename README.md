# Generated UUI client site

Independent Astro client emitted by the canonical UUI Site Factory in
`634634624/uui-components-browser`.

## Start

1. Read `AGENTS.md`.
2. Inspect `.uui/build-plan.json`, `.uui/prompt-receipt.json`, and
   `.uui/artifact-manifest.json`; read `.uui/WEB-BUILD-GAUNTLET.md`.
3. Activate the pinned runtime and install exactly: `nvm use && npm ci`.
4. Verify before and after changes:
   `npm run quality:closeout`.

Every push to `main` and every pull request runs the same closeout through
`.github/workflows/quality.yml`.

The repository contains only its resolved UUI source closure, token layers,
assets, and receipts—not the complete Brand Library or Agency OS.

## Boundaries

- Secrets stay in the selected provider/hosting environment.
- Mock integrations remain mock until Agency OS records a reviewed provider
  choice and explicit live approval.
- PhantomWP is an optional remote execution and visual-QA environment. It does
  not replace this repository, its receipts, Agency OS, or the canonical
  Factory.
- Production deployment is never implicit.
