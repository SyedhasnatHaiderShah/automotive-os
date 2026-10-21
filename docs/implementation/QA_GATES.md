# Deterministic QA gates and honest 100% definition

## Scope accounting
- **P0:** S01–S16 (16 screens). Required for marketplace launch readiness, subject to partner dependencies.
- **P1:** S17–S26 (10 screens). Separate expansion readiness; do not inflate MVP scope.
- **Design parity:** available Stitch screen IDs and screenshots matched to running UI. If assets missing, `BLOCKED_REFERENCE`, not PASS.

## Status vocabulary
`NOT_AUDITED`, `MISSING`, `PARTIAL`, `IMPLEMENTED_UNVERIFIED`, `VERIFIED`, `BLOCKED_EXTERNAL`, `BLOCKED_REFERENCE`, `DEFERRED_APPROVED`.

## Per-screen PASS = ALL applicable gates
1. Source mapping: real Stitch asset/ID + approved design version mapped to existing route.
2. Visual: inspected at 1440px and 390px; screenshot evidence captured; reviewer compares against Stitch or deterministic screenshot-diff threshold where feasible; tablet at 1024px on data-heavy screens.
3. Functional: primary happy path + validation, empty, loading, error and authorization failure work with persisted/real local data; mock-only screens are NOT VERIFIED.
4. Integration: API status/shape checked; negative cases; no hidden sample rows in production endpoints.
5. Security: authentication, role/branch/tenant access, buyer consent grants, file upload controls, audit as relevant; cross-tenant negative tests for all tenant routes.
6. Quality: lint, typecheck, unit/integration tests, targeted Playwright E2E, a11y keyboard/labels, Arabic RTL check; build passes. Unavailable commands are `NOT_RUN`, never PASS.
7. Regression: changed screen + affected routes retested after fixes.
8. Evidence: local command logs, test report, screenshot paths, commit/diff evidence saved under `docs/qa/evidence/Sxx/`.

## Release gate
For a target cohort, QA = 100% only when **all required screens** are `VERIFIED`, all applicable non-screen global gates pass, zero open Critical/High defects, and no required live external provider remains mocked/unverified. Excluded P1 must be plainly disclosed. `DEFERRED_APPROVED` does NOT count as verified, but may be excluded by explicit product-owner-approved scope change with an updated denominator. Never declare full platform or regulatory compliance from visual checks.

## Automation stop conditions
- Stop/review on database migration requiring destructive modification, production/staging deployment, API secrets or new paid service, auth model rewrite, billing, escrow release, funds movement, regulatory sign-off or external publication.
- On 3 consecutive failed repair attempts for a blocker, write root cause and evidence; mark `BLOCKED_*` and move to an **independent** next item only if unaffected. No infinite recursion. Do not hide blocker.
- If context/task budget or Antigravity permissions interrupt work, persist `RUN_STATE.md` and resume from last verified item in a new run. A prompt cannot guarantee uninterrupted execution.

## Metrics
- `P0 verified = count(S01..S16 VERIFIED) / 16`.
- `P1 verified = count(S17..S26 VERIFIED) / 10`.
- `26-screen visual parity = count(visual gate PASS) / 26`, separate from functionality.
- `Launch release-ready` requires P0 16/16 **and** global security/perf/legal dependencies sign-off.
- Do not convert blocked/external mocks to PASS to reach 100%.
