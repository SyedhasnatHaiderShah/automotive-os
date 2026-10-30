# Platform Audit — 2026-10-30

Scope: marketplace, dealer, admin, API and DB, at HEAD `a30ed73`. Method: 5 parallel read-only code audits plus live staging probes. Staging runs an older build.
Status words: OPEN, FIXED_LOCAL, DEFERRED (needs a backend feature or a product decision).

## Live staging baseline
- **Response time:** TTFB was 0.52–0.68 s on every route, with full HTML in 0.6–0.9 s.
- **API validation:** it rejects `limit>50`, `page<1` and non-numeric price (all 400).
- **Admin through the gateway:** returns 401, as expected.
- **Dead routes:** `/sell`, `/saved` and `/profile` return 404. The header links were fixed in `b5f5589`.

## Severity counts (after de-duplication)
| Area | Critical | High | Medium | Low |
|---|---|---|---|---|
| API security / DB | 3 | 5 | 13 | 9 |
| Marketplace | 17 | 18 | 18 | 12 |
| Dealer | 0 | 19 | 13 | 7 |
| Admin | 1 | 15 | 14 | 5 |
| Performance | 0 | 8 | 11 | 4 |

## P0: security (fix first)
| ID | Sev | Finding | Location |
|---|---|---|---|
| SEC-01 | Critical | Signup and resend return the raw email verification token whenever `NODE_ENV !== 'production'`. The API image defaults to `NODE_ENV=staging`, so verification can be bypassed on staging. | `auth.service.ts:465,550`; `docker/Dockerfile.api:27` |
| SEC-02 | Critical | The staging compose file has a hardcoded `JWT_SECRET` fallback. The startup check only rejects the dev default, so anyone with repo access can forge tokens. The strategy also falls back to the dev secret when `NODE_ENV` is unset. | `docker-compose.staging.yml:56`; `jwt.strategy.ts:43`; `auth.module.ts:23` |
| SEC-03 | Critical | Per-operation `base.$transaction` in the Prisma extension breaks atomicity in every `prisma.$transaction(tx=>…)` that runs with a tenant or admin context: status, outbox and audit commit separately. This can also exhaust the connection pool. | `database/prisma.service.ts:54-68` |
| SEC-04 | High | Platform admin uses email and password only. TOTP was removed, the session lasts 7 days, and privilege changes need no step-up. | `auth.service.ts:632-645` |
| SEC-05 | High | Login enumeration: the account state (403) is returned before the password check. The lockout counter has a race, lockout is per account only so anyone can lock out an admin, and there is no per-IP limit. | `auth.service.ts:257-297` |
| SEC-06 | High | No rate limiting on login, signup, resend or register. The enquiry limiter is in-memory and never pruned. | `main.ts`, `enquiry-rate-limiter.service.ts` |
| SEC-07 | High | `JwtAuthGuard` routes never set `app.user_id`. Buyer RLS only works because the app connects as superuser `postgres`, so RLS is effectively untested. | `jwt-auth.guard.ts`, `me.service.ts` |
| SEC-08 | High | Re-applying `tenant_policies.sql` overwrites the migration's `public_published_listings_read` policy and drops the sold-stock check. The policy files have drifted. | `tenant_policies.sql:154` vs migration `20261020141500` |
| SEC-09 | Medium | The revocation check only runs when the token has a `sessionId`. There is no `session.userId` match. The `OR(sub, userId)` lookup lets a token claim override `sub`. Any unknown `sub` auto-provisions an ACTIVE buyer. | `auth.service.ts:142-195` |
| SEC-10 | Medium | JWT `algorithms` accepts `['HS256','RS256']` with a symmetric secret, and error messages echo the token's `iss`/`aud`. | `jwt.strategy.ts:46-63` |
| SEC-11 | Medium | Lead and appointment reads, including buyer PII, are allowed for VIEWER, SERVICE_ADVISOR, INVENTORY_MANAGER and FINANCE_MANAGER. | `leads.controller.ts:40,59`; `appointments.controller.ts:35` |
| SEC-12 | Medium | SALES_AGENT can create vehicles and upload public media, including documents. | `vehicles.controller.ts:46,126`; `vehicles.service.ts:465` |
| SEC-13 | Medium | `adminDecision` has no `PENDING_REVIEW` precondition, so it can approve a DRAFT or reject a PUBLISHED listing. | `listings.service.ts:322-351` |
| SEC-14 | Medium | `isPlatformAdmin` has no `@IsBoolean`, so `"false"` is read as true. `createDealer` silently attaches OWNER to an existing user. | `admin-user.dto.ts:54`; `admin.service.ts:585` |
| SEC-15 | Medium | Activation is check-then-update with no transaction. Re-activation does not revoke sessions. The token travels in a GET query string. | `auth.service.ts:600-677` |
| SEC-16 | Medium | Presigned upload has no size bound when `fileSizeBytes` is omitted. | `vehicles.service.ts:446` |
| SEC-17 | Medium | Unbounded `findMany`: appointments, `/me/*`, admin tenants. `outbox/process?limit` is uncapped. | multiple |
| SEC-18 | High | Admin middleware falls back to a hardcoded JWT secret, and its dev bypass is host-based. | `apps/admin/middleware.ts:117-131` |
| SEC-19 | Medium | JWT stored in `localStorage.ao_token` and sent ahead of the httpOnly cookie, so XSS can exfiltrate it. | marketplace auth page, buyer client, admin pages |
| SEC-20 | Medium | Consent checkbox is pre-ticked in the enquiry modal (PDPL). | `vip-enquiry-modal.tsx:46` |
| SEC-21 | Low | No helmet/HSTS/CSP. Swagger is public. CORS rejections return 500. Raw XFF is trusted. | `main.ts` |
| SEC-22 | Low | Public media is served for any `isPublic` row, whatever the listing or tenant status. | `public-media.controller.ts:58` |

## P1: fake success and dead controls (any click lies)
| ID | App | Finding |
|---|---|---|
| UI-01 | admin | `executeDisputeAdjudication` returns success on failure. No disputes API exists. Confirm modals (suspend, escrow) only set messages. The PIN accepts any 4+ characters. |
| UI-02 | admin | Users, dealers and audit-logs fall back to fake rows containing real-looking PII. Destructive actions have no confirmation and no reason field. |
| UI-03 | admin | `lib/api.ts` uses an absolute API URL with no credentials, so moderation and KYB calls get 401 when deployed. The dossier type guards reject real DTOs. The decision endpoint `verifications/:id/decision` does not exist. |
| UI-04 | admin | Moderation and verification queues are hardcoded constants with fake IDs, so their links 404. |
| UI-05 | mkt | Forgot-password is a `setTimeout` fake that sends nothing. |
| UI-06 | mkt | `/account/settings` and `/account/profile/dossier` are fully static personas (EID, IBAN, AECB, escrow) with fake save, terminate and export. They have no server session validation. |
| UI-07 | mkt | Storefront booking form fakes success via `setTimeout`. Testimonials are fabricated. |
| UI-08 | mkt | Enquiry modal is prefilled with the "Sheikh Tariq" persona. "UAE PASS" sign-in injects the persona. Liability, escrow and RTA claims. |
| UI-09 | mkt | `/account/enquiries` renders a fake GT3 RS dossier, chat, IBAN and escrow even with 0 enquiries. A demo state switcher is visible. |
| UI-10 | mkt | Garage, saved and profile views carry fake RTA sync, valuations and persona headers. Reschedule, calendar and pause actions are local-only toasts. Profile save silently drops most toggles. |
| UI-11 | mkt | Vehicle detail still has hardcoded Porsche warranty, RTA registry code, inspection, service history, valuation index and escrow, police and "No Liens" claims. WhatsApp and maps links are placeholders. |
| UI-12 | mkt | `/compare` pushes the Porsche fixture with no gate when empty and spins forever on API error. |
| UI-13 | dealer | Dashboard `|| 42.85 / 28 / 14` fallbacks. Fake RTA queue, FAB escrow, DIFC ledger, funnel and deals. Fake "Create VIP Lead". |
| UI-14 | dealer | `/leads` renders a copy of the dashboard; there is no lead list. |
| UI-15 | dealer | Intake modal can never succeed (no catalogue API). Fake "Lookup RTA". Prefilled Porsche VIN and cost. |
| UI-16 | dealer | Real role never used; a fake PRINCIPAL/SALES_REP toggle drives the UI. Listing actions and cost fields are not role-gated. |
| UI-17 | dealer | 9 fixture pages (QA-08) toast fake RTA, FTA, CBUAE, court and escrow successes, with no synthetic banner. They appear in the sidebar for every role. |
| UI-18 | dealer | Raw `<a href="/leads">` escapes the basePath (`inventory-matrix-view.tsx:909`). "Force RTA Sync" is a fake. |
| UI-19 | mkt | Broken links: `/account`, `/account/notifications`, `/contact`, `/search`, `/vip-services`, `/privacy`, `/terms`, `/aml`, `/dealers/apex-gt-motors`, `/dealers/al-ain-class-motors`, and `href="#"` escrow terms. |
| UI-20 | admin | Admin header persona "Dr. Maya Al-Falasi" and a fake notification count. The admin home KPIs are hardcoded. |

## P2: pagination
| ID | Finding |
|---|---|
| PG-01 | Dealer inventory and leads send no page/limit (only the first 20 load) and ignore `total`. Stats are computed from page 1. |
| PG-02 | Admin users never sends page (first 20 only). Dealers has no API pagination. Audit logs are fixed at 50 with no offset. |
| PG-03 | Marketplace `/dealers` is capped at 50 and search filters only the loaded page. Storefront inventory is capped at 20. The compare picker is capped at 20. |
| PG-04 | Buyer enquiries, favorites and saved searches are unpaged (API is unbounded). |
| PG-05 | Search inputs fire one request per keystroke (`/cars` q, admin users). |

## P3: performance and SEO
| ID | Finding |
|---|---|
| PF-01 | `/`, `/cars` and `/dealers` are fully client-rendered, with data fetched in `useEffect`. No listings appear in the HTML and `/cars` has no metadata. |
| PF-02 | Render-blocking Google Fonts: 5 families plus the full-axis Material Symbols. Use `next/font` and a subset of the icon font. |
| PF-03 | `images.unoptimized` in all apps. The detail-page LCP hero is a raw `<img>` with no priority or sizes. |
| PF-04 | Dealer storefront fetches the dealer and then its inventory in sequence. `generateMetadata` and the page fetch the same data twice (no React `cache()`). |
| PF-05 | Admin middleware runs a blocking verify call on every request, including static assets and prefetches. |
| PF-06 | Fixtures ship in client bundles (`lib/api.ts` of 1.7k and 3.2k lines). `VipEnquiryModal` is imported statically. |
| PF-07 | API: no indexes on price, make, model or branch. Lead queries load all memberships. The outbox worker never starts. The in-memory projection is unused. |
| PF-08 | No `sitemap.ts` or `robots.ts`, no canonical URLs or JSON-LD. Several routes lack `loading.tsx` or `error.tsx`. |

## Role matrix (API, as implemented)
- **VIEWER:** reads vehicles, leads with granted PII, and appointments. No mutations.
- **SALES_AGENT:** creates vehicles (no cost), uploads media (can set it public), changes lead and appointment status.
- **SALES_MANAGER:** vehicle and listing writes, lead status and assignment, appointment status. No cost access.
- **INVENTORY_MANAGER:** vehicle and listing writes, cost read and write.
- **FINANCE_MANAGER:** read-only, can see cost.
- **OWNER and ADMIN:** everything in the tenant.
- **Platform admin:** all `/admin/*`, and OWNER-level access on any tenant, bypassing roles and tenant status.

## Fix plan
1. **Batch S (security):** SEC-01, 02, 03, 05, 06, 09, 10, 11, 12, 13, 14, 16, 17, 18, 20, 21.
   - SEC-04 (admin MFA) needs a product decision.
   - SEC-07 and SEC-08 need DB role testing against a live database.
2. **Batch U (fake success and dead controls):** UI-01 to UI-20. Disable or remove anything that cannot call a real API.
3. **Batch P (pagination):** PG-01 to PG-05.
4. **Batch F (performance):** PF-02, 03, 04, 05 as quick wins. PF-01 is a server-component refactor.

Fix progress is logged at the end of this file.

## Fix log: batch S (API security), local only, not deployed
| ID | Status | Change |
|---|---|---|
| SEC-01 | FIXED_LOCAL | The verification token is returned only when `NODE_ENV` is `development` or `test` (`isLocalOrTestEnv`). |
| SEC-02 | FIXED_LOCAL | New `auth/jwt-secret.ts` `resolveJwtSecret()`: the dev default is allowed only in development/test; every other environment, including unset `NODE_ENV`, needs a non-default secret of 32+ characters. `docker-compose.staging.yml` now requires `JWT_SECRET`, `POSTGRES_PASSWORD` and `APP_DB_PASSWORD` (`:?`). **Rotate any secret that matched the old fallbacks, since they remain in git history.** |
| SEC-03 | FIXED_LOCAL (runtime NOT VERIFIED) | `prisma.service.ts`: `$transaction(fn)` opens one real transaction and applies the RLS context once. Every model call inside it, including ones made through `this.prisma`, joins that transaction via AsyncLocalStorage. Nested `$transaction` reuses the outer one. |
| SEC-05 | FIXED_LOCAL | Login: account state is revealed only after a correct password. A locked account gets the generic 401. The failure counter uses an atomic `increment`. |
| SEC-06 | FIXED_LOCAL (partial) | `AuthRateLimitGuard` adds per-IP fixed windows on login, signup, verify-email, resend, activate/complete and register. `trust proxy` is set to 1 hop (`TRUST_PROXY_HOPS`). The limiter is process-local; Redis is still needed for multiple instances. |
| SEC-09 | FIXED_LOCAL | Tokens must carry a `sessionId`; dev tokens (`dev:true`) are accepted only in development/test. Lookup is by `sub` only. Unknown subjects are rejected outside dev/test. `session.userId` must match the user. |
| SEC-10 | FIXED_LOCAL | JWT `algorithms` is now `['HS256']` only, and the iss/aud error messages are generic. |
| SEC-11 | FIXED_LOCAL | Lead list/detail and appointment list are restricted to OWNER, ADMIN, SALES_MANAGER and SALES_AGENT. |
| SEC-12 | FIXED_LOCAL | SALES_AGENT was removed from vehicle create. DOCUMENT media is never public, and SALES_AGENT uploads are always private. |
| SEC-13 | FIXED_LOCAL | Admin moderation decisions require `PENDING_REVIEW` (409 otherwise). |
| SEC-14 | FIXED_LOCAL (partial) | `isPlatformAdmin` now has `@IsBoolean` and an explicit string transform. The `createDealer` silent-attach behaviour is unchanged. |
| SEC-16 | FIXED_LOCAL | `fileSizeBytes` is required, so the presigned PUT is always bound to a Content-Length. |
| SEC-17 | FIXED_LOCAL (partial) | `take` caps added: `/me` lists 200, tenant appointments 500, admin tenants 500. The audit-log and outbox `limit` is clamped to 1..200. |
| SEC-21 | FIXED_LOCAL (partial) | CORS rejections no longer return 500. HSTS is sent on staging/production. Swagger is off in production unless `ENABLE_SWAGGER=true`. Helmet and CSP are not added (no new dependency). |
| PF-07 | FIXED_LOCAL (partial) | Migration `20261030120000_add_public_search_indexes` (additive only) adds make, model, tenant+branch and status+price indexes. **Applying it needs approval.** |
| SEC-04, 07, 08, 15, 22 | OPEN | SEC-04 needs a product decision on admin MFA. SEC-07 and SEC-08 need DB-role testing against a live database. SEC-15 and SEC-22 are next. |

Checks: API `tsc --noEmit` PASS. API unit tests 56/56 PASS (10 suites). Prisma `validate` PASS. NOT RUN: API integration specs in `apps/api/test` (need a DB) and the migration (needs a DB).

## Fix log: batches U, P and F (local, not deployed)
| ID | Status | Change |
|---|---|---|
| UI-01 | FIXED_LOCAL | Admin disputes shows an honest "module not available". The fake case, PIN dual-control, confirm modals and success-on-failure are gone. |
| UI-02 | FIXED_LOCAL | Admin users, dealers and audit-logs no longer fall back to fake rows. Destructive actions need a confirm modal with a required reason, and actions on your own account are hidden. |
| UI-03 | FIXED_LOCAL | Admin `adminFetch` uses relative `/api/v1` with credentials. Detail pages render the real DTOs. Moderation decisions send only DTO fields. KYB decisions are disabled because no endpoint exists. |
| UI-04 | FIXED_LOCAL | The moderation queue shows an honest "no list API" state with a UUID/slug lookup. Verifications lists real tenants. |
| UI-05 | FIXED_LOCAL | Forgot-password shows an honest "not available, contact support". |
| UI-06 | FIXED_LOCAL | `/account/settings` is a server page using real `/me/settings` (save only DTO fields, sign out via logout). The dossier redirects to `/account/profile`. |
| UI-07 | FIXED_LOCAL | The storefront booking form routes to the enquiry flow. Fake testimonials and escrow/RTA claims removed. |
| UI-08 | FIXED_LOCAL | The enquiry modal shows `/me` identity. Consent is unticked by default (PDPL). UAE PASS shows "Coming soon". Fake claims, timer and calendar removed. |
| UI-09 | FIXED_LOCAL | Enquiries view: real timeline from LeadStatus and appointments, plus an empty state. Fake dossier, chat and IBAN removed. |
| UI-10 | FIXED_LOCAL | Garage, saved and profile: real `/me` name. Reschedule uses the real API. Fake RTA sync and valuation removed. Profile saves only API fields. |
| UI-11 | FIXED_LOCAL | Vehicle detail renders API fields only. Save uses the real favorites API. WhatsApp and maps links appear only when data exists. Finance is labelled illustrative. |
| UI-12 | FIXED_LOCAL | Compare starts empty and has error and loading states. |
| UI-13 | FIXED_LOCAL | Dealer dashboard is a server component with exact counts from API totals. All fake panels and fallbacks removed. |
| UI-14 | FIXED_LOCAL | `/dealer/leads` is a real paginated table with a status filter. Status and assignment changes go through the real PATCH, gated by role. |
| UI-15 | FIXED_LOCAL | Intake entry points are disabled ("catalogue API not available"). Fake RTA lookup and prefilled values removed. |
| UI-16 | FIXED_LOCAL | `lib/permissions.ts` gives capabilities per MembershipRole. The fake role toggle is gone, and the real tenant, name and role are shown. |
| UI-17 | FIXED_LOCAL | The 9 preview pages show a fixed "Preview — sample data, no actions are sent" banner, and their external-action toasts are neutralised. The sidebar shows these modules as disabled unless `NEXT_PUBLIC_ENABLE_PREVIEW_MODULES=true`. |
| UI-18 | FIXED_LOCAL | Raw `<a href="/leads">` replaced with `next/link`. "Force RTA Sync" removed. |
| UI-19 | FIXED_LOCAL | Broken marketplace links removed or repointed. |
| UI-20 | FIXED_LOCAL | Admin header identity comes from `/auth/me`. Home KPIs are real counts; money figures are labelled preview. |
| SEC-18 | FIXED_LOCAL | Admin middleware: no default secret (503 when unset). Dev bypass needs `ADMIN_DEV_BYPASS=true`. Relative redirect includes `/admin`. Static files are excluded, and prefetches skip the verify call. |
| SEC-19 | FIXED_LOCAL | No JWT in localStorage in marketplace or admin; requests rely on the httpOnly cookie. |
| SEC-20 | FIXED_LOCAL | Consent is unticked by default. |
| PG-01 | FIXED_LOCAL | Dealer inventory and leads use server `page`/`limit`/`total` with prev/next and status filters. |
| PG-02 | FIXED_LOCAL (partial) | Admin users: server page with debounced search. Audit logs: offset pager plus `targetType`. Dealers still loads the whole list (500 cap). |
| PG-03 | FIXED_LOCAL (partial) | Marketplace `/dealers` pages on the server. The storefront shows the API total but still loads only the first 20. |
| PG-05 | FIXED_LOCAL | `/cars` and admin users debounce search by 300 ms. |
| PF-02 | FIXED_LOCAL (partial) | Material Symbols pinned to static axes (`24,400,0,0`) in all 3 apps. `next/font` migration is still open. |
| PF-04 | FIXED_LOCAL | Storefront dealer and inventory load in parallel. React `cache()` dedupes metadata and page fetches on `/cars/[slug]` and `/dealers/[slug]`. |
| PF-06 | FIXED_LOCAL (partial) | `VipEnquiryModal` lazy-loads on open, cutting PDP first-load JS from 147 kB to 132 kB. Dealer fixtures were removed from the shared lib. |
| OPEN | — | PG-04 (buyer list paging; the API is capped at 200), PF-01 (server components for `/`, `/cars`, `/dealers`), PF-03 (images), PF-05 caching, PF-08 (sitemap/robots), home hero GT3 fixture, CBUAE copy on `access-suspended`, the backend settings DTO still accepting IBAN/AECB/TRN, and the 9 preview modules that still need real backends (QA-08). |

Checks: typecheck PASS for api, marketplace, dealer, admin and ui. `next build` PASS for marketplace, dealer and admin. API unit tests 56/56 PASS. NOT RUN: browser, E2E, API integration, cross-tenant runtime, DB migration.
