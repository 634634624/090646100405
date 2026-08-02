# AGENTS.md — generated UUI client site (read FIRST)

This repository was emitted by the canonical UUI Site Factory
(`634634624/uui-components-browser`). It contains the exact resolved source
closure, tokens, and provenance for one client site — it is NOT the factory and
NOT the Brand Library.

## Visual generation authority — canonical prompts only

The ONLY visual-generation authority for this repository are the canonical
owner prompts, embedded below and fingerprinted in `.uui/prompt-receipt.json`.
Legacy UI-generation skills, ad-hoc design instructions, and memory-derived
component recreation are REJECTED — do not use them.

- [`create-creatively.txt`](.uui/canonical-prompts/create-creatively.txt) · sha256 `340e5cc5153e9887f06c00a6ea68f39915d81c66c91d955984a00eca85b0f14e`
- [`enforce-dashboard-layout.txt`](.uui/canonical-prompts/enforce-dashboard-layout.txt) · sha256 `5638d2420a6c59e520260a200b3a1b5896d7228f4cb7b7da2ae09e60bef67823`
- [`enforce-layout-structure.txt`](.uui/canonical-prompts/enforce-layout-structure.txt) · sha256 `0071b2b2a1e7e89cbbc273069ddb63dc2de8045cdc69f33962cbb3457b52ff85`
- [`use-visual-assets.txt`](.uui/canonical-prompts/use-visual-assets.txt) · sha256 `ab49d1bc58718d9f48c8fac7121d352a06df7d719108b97a8aa4e2113fcdb487`
- [`visual-universal.txt`](.uui/canonical-prompts/visual-universal.txt) · sha256 `42559260d672d639257ab857ca6b86bafd636d1451929fb62b09b83160376dc9`

Combined authority fingerprint: `sha256:8d240af55929e4e6d3feb743bb0a9f2adcf6290b802da468d2d465fbcb59da4a`

## Release authority

Read [`WEB-BUILD-GAUNTLET.md`](.uui/WEB-BUILD-GAUNTLET.md) before any
site change. Its pinned SHA-256 is `4c8f972cf98f3771d3d139dc6cee93d8d4753d233624b99a038ebdacfa94cea9`; the receipt
is `.uui/gauntlet-receipt.json`. It defines risk-scaled browser, visual,
accessibility, performance, SEO, security, evidence, and residual-risk gates.

## Hard rules

- Factory mode is `ASSEMBLY`, recorded in
  `.uui/factory-mode.json`. `ASSEMBLY` means compose and configure indexed
  UUI assets only. Existing emitted sources under `src/components/**` and
  `toolkit/**` are immutable; creating or changing components there fails
  `npm run quality:lint`.
- If exact Library search finds no suitable asset: STOP. Ask the owner:
  (1) may a reusable component be created, (2) what exact job/states it needs,
  (3) why current alternatives are insufficient, and (4) which existing
  composition or scope deferral to use if creation is denied. Component work
  happens only in the canonical Factory after the separate
  `ComponentCreationRequestV1` owner-approval gate; then the indexed asset is
  consumed here through a new `ASSEMBLY` plan.
- Existing UUI components (under `src/components/**` and `toolkit/**`) are
  mandatory before any new UI code. Hand-written native `button`, `input`,
  `select`, `textarea`, radio, checkbox, dialog/modal, drawer, filter, or
  product-card equivalents are FORBIDDEN when an owned UUI primitive exists —
  `npm run quality:lint` enforces this mechanically on all new/changed files.
  Genuine platform exceptions require an explicit same-line
  `uui-native-allow: <reason>` annotation.
- Never copy this repository's contents back into the factory, and never turn
  the factory into a client brand.
- New component needs return to the canonical factory for Library discovery,
  source resolution, and exact-closure emission. Never recreate a missing UUI
  component from memory inside this client.
- Provenance is binding: `.uui/build-plan.json` and
  `.uui/artifact-manifest.json` describe exactly what was generated and from
  which pinned sources. Do not edit them by hand.
- Environment variables are configured by NAME only (see the integration
  contracts); secrets never enter this repository.
- Raw headless Chrome commands are forbidden. Use
  `npm run browser:screenshot -- ...`; it applies a hard timeout and owns the
  full process group. Every browser QA closeout must leave
  `npm run browser:stale:check` green with zero orphaned processes.
- UUI token authority is mechanical: new code must use semantic UUI classes.
  Raw Tailwind palette classes, arbitrary hex utilities without a documented
  fixed-color exception, dynamic Tailwind token interpolation, and foreign icon
  libraries fail `npm run quality:lint`.

## Git ownership — collision prevention

- Before work: `git status --short && git branch -vv && git log --oneline -5`.
- One AI owns one branch and one worktree. Never let two agents write the same
  branch or worktree, and never touch another agent's uncommitted files.
- Commit coherent green checkpoints. Never use `--no-verify`, never
  force-push `main`, and push/deploy only with explicit owner authority.
- Generated provenance files under `.uui/` are immutable evidence. Client
  changes belong in normal source files and must keep their own commits.

## Agency OS write-back

- Agency OS owns client identity, recipe, providers, approvals, readiness,
  blockers, and next action. This repository owns implementation evidence.
- After verified work, record the exact client commit, commands, route/viewport
  evidence, blockers, and next action through the Agency OS bounded API or the
  explicitly supplied PM write-back target. Never invent completion or mutate
  browser-local delivery state from shell code.
- Production provider, checkout, domain, and deployment changes always require
  separate explicit approval.

## Gates (all must pass before closeout)

`npm run quality:closeout`

The gauntlet verifies implementation against the recorded contract. Human
review validates proposition, composition, content, and commercial outcome.
