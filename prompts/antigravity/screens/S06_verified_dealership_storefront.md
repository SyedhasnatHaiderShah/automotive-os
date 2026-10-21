# S06 — Verified Dealership Storefront

**Cohort:** P0  
**Proposed route hint:** `/dealers/[slug]` (use actual established route when different).  
**Dependencies:** 05.

## References (read minimum necessary)
1. `docs/implementation/STITCH_SCREEN_MAP.csv` for the real Stitch screen ID and screenshot. Fetch via configured Stitch MCP or approved local export. Missing reference = `BLOCKED_REFERENCE` for visual gate.
2. `docs/implementation/SCREEN_COVERAGE.csv` row S06.
3. Existing module components, route/page code, backend API contract, unit and E2E tests for this feature.
4. `docs/design/DESIGN_HANDOFF.md` for approved tokens; `docs/references/engineering/API_CONTRACTS.md` if API is missing. Deep FRD only if a specific unresolved requirement demands it.

## Required functional outcome
Dealer profile and approved stock tenant-scoped; verified flag only after KYB approval; contact actions routed.

## Provider/compliance caution
Trade license live telemetry must be real integration.

## Execute
- Audit existing implementation; do not rewrite working features.
- Write a brief GAP -> FILES -> TESTS plan. Implement the smallest missing slice using approved Stitch layout, tokens and reusable components; wire real local backend persistence where relevant.
- Include RTL, 390/1024/1440 responsive states as applicable; validate loading, empty, error, invalid input, auth, tenant boundaries, ARIA/focus, and SEO where public.
- Run relevant lint/typecheck/tests/build; Playwright/real-browser journey; compare captured screenshot with source. Debug up to 3 rounds. Never claim a check passed when not executed.
- Save a short QA report + screenshots/log paths under `docs/qa/evidence/S06/`. Update `SCREEN_COVERAGE.csv` and `docs/implementation/RUN_STATE.md` with truthful results; then return control to orchestrator.
- Do not change database destructively, release funds, call unapproved government/finance APIs, or deploy.
