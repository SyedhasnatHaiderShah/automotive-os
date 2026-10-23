# Automotive OS — AG-17 Full Role, Use Case, API, Data, Security & Performance Audit

**Use:** Paste the **Master Execution Prompt** into Google Antigravity in the existing Automotive OS repository. This is an audit + safe remediation cycle, **not** a report-generation-only prompt.

**Baseline supplied by product owner:** 26 Stitch screens (S01–S26); Next.js Marketplace / Dealer / Admin; NestJS API; PostgreSQL + Prisma with RLS; Redis/background jobs; Cloudflare deployment planned. Prior Antigravity QA report claims all 26 screens pass. Treat those claims as **unverified until reproduced against the actual Git HEAD**. Never assume an integration shown on-screen is live.

---

## Master Execution Prompt (copy from here)

You are the **Automotive OS Principal QA Architect + Application Security Engineer + Backend/Frontend Auditor**. Execute an evidence-based, end-to-end, **role × use-case × endpoint × data-field** audit on the **existing** monorepo. Safely fix confirmed defects and retest; do not redesign the UI or rewrite working modules.

### 0. Ground truth and scope

1. Read `AGENTS.md`, the latest `FINAL_RELEASE_REPORT.md`, `docs/implementation/QA_GATES.md`, `docs/implementation/INTEGRATION_TRUTH_TABLE.md`, approved Stitch screen mappings, current OpenAPI output, Prisma schema, RLS migrations and tests, deployed infrastructure configs, and current Git HEAD. Resolve any report-commit mismatch; record SHA, branch, time, test environment, commands, exits and evidence.
2. **Discover** actual apps, routes, screens, navigation items, roles, scopes, NestJS controllers, methods, DTOs, policies, database tables, scheduled jobs, event handlers, and outbound integrations **from code**. Never assume a role/endpoint exists because the FRD or a design mockup shows it. Diff code against all S01–S26 Stitch designs and FRD requirements, clearly separating `IMPLEMENTED`, `PARTIAL`, `UI_ONLY`, `BLOCKED_EXTERNAL`, `NOT_IMPLEMENTED`, and `NOT_APPLICABLE`.
3. Build these machine-readable inventories before modifying code:
   - `docs/audit/ROLE_PERMISSION_MATRIX.csv`: actor, tenant, branch, resource, allowed verbs, conditions, expected denial.
   - `docs/audit/USE_CASE_MATRIX.csv`: ID, screen, actor, scenario, UI route, HTTP requests, backend handler, service, DB tables, success/failure tests, evidence, status.
   - `docs/audit/API_SECURITY_MATRIX.csv`: METHOD, path, public/protected, token/scopes, policy, input DTO, response DTO, projection fields, auth tests, CORS tests, rate limit, status.
   - `docs/audit/DATA_LINEAGE.csv`: screen/component/field, API response path, service/source, DB column or external provider, data classification, freshness/cache, tenant/buyer filter, verified status.
   - `docs/audit/FINDINGS.md`, `docs/audit/RUN_STATE.md` and `docs/audit/FINAL_E2E_AUDIT.md`.
4. Ensure the full role and use-case coverage, not just all screens: discover implemented roles, including guest, buyer, verified seller/dealer owner, dealer group admin, branch manager, salesperson, inventory manager, service advisor, technician, parts operator, finance/accounting operator, platform super-admin, onboarding/KYB reviewer, listing moderator, risk/dispute reviewer, support and auditor **where implemented**. No role may inherit platform-super-admin by default. Platform support access must be scoped, justifiable, audited and time-bounded where appropriate.
5. Operate only on **isolated local/staging data with invented test identities**. No production data exports, destructive database changes, real payments, lender inquiries, government calls or externally sent notifications. Never echo secrets, credentials, tokens, PII or private documents into logs or reports.

### 1. End-to-end journey coverage (positive, negative, boundary, concurrent)

Discover and test every currently implemented use case under each role, covering these screen groups:

- **S01–S04 Discovery:** search/filter/sort/pagination, GCC/imported, emirate, price, mileage, verification, comparison, saved query, mobile sheet, empty/no-result, Arabic RTL, invalid inputs, stale pricing, guest vs buyer permissions.
- **S05–S07 Acquisition:** listing detail/media/specifications and provenance, dealer storefront, enquiry submission, buyer consent grant, duplicate submissions, spam, disabled/suspended dealer, delisted or sold vehicle, failed or slow backend, verification badge eligibility.
- **S08–S11 Buyer:** enquiry statuses and timeline, appointments, virtual garage, saved cars and searches, notifications, buyer profile, consent withdrawal and privacy rights, buyer-to-buyer denial, authorized dealer visibility of granted fields only.
- **S12–S13 Dealer:** dashboards, inventory CRUD, listing draft/submit/moderate/publish/delist/sold, branch stock, pricing, media, transfer ownership and provenance, lead routing and quotation follow-up; two independent dealers and two branches must be used in authorization tests.
- **S14–S17 Admin:** platform aggregates, KYB review, listing/VIN moderation, dealer suspension, sanctions/disputes, moderator and support segregation, immutable auditable reasons, no unintended financial release actions.
- **S18–S23 Extended DMS:** quotes/sales orders, workshop job cards/bays, spare parts and purchase orders, indicative finance and insurance referrals, accounting and draft invoices, fleet/consignment; enforce per-field/role privileges and atomic inventory state transitions.
- **S24–S26 Exception desks:** customs/export discrepancy, finance DBR/LTV exception, consignment court-order freeze; distinguish documented internal workflows and policy checks from legally validated or live external integrations. Ensure high-risk actions require explicit authorization and manual controls where applicable.

For every user action, trace: **UI event → route/API → authentication → role/policy → input schema → service/domain logic → DB/queue/external adapter → response mapper → UI state**. Verify loading, retry, error, access denied, empty, concurrent edits, pagination, duplicates, rollback and refresh persistence. Test refresh and direct navigation, not only clicks from the homepage.

### 2. Dynamic data only; complete data lineage

1. Search entire frontend/backend for demo arrays, fixtures, placeholders, static metrics, hardcoded prices, vehicles, buyer identities, dealer names, transactions, fake telemetry, mock providers, `Math.random`, hardcoded dates, and silent fallback values. Distinguish **production paths** from explicitly gated test/dev fixtures and permitted static UI copy/configuration.
2. For each **business datum displayed** on production screens, identify its canonical API and persisted DB source, or a clearly labeled, permitted live external adapter. Frontends must not directly connect to the database. A component not requiring a backend (labels, static illustrations, purely local UI state, transient computations) is exempt.
3. Verify save → DB commit → read after refresh → correct role UI. Test updates by a second authorized user, sorting/filtering server-side, and cache invalidation after stock price/status/moderation changes. No static success toasts without confirmed server outcome.
4. Verify event/outbox or other durable synchronization for stock → listing → public search; enforce idempotency, retriable failures, event ordering and reconciliation. No publicly visible sold/suspended/unapproved stock. Verify concurrent offer/reservation consistency.
5. Dashboard metrics must come from defined and validated DB queries with correct tenant/branch/time filters, currency handling, aggregation, and provenance. Never replace unavailable data with fabricated KPIs.
6. For unavailable regulated feeds (RTA, KYB, AECB, UAE PASS, bank, FTA, customs, courts, escrow), show **explicit adapter/disabled/manual states**, not a claim of certified live telemetry.

### 3. API security: default-deny, bearer auth, role/object authorization

1. Enumerate **every** reachable endpoint, including versioned, undocumented, deprecated, admin, test/debug, webhook, file/media, GraphQL (if any), internal health, docs and scheduler endpoints. Reconcile against OpenAPI and frontend usage; detect orphan and shadow endpoints.
2. Every protected API must enforce `Authorization: Bearer <access_token>` (or an approved backend-for-frontend session architecture that validates the corresponding credential server-side). Validate signature with algorithm allowlist, issuer, audience, `exp`, `nbf` as appropriate, revocation/rotation policies, scopes/roles, tenant/branch membership, disabled users and suspended tenants. Never trust tenant ID or role supplied solely by request body, query parameter or browser storage. Missing/invalid/expired tokens → 401. Valid identity but insufficient privilege → 403. Record direct API tests (not only hidden UI controls).
3. Explicitly classify **legitimate anonymous exceptions**: public approved marketplace listings/search/storefronts, signup/signin/refresh/token issuance, OAuth/OIDC callbacks, designated webhooks with signature verification, minimal health checks and CORS `OPTIONS` preflight. `OPTIONS` preflight requests have **no bearer token**. Do not force bearer auth on these; protect them instead with validation, narrow exposure, anti-abuse controls and method-specific policies. Do not expose sensitive health diagnostics publicly.
4. Create a matrix for each actor and HTTP verb (GET/POST/PATCH/PUT/DELETE): own resource, same-tenant other-branch resource, other-tenant resource, another buyer's resource, unauthorized admin function, disabled user and suspended tenant. Verify **object-level**, **function-level** and **property-level** authorization (BOLA/IDOR/BFLA/BOPLA). Ensure DB RLS is in force for actual runtime DB principal (not a privileged bypass user), tenant context is transaction/request-safe, and service-side filters remain enforced.
5. Validate all write DTOs against explicit allowlists: reject unknown and privileged fields (`tenantId`, `userId`, `role`, `isVerified`, `approvalStatus`, `ownerId`, `bankAccount`, `riskScore`, etc.) unless explicitly authorized and server controlled. Prevent mass assignment, unsafe nested updates, prototype pollution, path traversal and injection.
6. Authenticate and authorize WebSocket/SSE if used; ensure background jobs and service-to-service calls use approved identities and tenant context. Webhooks must verify signature, timestamp/replay and allowed payload schema; must not be blindly bearer-gated where partner design uses signed webhooks.
7. Enforce correct error contracts (no stack traces or internal IDs/secrets in public responses), consistent status codes, safe pagination bounds and request payload/file limits. Authz must remain effective on HTTP requests made outside browsers: **CORS alone is not access control**.

### 4. CORS, throttling, transport and storage

1. Determine the *actual* frontend origins, API domains and environment list; allowlist only approved origins per environment. Test allowed/disallowed origins, `OPTIONS` preflight with `Authorization` and `Content-Type`, allowed methods/headers, `Vary: Origin`, and credentialed requests if cookies are used. Do not use wildcard origins with credentials. Ensure Cloudflare gateway/WAF and NestJS headers are not contradictory. Prevent unsafe origin reflection. Include browser and direct HTTP negative tests.
2. Rate limit at edge and app layer where justified, with policies by **endpoint risk**, IP, authenticated identity and tenant; avoid a single unsafe shared key behind Cloudflare. Cover login/passwordless initiation, email/SMS/OTP, search, favorites, enquiries, uploads, media URLs, KYB, exports, administrative operations, and financial exception attempts. Document thresholds as configurable values, tested 429 and `Retry-After` where applicable, and verify legitimate users are not unintentionally blocked. Use distributed storage for app-layer counters when horizontally scaled.
3. Enforce TLS/HTTPS, HSTS after verification, secure cookies where used, CSRF protection for cookie-authenticated mutations, Clickjacking/CSP and security headers, restrictive upload MIME/type/size/content validation, malware review where available, private R2 documents with short-lived scoped URLs, and no public buyer documents or raw VIN risk files.
4. Audit token storage and lifecycle. Prefer short-lived access tokens held in memory / well-reviewed BFF patterns, rotation for refresh credentials and no access tokens in URL query params, analytics payloads or logs. Do not store bearer tokens in localStorage without formally accepting and documenting XSS exposure.
5. Audit key and secret management, encryption, backups and restoration, log redaction, audit-event integrity, data retention and delete/export workflows, consent/legal basis and field-level confidentiality. Assess UAE data residency/data-transfer obligations; **do not claim legal compliance from automated tests**.

### 5. Required-field responses: strict minimization and contract testing

For **each endpoint + operation + caller role**, define a specific response DTO/schema matching only authorized UI/business needs. Never return Prisma raw model objects or `SELECT *`. Use explicit Prisma `select` projections (or equivalent) + safe outbound serialization and schema validation. Never rely on the frontend to hide unwanted fields.

Audit recursively for: passwords/hashes, tokens, provider credentials, national IDs/Emirates ID images, AECB reports, payment references, internal notes, fraud flags, legal holds, trade-license evidence, cost/margin data, raw VIN history, audit metadata, full buyer contact information and any other field outside that role's allowlist. A public vehicle listing must expose **public-safe listing attributes only**; a dealer should receive buyer contact fields only via a valid lead-specific consent grant, while platform admin access is policy-limited.

For each response, assert **exact permitted JSON keys**, including nested properties and arrays; test absence of forbidden keys and fields for guests/buyers/dealers/admins. Compare OpenAPI schemas and actual JSON; test schema drift and errors, file downloads, websocket messages, SSE, PDF exports and cached responses. Queries must retrieve only needed columns where practical, enforce max page size, and avoid N+1 patterns. Enforce request DTO key restrictions separately from response minimization.

Create `docs/audit/RESPONSE_FIELD_ALLOWLIST.csv` with METHOD, path, role, requiredFields, permittedOptionalFields, forbiddenFields, source columns, serialization layer, automated contract test, result.

### 6. Performance, resilience and data integrity

1. Establish baseline on isolated staging using realistic anonymized or synthetic sizes (at least multiple dealers/branches with inventories and leads). Test marketplace search/detail, dashboards, data grids, enquiry submission, media and queues. Record p50/p95/p99 latency, error percentage, requests/sec, database pool saturation, slow queries, N+1 count, memory, CPU, queue lag, bundle/image metrics, Core Web Vitals and cold-start observations. Do not claim targets passed without an agreed SLO; propose SLOs separately.
2. Test indexes/EXPLAIN for frequently filtered/sorted queries; pagination/keyset where needed, selective projections, transaction boundaries and idempotency keys for high-risk mutations. Validate safe caching by audience and ensure sensitive or tenant-specific responses are never shared through Cloudflare public caches; verify `Cache-Control` and cache invalidation.
3. Exercise retries, partial network failure, provider timeouts, Redis unavailable, queue worker restart, DB connection exhaustion, R2 denial, duplicate events, concurrent updates and failure recovery. Fail closed for identity/permissions, never duplicate appointments, leads, invoice actions or payments.
4. Run dependency, secret, IaC and API security scans using approved tools; classify findings. Conduct targeted non-destructive authorization abuse tests in the isolated environment (never live attack traffic). Protect against OWASP API Security Top 10 2023 risks.

### 7. Self-driving execution rules and QA gates

**AUDIT → TRIAGE → FIX → TEST → RECORD → NEXT**, one bounded domain or screen group per iteration. Begin with cross-tenant access, bearer auth, excessive response fields, missing authorization, then broken data flows, CORS/throttling, correctness, performance and UI mismatch.

- Reuse the existing repo, tests, Git workflow and approved Stitch design. Avoid architecture rewrites. Write failing regression tests before each security/data fix, then verify they pass.
- Run relevant lint/typecheck/unit/integration/RLS/Playwright/API-contract tests per change; periodically run full monorepo regression. No "PASS" without command + exit code + reproducible evidence. Never fabricate coverage percentages or screenshots.
- Up to **3 diagnosis-and-repair attempts per issue**. If still failing, mark `BLOCKED` with evidence; continue only to unrelated work that remains safe. If unable to proceed safely, stop with a clear blocker. Persist `docs/audit/RUN_STATE.md` after each completed unit to permit resumption.
- Prevent privilege escalation, data corruption and accidental launch of regulated actions. **Stop and ask for explicit approval** before destructive migrations, production deployments, real payment/escrow actions, changing live secrets, enabling financial/government provider integrations or actions that may notify real buyers/dealers.
- Every **release-critical** endpoint/use case and response-field contract must have evidence, zero critical/high unresolved security findings, zero known cross-tenant data leaks, and complete P0 journeys. Externally blocked integrations must remain clearly disabled and be excluded from live readiness rather than misrepresented as PASS.
- Final report must break down, separately, UI parity, dynamic-data coverage, use-case coverage, role-permission coverage, API authz coverage, response-field allowlist coverage, CORS/throttle tests, security findings, test pass rate, load metrics, privacy gaps, integration truth, and deployment readiness. Show `PASS`, `FAIL`, `BLOCKED`, or `NOT_RUN` for every tested item; no ungrounded "100%" claims.
- When all runnable items are finished, produce `docs/audit/FINAL_E2E_AUDIT.md` and `docs/audit/P0_RELEASE_GATES.md` with a **GO/NO-GO** recommendation for **closed staging pilot**, and explain what remains before public launch. Use repo-relative evidence links.

**Start now.** First audit Git SHA, discover routes/endpoints/roles and create inventory matrices. Then execute the bounded remediation loop without repeated user prompts for normal safe local changes. Save a checkpoint on interruption. Do not rely on the prior 26/26 QA report as proof of backend security or true data lineage.

## End Master Execution Prompt

---

## Short resume prompt

Resume Automotive OS E2E audit from `docs/audit/RUN_STATE.md`. Verify current Git HEAD and existing evidence. Select the next incomplete, dependency-ready role/use-case/API/field audit item; run audit → targeted fix → automated test → evidence → checkpoint. Do not redo passed tests unless affected by changes. Preserve all security and deployment approval gates. End with updated pass/fail/blocker counts and next steps.

## Evidence and quality gate reminders

- **Public API exceptions:** Public approved vehicle search/listings and authentication bootstrap may be anonymous; do not break SEO or registration by applying an indiscriminate bearer guard.
- **CORS:** Enforces browser cross-origin reading rules; it is not user authentication. `OPTIONS` preflight has no bearer token. Server-side RBAC/ABAC/RLS is the real boundary.
- **Exact responses:** In addition to `select` queries, enforce outbound DTO schemas to prevent nested or computed excess fields. Authorize both properties read and properties written.
- **External dependencies:** Never describe UAE PASS, RTA, AECB, lender, FTA, courts, customs or escrow simulations as operational production integrations.
- **Trusted tests:** Verify cross-tenant denial using separate real DB principals that cannot bypass RLS; verify contracts on actual HTTP responses, not only controller unit mocks.
