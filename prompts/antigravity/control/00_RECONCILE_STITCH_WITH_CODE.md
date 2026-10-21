# Paste in Antigravity — audit BEFORE implementing

Work inside the existing Automotive OS workspace. Read existing `AGENTS.md`, `AGENTS_ADDITION_AUTONOMOUS_LOOP.md` and files under `docs/implementation/` only; do not regenerate the repo or claim prior tasks are completed.

1. Inspect actual packages, routes, APIs, Prisma migrations and tests created through AG-09. Connect to the approved Stitch project via MCP, enumerate its 26 screen IDs, and save actual IDs/approved image/export paths into `STITCH_SCREEN_MAP.csv`. If unable, retain blank IDs and mark only visual comparison BLOCKED_REFERENCE.
2. For each S01–S26, map Stitch design -> real route/components/API -> behavior/evidence -> status. Read at most the local relevant code for each screen, not the full FRD 26 times. Set `SCREEN_COVERAGE.csv` fields accurately: VERIFIED only if all QA gates already passed with evidence; otherwise PARTIAL/MISSING/IMPLEMENTED_UNVERIFIED/BLOCKED_EXTERNAL.
3. Identify mismatch between approved Obsidian dark/gold design and any inherited light-glass frontend. Do not automatically redesign screens if approved exports conflict; report mismatch.
4. Run safe baseline checks using commands discovered from package.json scripts; record real results in `docs/qa/BASELINE.md`.
5. Create/update `docs/implementation/RUN_STATE.md` from template and ordered next actions. No app feature edits in this audit.

Output: counts per status and P0/P1, exact missing dependencies, next independent screen to implement. No invented screenshots or provider connections.
