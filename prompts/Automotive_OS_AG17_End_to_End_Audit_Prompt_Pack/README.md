# Automotive OS — Role / API / Security / Performance Audit Pack

## Installation
1. Open your existing `Automotive OS` Git project in Google Antigravity.
2. Commit or checkpoint the current clean working tree.
3. Copy `AG_17_END_TO_END_ROLE_API_DATA_SECURITY_AUDIT.md` into `docs/audit/prompts/` within that project.
4. Paste the short Antigravity invocation below. It reads the comprehensive prompt from the repo and executes it.
5. Allow safe local edits and tests; require approval for production access, destructive migrations, real transactions, or integration activation.
6. Review the generated `docs/audit/FINAL_E2E_AUDIT.md`, each CSV matrix and proof for every asserted PASS.

## Antigravity invocation (copy/paste)

Run the Automotive OS E2E audit and safe-remediation program defined in `docs/audit/prompts/AG_17_END_TO_END_ROLE_API_DATA_SECURITY_AUDIT.md`.

Work on the EXISTING repository and current HEAD; do not recreate the application or redesign approved Stitch screens. First enumerate actual roles, use cases, routes, APIs, Prisma tables and frontend field sources, reconciled to S01–S26. Generate the required matrices and evidence. Then audit every role × operation × object × field for bearer authentication, tenant/branch scoping, RBAC/ABAC/RLS, CORS, rate limits, response-field allowlists, real DB-backed frontend data flows, and performance/resilience. Automatically add failing tests, fix safe verified defects, retest and checkpoint one bounded feature at a time. Explicitly allow legitimate public/auth/bootstrap endpoints and unauthenticated OPTIONS preflight; never treat CORS as authentication. Stop for production credentials, destructive migrations, real money, external regulated provider activation and other approval-gated actions. Do not mark mocks or untested integrations PASS. Finish with `docs/audit/FINAL_E2E_AUDIT.md` and an evidence-based staging GO/NO-GO. Start now.

## Expected outputs
- `docs/audit/ROLE_PERMISSION_MATRIX.csv`
- `docs/audit/USE_CASE_MATRIX.csv`
- `docs/audit/API_SECURITY_MATRIX.csv`
- `docs/audit/DATA_LINEAGE.csv`
- `docs/audit/RESPONSE_FIELD_ALLOWLIST.csv`
- `docs/audit/FINDINGS.md`
- `docs/audit/RUN_STATE.md`
- `docs/audit/FINAL_E2E_AUDIT.md`
- `docs/audit/P0_RELEASE_GATES.md`

## Resume
Paste the "Short resume prompt" found at the end of the comprehensive prompt file.

## Note
A report that passes 26/26 screen tests does not establish 100% API endpoint, security policy or field coverage. All coverage numbers must use a discovered denominator and reproducible evidence.
