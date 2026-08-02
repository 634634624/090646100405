# Web Build Gauntlet

Canonical release-verification contract for every React + Astro client emitted by the UUI Site
Factory. Read with `CONVENTIONS.md`, the relevant `section-system/` specifications, and the emitted
client `AGENTS.md`.

The gauntlet proves that the implementation satisfies explicit acceptance criteria. It cannot prove
that the chosen proposition, copy, composition, or commercial direction is the right one. Human
validation remains mandatory.

## 1. Risk profile first

Choose the highest applicable profile. Do not run expensive ceremony without a matching failure
mode, and do not downgrade a transactional surface to save time.

| Profile | Typical site | Required additions |
|---|---|---|
| A — content | brochure, portfolio, local service, campaign | Core gauntlet |
| B — transactional | form, booking, search, cart, hosted checkout, provider API | Core + provider contract/error tests + critical-flow E2E + property tests for money/state |
| C — identity/data | login, account, personal data, admin, custom payment | B + authorization matrix + OWASP ASVS L1 review + audit/monitoring/rollback evidence |

Shopify-hosted checkout is Profile B while payment and customer details remain on Shopify. Custom
card handling immediately becomes Profile C and is forbidden unless separately designed and
approved.

## 2. Core gauntlet

### Acceptance

- Record concise executable scenarios for every critical flow: desktop, 375px, loading, empty,
  success, failure, and recovery. Gherkin is optional; executable coverage is not.
- Name the conversion goal and primary action for every route.
- List deliberate mock data, placeholders, disabled integrations, and launch blockers.

### Authority and architecture

- Start from the latest canonical Factory and pass `npm run site:factory:preflight`.
- Use the pinned owner prompts, active Library index, semantic UUI tokens, UUI PRO line icons,
  Agency recipe, and resolved BuildPlan receipt.
- Reuse owned sections and primitives. Do not rebuild controls, drawers, cards, or filters from
  memory.
- One AI owns one branch and worktree. Generated provenance is immutable.

### Static correctness

- Strict TypeScript/Astro check, source-quality lint, production build.
- No unresolved, circular, or unused closure introduced by the change.
- Client build must not depend on the Factory filesystem, private registries, network fetches, or
  secrets.

### Logic and integration

- Unit tests cover pure business logic and boundary values.
- Component tests cover interactive states where browser E2E would be needlessly broad.
- Provider contracts cover success, timeout, malformed response, empty response, and safe error
  presentation.
- Critical flows run in a real browser. Coverage percentages never replace named flow coverage.

### Rendered browser matrix

- Audit every built route at 375px and desktop in light and dark themes.
- Fail on console/page errors, failed same-origin requests, horizontal overflow, broken images,
  missing or duplicate H1, dead primary links, or an automatically opened modal/drawer.
- Exercise critical interactions by doing them. Verify focus return after modal/drawer close.
- Capture representative viewport screenshots, not only scaled full-page images.
- Launch shell screenshots only through `npm run browser:screenshot -- ...`; raw headless Chrome is
  forbidden. Closeout must report `npm run browser:stale:check` with zero orphaned processes.
- Critical heroes must expose their media in the first visual experience and avoid a large empty
  CTA-to-media void. First-fold density is a measured acceptance criterion.

### Accessibility

- Automated axe WCAG 2 A/AA scan on the browser matrix.
- Keyboard E2E: visible focus, logical tab order, Escape close, focus trap, focus return, form error
  association, and disabled/loading semantics.
- Automated axe is a floor; contrast, copy clarity, reduced motion, and interaction meaning still
  receive human review.

### Performance

- Images reserve dimensions, above-fold media receives deliberate priority, fonts are bounded, and
  islands exist only where interaction requires them.
- Before preview/release, enforce project budgets for LCP, CLS, INP/TBT, JavaScript, images, and
  fonts with Lighthouse or an equivalent lab runner.
- Field metrics are required only after a real public deployment has traffic. Never invent field
  evidence from lab data.

### Astro, links, metadata

- Every intended route builds; internal links and referenced assets resolve.
- Launch state includes real title/description, canonical URL, robots, sitemap, favicon, OG image,
  404, redirects, and applicable schema.org data.
- Placeholder/mock builds remain visibly non-production and `noindex`; missing production identity
  blocks launch rather than receiving fabricated metadata.
- Use the minimum number of hydrated islands.

### Security and release

- Secret scan, dependency audit, unsafe browser/server boundary review, security headers/CSP, and
  input/output validation match the risk profile.
- Tokens remain server-side. Hosted checkout remains hosted.
- Production requires an approved preview, smoke test, rollback path, and monitoring target.

## 3. Test-strength escalation

- Property/model-based tests: required for Profile B/C money, quantity, cart, state-transition, and
  permission invariants when ordinary examples leave a combinatorial surface.
- Mutation testing: run a narrow pilot on critical pure logic when a surviving defect would affect
  money, authorization, or irreversible state. Do not impose full-repository Stryker on every
  brochure site.
- Fuzzing: use for parsers, public inputs, provider payloads, and security boundaries.
- Independent/adversarial review is useful discovery, but reviewer identity is not evidence. The
  deterministic repro, test, screenshot, or measured result is evidence.

## 4. External reference policy

- HeroUI (`heroui-inc/heroui`) is a reference for React Aria composition, state documentation,
  bounded AI-facing source/docs access, and Storybook accessibility setup. It is not UUI visual
  authority and is not installed into emitted clients.
- Canvas UI (`DavidHDev/canvas-ui`) is experimental, reference-only visual research. Effects may be
  ported only as config-gated decorative layers after reduced-motion, keyboard, contrast, fallback,
  performance, and visual-regression proof. Its controls, icons, and tokens never replace UUI.
- External repositories are researched when a novel need exists. Cloning them is not a per-build
  release step.

## 5. Closeout evidence

Every delivery reports:

1. Exact branch and commit.
2. Built routes and named critical flows.
3. Commands and numeric pass/fail results.
4. Desktop + 375px, light + dark representative screenshots and state evidence.
5. Performance and accessibility results appropriate to the risk profile.
6. Mock/live boundary, blockers, and residual-risk list.
7. Agency OS evidence write-back target and next action.

Required final statement:

> The gauntlet verifies the implementation against the recorded contract. Human review validates
> that the proposition, composition, content, and commercial outcome are the right ones.
