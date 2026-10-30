# Railway Staging QA — 2026-10-30 (pass 1, unauthenticated)

Target: `https://automotive-marketplace-staging.up.railway.app` (gateway), dealer `automotive-dealer-staging.up.railway.app`,
API `api-staging.syedhasnat.com` / `automotive-api-staging.up.railway.app`. Tool: Claude built-in browser + curl.
Deployed build includes CF-07 routes (`/auth/verify-email`, `/auth/activate` return 200), so the older note that staging
predates PR #23 is outdated.

Scope limits (NOT RUN): any signed-in journey (buyer enquiry, dealer CRUD, admin moderation). No staging test
credentials were available. Admin is behind Basic Auth (401). Arabic/RTL pass not run.

## Findings

| ID | Sev | Area | Finding | Evidence |
|---|---|---|---|---|
| QA-01 | Critical | Data flow / security | `/account/garage` (and other `/account/*`) render for an anonymous visitor with persona "Rashid Al Nuaimi · VIP Collector", fake bookings and escrow figures. There is no auth guard, and the data comes from fixtures. | Browser, logged out. `apps/marketplace` has no `middleware.ts`. |
| QA-02 | Critical | Data flow | Buyer API functions call `POST /api/v1/auth/token`. Staging returns 403 "Development JWT token issuance is strictly prohibited". All buyer features silently fall back to fixtures. | curl 403. `apps/marketplace/lib/api.ts:642` and 9 more call sites. |
| QA-03 | Critical | Data flow | `/dealer/inventory` shows "Dealer Inventory Service Unavailable — TENANT_CONTEXT_REQUIRED". The dealer app has no login or tenant context, so S13 is unusable. | Browser. `apps/dealer/lib/api.ts:347-360`. |
| QA-04 | High | API / DB | `GET /api/v1/public/dealers/:slug` returns `branches: []`, no `verification`, and `liveGroundedStock: 0` for gargash-autos. At the same time, the listings API shows a published Gargash listing marked `verified: true`. Cause: `getPublicDealerBySlug` runs with no `runWithDbContext`, so RLS hides tenant-scoped rows. | `apps/api/src/tenants/tenants.service.ts:17`. Compare `public-media.controller.ts:58`. |
| QA-05 | High | API / data integrity | Public dealer stats and contact details are hardcoded for every dealer: rating 4.98, 18,500 sq ft, 12 years, a Dubai phone, Makani number and GPS. Gargash (a Sharjah dealer) is shown in "Al Quoz, Dubai". | `tenants.service.ts:81-89`. |
| QA-06 | High | Media / data flow | All vehicle images fail ("Vehicle image not available"). API media URLs point to `https://cdn.automotive-os.ae/...`, which does not resolve (curl 000). They should use the public media proxy or `media-staging.syedhasnat.com`. | curl and browser. |
| QA-07 | High | Design / trust | The home page lists 4 fabricated dealerships with license numbers, ratings and car counts, plus "View All 64 Accredited Showrooms". The detail page shows an "RTA PASS VALIDATED" badge, and the home page claims "UAE DED registry authentication". None of these integrations is live (INTEGRATION_TRUTH_TABLE). | `apps/marketplace/app/page.tsx:305,358`. Detail page. |
| QA-08 | High | Data flow | `/dealer/sales` (and the workshop, parts, finance, accounting and fleet pages) render only fixture data labelled "Future roadmap / concept template". | Browser. `VERIFIED_*_FIXTURE` imports. |
| QA-09 | Medium | API | `GET /api/v1/public/dealers` returns 404, so the marketplace `/dealers` page has no list source. The page also rendered no body text on load. | curl 404. |
| QA-10 | Medium | Design | `/dealer/*` through the gateway briefly shows Material Symbols ligature text ("space_dashboard", "unfold_more") instead of icons, which breaks the layout until the font loads. | Screenshot. The font link uses no `display=block`. |
| QA-11 | Medium | Design / responsive | Around 800px wide, the dealer sales header and hero card text wrap into a narrow column. On the 375px detail page, header items overflow the right edge (VIP chip clipped), the title drops "Turbo GT", the image alt text shows instead of an image, and the staging badge covers the sticky price bar. | Screenshots. Overflow check found 5 elements past the viewport. |
| QA-12 | Medium | Navigation | The "Sell & Consign" nav item prefetches `/sell`, which returns 404. | Network log. |
| QA-13 | Low | Data flow | The `/cars` heading counts `filteredVehicles.length` instead of the API `total`, so it is wrong once results are paginated. The first load showed "0" plus skeletons for more than 5 s (cold start against a 3 s client timeout). | `apps/marketplace/app/cars/page.tsx:181`, `lib/api.ts` `AbortSignal.timeout(3000)`. |
| QA-14 | Low | Config | The marketplace calls the API at the absolute host `automotive-api-staging.up.railway.app` instead of the same-origin `/api` proxy, so cookie auth (`ao_session`) will not be sent cross-site. | Resource timing. |

## Checks that passed (observed)
- API `/health` 200, database connected. Dev token minting is blocked in staging (403).
- Admin through the gateway returns 401 (Basic Auth). Protected API routes return 401 without a token.
- Security headers present: `nosniff`, `x-frame-options SAMEORIGIN`, `referrer-policy`.

## Fix log (local, not deployed)

| ID | Status | Change |
|---|---|---|
| QA-04 | FIXED_LOCAL | `tenants.service.ts` public storefront read runs under `runWithDbContext({ isAdmin: true })`. |
| QA-05 | FIXED_LOCAL (API) | Rating, sq ft, years, phone, WhatsApp, Makani now `null`; GPS comes from the primary active branch. DTO fields are nullable, which is a contract change. The marketplace still re-applies fakes in `lib/api.ts:990-997`; that fix belongs to the data-flow batch. |
| QA-06 | FIXED_LOCAL | New `common/media-url.util.ts` replaces the hardcoded `cdn.automotive-os.ae` in listings, search projection and me services. Staging needs `S3_PUBLIC_CDN_URL` or `PUBLIC_API_URL` set. Seed objects must exist in the bucket and be `isPublic`. |
| QA-09 | FIXED_LOCAL (API) | New `GET /api/v1/public/dealers?emirate=&page=&limit=`, returning active, KYB-approved dealers only. The marketplace `/dealers` page is not wired to it yet. |

Checks: `tsc --noEmit` (api) PASS. API unit specs PASS (55/55, 10 suites). API integration specs in `apps/api/test` NOT RUN (local DB unavailable). Lint NOT RUN (script is an echo stub).

## Fix log — data-flow batch (local, not deployed)

| ID | Status | Change |
|---|---|---|
| QA-01 | FIXED_LOCAL | `apps/marketplace/middleware.ts` guards `/account/*` and `/dashboard` by checking the `ao_session` cookie is present. Account pages also call `withBuyerSession` (`lib/server-session.ts`), which redirects to `/auth?tab=login&redirect=` when the API rejects the session. `/auth` honours `redirect` for same-origin paths only. |
| QA-02 | FIXED_LOCAL | All buyer calls in `apps/marketplace/lib/api.ts` go through `lib/buyer-api-client.ts`: Bearer from the cookie on the server, same-origin `/api` with credentials on the client. The dev `/auth/token` persona, the injected escrow, IBAN, stage, venue and host values, the fixture merges and the always-`true` mutations are all removed. Mutation callers now show the failure, and optimistic removals roll back. The enquiry API mapping is fixed (`buyerMessage`, `grant.fieldsGranted`). Garage vehicles now render an empty list because no API exists for them. The simulated RTA sync now says it is unavailable. |
| QA-03 | FIXED_LOCAL | `apps/dealer/middleware.ts` uses a relative `Location` so the redirect stays on the gateway. `lib/session.ts` resolves the tenant from `/api/v1/auth/me` memberships. Inventory and leads use the real session and tenant. `createDealerVehicle` now uses the tenant route, but intake fails on purpose until a make/model/branch catalogue API exists. |
| QA-05 | FIXED_LOCAL | The marketplace storefront no longer refills fake rating, phone, GPS, stock or value, and no longer shows fixture inventory when stock is empty. Null fields render as "—" or are hidden, and empty contact links are disabled. A 404 from the API returns `notFound()`. |
| QA-08 | OPEN | The dealer P1 fixture pages are unchanged; they need their own backend modules. |

Remaining fabricated UI copy (design batch): hardcoded secondary enquiry cards in `buyer-enquiries-view.tsx:743-776`, escrow and AED 284,000 text, the static `/account/settings` and `/account/profile/dossier` (S30/S31), the home page dealer cards, and the "RTA PASS VALIDATED" badge.

Checks: marketplace `tsc --noEmit` PASS and `next build` PASS. Dealer `tsc --noEmit` PASS and `next build` PASS. Runtime and E2E against the API/DB NOT RUN: the local DB is unavailable and staging is not redeployed.

## Fix log: design batch (local, not deployed)

| ID | Status | Change |
|---|---|---|
| QA-07 | FIXED_LOCAL | The home page and `/dealers` now list live KYB-approved dealers from `GET /api/v1/public/dealers`, with loading, empty and error states. Removed: the 6 invented showrooms, license numbers, ratings, "64" count, "Tier-1 Institutional Partners" label and the DED registry claim. On vehicle detail, removed the "RTA Pass Validated" and "Single Owner" badges, the "4K Studio Capture" chip, the fake 360° and engine-audio controls, 19 hardcoded GT3 spec and seller fallbacks (now "—"), and the Porsche Centre, Tasjeel certification and same-day transfer claims. The RTA VIN "token dispatched" message is now honest. |
| QA-10 | FIXED_LOCAL | Added `display=block` to the Material Symbols font link in all 3 app layouts. |
| QA-11 | PARTIAL | Shared header spacing tightened on mobile. The staging badge now sits above sticky bottom bars on mobile (`bottom-24`). The dealer layout at about 800px (P1 fixture pages) is unchanged. |
| QA-12 | FIXED_LOCAL | Storefront "Sell & Consign" is now a disabled "Soon" item (no `/sell` link). The shared header's favorites and profile links pointed at missing routes `/saved` and `/profile`; they now go to `/account/saved` and `/account/profile`. |
| QA-13 | FIXED_LOCAL | The `/cars` heading uses the API `total` and shows a loading state. The listing API client timeout went from 3 s to 10 s. The "RTA & TAMM Registry Sync" claim is replaced. |
| S08 | PARTIAL | Hardcoded secondary enquiry cards are replaced by real `enquiries.slice(1)`, with a revoke action wired to the API. Escrow, down-payment, AED 284,000 and DIFC/UAE PASS copy removed. The rest of the S08 timeline narrative still needs a rebuild against real lead events. |

Checks: typecheck PASS for marketplace, dealer, admin and ui. Marketplace `next build` PASS. Visual and browser verification NOT RUN: no local stack, and staging is not redeployed.
