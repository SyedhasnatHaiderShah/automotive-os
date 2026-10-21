# Final release-quality verification prompt (after loop)

Do not invent success. Load `SCREEN_COVERAGE.csv`, `QA_GATES.md`, `INTEGRATION_TRUTH_TABLE.md`, git state, package scripts and actual tests. Validate P0 and P1 metrics separately. Run lint/typecheck/build, all feasible tests, Playwright on every P0 business flow, cross-tenant deny checks, privacy grant checks, listing sold/unpublish propagation, approval audit, realistic RTL/accessibility/responsive browser tests. Capture actual command exit codes + browser screenshot comparison evidence. Review dependencies and security. Create `docs/qa/FINAL_RELEASE_REPORT.md` with:
- Verified screens / required cohort; failures and severity;
- Which provider integrations are real, sandbox, disabled or unverified;
- Test commands and results, accessibility and visual evidence;
- Outstanding compliance/legal approvals and operational blockers;
- GO/NO-GO recommendation for a limited **UAE pilot**, never imply government/financial certification.
If required test fails, fix within safe scope and rerun; otherwise return a precise human approval/blocker list. A '100%' claim is valid only according to QA_GATES.md.
