# API acceptance run — local QA data set

Run: 2026-11-06T07:12:04.091Z · API: http://localhost:4000 · Checks: 287 · PASS 287 · FAIL 0

Each row is one request (or DB assertion) against the seeded QA database. "expected" lists the acceptable statuses; a FAIL means the behaviour differs from the documented acceptance criteria and needs triage (defect, or criteria to amend).

| # | Section | Check | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| 1 | Public listings | GET /public/listings total equals eligible rows in DB | 245 | 245 | PASS | page items=50 |
| 2 | Public listings | No private fields leak in public cards | none | none | PASS |  |
| 3 | Public listings | Error envelope not used on success; limit clamped to 50 | 50 | 50 | PASS |  |
| 4 | Public listings | limit=500 is clamped (200) or rejected (400) | 200\|400 | 400 | PASS | limit returned=undefined |
| 5 | Public listings | page=0 handled (200, page>=1) or 400 | 200\|400 | 400 | PASS | page=undefined |
| 6 | Public listings | out-of-range page returns 200 with empty items | 200 | 200 | PASS | items=0 total=245 |
| 7 | Public listings | make=toyota total matches DB | 17 | 17 | PASS |  |
| 8 | Public listings | sort=price-asc is monotonic | true | true | PASS | first=950000 last=5300000 |
| 9 | Public listings | inverted price range returns empty 200 (or 400) | 200\|400 | 200 | PASS | total=0 |
| 10 | Public listings | q with SQL characters is safe (200) | 200 | 200 | PASS | total=0 |
| 11 | Public listings | invalid condition enum -> 400 | 400 | 400 | PASS | Bad Request |
| 12 | Public listings | unknown query param rejected (400 forbidNonWhitelisted) or ignored (200) | 200\|400 | 400 | PASS |  |
| 13 | Public listings | emirate filter case-insensitive total matches DB | 77 | 77 | PASS |  |
| 14 | Public listing detail | published+available+active -> 200 | 200 | 200 | PASS |  |
| 15 | Public listing detail | detail hides purchaseCostFils and buyer data | none | none | PASS |  |
| 16 | Public listing detail | detail exposes seller verified flag and emirate | true | true | PASS | {"id":"bf040fe2-ad43-418d-85ed-4d5bcf86c32c","slug":"falcon-ridge-motors","displayName":"Falcon Ridge Motors","emirate": |
| 17 | Public listing detail | SOLD listing -> 404 | 404 | 404 | PASS |  |
| 18 | Public listing detail | DRAFT listing -> 404 | 404 | 404 | PASS |  |
| 19 | Public listing detail | PAUSED listing of SUSPENDED dealer -> 404 | 404 | 404 | PASS |  |
| 20 | Public listing detail | TRAP-01 PUBLISHED listing on SOLD vehicle -> 404 | 404 | 404 | PASS |  |
| 21 | Public listing detail | unknown slug -> 404 with error envelope | 404 | 404 | PASS |  |
| 22 | Public listing detail | 404 envelope has error.code and correlationId | true | true | PASS | {"error":{"code":"Not Found","message":"Listing not found or no longer available","correlationId":"corr-2ea04f36-6d3b-4f67-87e9-e8dc1e0a4ed8"}} |
| 23 | Public listing detail | Listing of ACTIVE dealer whose KYB is IN_REVIEW: visible publicly? (policy: verified dealers only) | 404 | 404 | PASS | uaq-family-motors verification IN_REVIEW |
| 24 | Public dealers | dealers list count equals ACTIVE+APPROVED tenants | 16 | 16 | PASS | slugs=16 |
| 25 | Public dealers | IN_REVIEW dealer (uaq) excluded | false | false | PASS |  |
| 26 | Public dealers | SUSPENDED dealer excluded | false | false | PASS |  |
| 27 | Public dealers | PENDING dealer excluded | false | false | PASS |  |
| 28 | Public dealers | GET dealers/uaq-family-motors -> 404 | 404 | 404 | PASS |  |
| 29 | Public dealers | GET dealers/sandstorm-autos -> 404 | 404 | 404 | PASS |  |
| 30 | Public dealers | GET dealers/falcon-ridge-motors -> 200 | 200 | 200 | PASS |  |
| 31 | Public dealers | dealer profile exposes no staff emails/phones | none | none | PASS |  |
| 32 | Public media | path traversal rejected | 400 | 400 | PASS |  |
| 33 | Public media | private DOCUMENT key -> 404 | 404 | 404 | PASS |  |
| 34 | Public media | photo of SOLD vehicle -> 404 | 404 | 404 | PASS |  |
| 35 | Public media | photo of SUSPENDED dealer vehicle -> 404 | 404 | 404 | PASS |  |
| 36 | Public media | eligible photo without object storage configured -> honest 404/503, not 500 | 404\|503 | 404 | PASS | Not Found |
| 37 | Security headers | X-Content-Type-Options nosniff | nosniff | nosniff | PASS |  |
| 38 | Security headers | Cache-Control no-store | true | true | PASS |  |
| 39 | Security headers | x-correlation-id exposed | true | true | PASS | via expose header |
| 40 | Auth | buyer login -> 200 with accessToken and cookie | 200 | 200 | PASS | cookie=ao_session redirect=/account/garage |
| 41 | Auth | buyer redirectUrl is /account/garage | /account/garage | /account/garage | PASS |  |
| 42 | Auth | login response contains no passwordHash | false | false | PASS |  |
| 43 | Auth | wrong password -> 401 generic | 401 | 401 | PASS | Unauthorized |
| 44 | Auth | unknown email -> 401 generic (same message) | 401 | 401 | PASS | Unauthorized |
| 45 | Auth | unknown vs wrong-password messages identical (no enumeration) | true | true | PASS |  |
| 46 | Auth | locked account -> 401 generic | 401 | 401 | PASS | Unauthorized |
| 47 | Auth | suspended buyer -> 403 ACCOUNT_SUSPENDED | 403 | 403 | PASS | Forbidden |
| 48 | Auth | disabled staff -> 403 ACCOUNT_DISABLED | 403 | 403 | PASS | Forbidden |
| 49 | Auth | unverified email -> 403 EMAIL_NOT_VERIFIED | 403 | 403 | PASS | Forbidden |
| 50 | Auth | account without password -> 401 generic | 401 | 401 | PASS | Unauthorized |
| 51 | Auth | malformed email -> 400 | 400 | 400 | PASS | Bad Request |
| 52 | Auth | unknown body field rejected -> 400 | 400 | 400 | PASS | Bad Request |
| 53 | Auth | GET /auth/me without token -> 401 | 401 | 401 | PASS |  |
| 54 | Auth | tampered JWT -> 401 | 401 | 401 | PASS |  |
| 55 | Auth | alg=none JWT -> 401 | 401 | 401 | PASS |  |
| 56 | Auth | dev token endpoint disabled -> 403 | 403 | 403 | PASS |  |
| 57 | Auth | GET /auth/me -> 200 own email | rashid.obeid1@buyers.example | rashid.obeid1@buyers.example | PASS |  |
| 58 | Auth | /auth/me response has no passwordHash/mfaSecret | none | none | PASS |  |
| 59 | Auth | logout -> 200 | 200 | 200 | PASS |  |
| 60 | Auth | token after logout -> 401 (session revoked) | 401 | 401 | PASS |  |
| 61 | Auth | verify-admin-session as buyer -> 403 | 403 | 403 | PASS |  |
| 62 | Auth | suspended platform admin login -> 403 | 403 | 403 | PASS | Forbidden |
| 63 | Auth | signup weak password -> 400 | 400 | 400 | PASS | Bad Request |
| 64 | Auth | signup duplicate email -> 409 (or 400/201 generic anti-enumeration) | 409\|400\|201 | 400 | PASS | Bad Request |
| 65 | Buyer zone | GET /me -> 200 own id | 38d817d6-fc78-4b65-9670-e27031bfc6e9 | 38d817d6-fc78-4b65-9670-e27031bfc6e9 | PASS |  |
| 66 | Buyer zone | GET buyer-profile -> 200 | 200 | 200 | PASS |  |
| 67 | Buyer zone | PATCH buyer-profile valid -> 200 echoes new emirate | Sharjah | Sharjah | PASS | 200 |
| 68 | Buyer zone | PATCH buyer-profile negative budget -> 400 | 400 | 400 | PASS |  |
| 69 | Buyer zone | PATCH buyer-profile min>max -> 400 (or 200 if unvalidated) | 400 | 400 | PASS | min 200,000 AED > max 10 AED |
| 70 | Buyer zone | PATCH buyer-profile privilege field rejected -> 400 | 400 | 400 | PASS |  |
| 71 | Buyer zone | buyer without profile row: GET buyer-profile -> 200 defaults or 404 (not 500) | 200\|404 | 404 | PASS | Not Found |
| 72 | Buyer zone | POST favorite published listing -> 201/200 | 200\|201 | 201 | PASS | {"id":"7f1bc53d-7e95-4d0c-8ad9-f0d6866af703","listingId":"9e61a763-03b4-4841-817 |
| 73 | Buyer zone | POST favorite duplicate -> 409 or idempotent 200/201 | 200\|201\|409 | 201 | PASS | {"id":"7f1bc53d-7e95-4d0c-8ad9-f0d6866af703","listingId":"9e61a763-03b4-4841-817 |
| 74 | Buyer zone | POST favorite on DRAFT listing -> 404/400 | 400\|404 | 404 | PASS | Not Found |
| 75 | Buyer zone | POST favorite non-uuid -> 400 | 400 | 400 | PASS |  |
| 76 | Buyer zone | GET favorites count equals DB for this buyer | 6 | 6 | PASS |  |
| 77 | Buyer zone | favorite card has no cost/vin | none | none | PASS |  |
| 78 | Buyer zone | DELETE favorite -> 200 | 200 | 200 | PASS |  |
| 79 | Buyer zone | DELETE favorite again -> 404 | 404 | 404 | PASS |  |
| 80 | Buyer zone | POST saved-search -> 201 | 200\|201 | 201 | PASS | {"id":"6cc81d54-f493-497a-9a97-35f808252a30","name":"QA Toyota Dubai","filterJso |
| 81 | Buyer zone | DELETE another buyer's saved search -> 404 | 404 | 404 | PASS |  |
| 82 | Buyer zone | DELETE own saved-search -> 200 | 200 | 200 | PASS |  |
| 83 | Buyer zone | POST saved-search invalid -> 400 | 400 | 400 | PASS |  |
| 84 | Buyer zone | GET enquiries count equals own leads in DB | 12 | 12 | PASS |  |
| 85 | Buyer zone | enquiries expose dealershipName but no dealer cost / staff contacts | none | none | PASS |  |
| 86 | Buyer zone | PATCH settings whatsappComms toggles | false | false | PASS | 200 |
| 87 | Buyer zone | PATCH settings invalid IBAN -> 400 (or 200 if unvalidated) | 400 | 400 | PASS | Bad Request |
| 88 | Buyer enquiry + appointments | POST lead unauthenticated -> 401 | 401 | 401 | PASS |  |
| 89 | Buyer enquiry + appointments | POST lead on published listing -> 201 | 201 | 201 | PASS | {"id":"af2195cb-b5ec-4c2b-b0da-efd697f90e6e","status":"NEW","listingId":"9e61a76 |
| 90 | Buyer enquiry + appointments | grant row created with the shared fields only | name,phone | name,phone | PASS |  |
| 91 | Buyer enquiry + appointments | audit + outbox rows written for new lead | true | true | PASS | audit=1 outbox=1 |
| 92 | Buyer enquiry + appointments | POST lead on SOLD listing -> 404/400 | 400\|404 | 400 | PASS |  |
| 93 | Buyer enquiry + appointments | POST lead on PAUSED listing of suspended dealer -> 404/400 | 400\|404 | 400 | PASS |  |
| 94 | Buyer enquiry + appointments | POST lead with empty fieldsToShare -> 400 | 400 | 400 | PASS |  |
| 95 | Buyer enquiry + appointments | POST lead with unknown field name -> 400 | 400 | 400 | PASS |  |
| 96 | Buyer enquiry + appointments | POST lead invalid intent -> 400 | 400 | 400 | PASS |  |
| 97 | Buyer enquiry + appointments | POST appointment on own lead -> 201 | 201 | 201 | PASS | {"id":"ab9cde5b-abbd-4400-b4fd-6c701546a2f8","tenantId":"bf040fe2-ad43-418d-85ed |
| 98 | Buyer enquiry + appointments | POST appointment end<=start -> 400 | 400 | 400 | PASS |  |
| 99 | Buyer enquiry + appointments | POST appointment in the past -> 400 (or 201 if unvalidated) | 400 | 400 | PASS | Bad Request |
| 100 | Buyer enquiry + appointments | POST appointment bad timestamp -> 400 | 400 | 400 | PASS |  |
| 101 | Buyer enquiry + appointments | reschedule own appointment -> 200 | 200 | 200 | PASS | {"id":"ab9cde5b-abbd-4400-b4fd-6c701546a2f8","tenantId":"bf040fe2-ad43-418d-85ed |
| 102 | Buyer enquiry + appointments | cancel own appointment -> 200 | 200 | 200 | PASS |  |
| 103 | Buyer enquiry + appointments | cancel already-cancelled appointment -> 400/409 (not 200) | 400\|409 | 409 | PASS | Conflict |
| 104 | Buyer enquiry + appointments | revoke own grant -> 200 | 200 | 200 | PASS |  |
| 105 | Buyer enquiry + appointments | revoke grant twice -> 400/409 (or idempotent 200) | 200\|400\|409 | 200 | PASS | {"success":true,"revokedAt":"2026-11-06T07:09:59.832Z"} |
| 106 | Buyer enquiry + appointments | POST appointment on another buyer's lead -> 404/403 | 403\|404 | 404 | PASS |  |
| 107 | Buyer enquiry + appointments | revoke another buyer's grant -> 404/403 | 403\|404 | 404 | PASS |  |
| 108 | Buyer enquiry + appointments | cancel another buyer's appointment -> 404/403 | 403\|404 | 404 | PASS |  |
| 109 | Buyer enquiry + appointments | buyer calling tenant route -> 403 | 403 | 403 | PASS |  |
| 110 | Buyer enquiry + appointments | buyer calling admin route -> 403 | 403 | 403 | PASS |  |
| 111 | Dealer roles (Falcon Ridge) | OWNER: GET context -> 200 callerRole echoed | OWNER | OWNER | PASS | 200 |
| 112 | Dealer roles (Falcon Ridge) | OWNER: GET vehicles -> 200 total matches DB | 198 | 198 | PASS | 200 |
| 113 | Dealer roles (Falcon Ridge) | OWNER: purchaseCostFils visible | true | true | PASS | rows=50 withCost=29 |
| 114 | Dealer roles (Falcon Ridge) | OWNER: POST vehicle (no cost) -> 201 | 201 | 201 | PASS | {"id":"c6ca78e4-9b95-4b33-b189-b6d98430f419","tenantId":"bf040fe2-ad43-418d-85ed |
| 115 | Dealer roles (Falcon Ridge) | OWNER: POST vehicle with purchaseCostFils -> 201 | 201 | 201 | PASS | {"id":"1bbed96e-4487-4912-9ea9-d12ca7ffdd32","tenantId":"bf040fe2-ad43-418d-85ed |
| 116 | Dealer roles (Falcon Ridge) | OWNER: GET leads -> 200 | 200 | 200 | PASS |  |
| 117 | Dealer roles (Falcon Ridge) | OWNER: GET appointments -> 200 | 200 | 200 | PASS |  |
| 118 | Dealer roles (Falcon Ridge) | OWNER: privileged-management -> 200 | 200 | 200 | PASS |  |
| 119 | Dealer roles (Falcon Ridge) | OWNER: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 120 | Dealer roles (Falcon Ridge) | OWNER: admin route -> 403 | 403 | 403 | PASS |  |
| 121 | Dealer roles (Falcon Ridge) | ADMIN: GET context -> 200 callerRole echoed | ADMIN | ADMIN | PASS | 200 |
| 122 | Dealer roles (Falcon Ridge) | ADMIN: GET vehicles -> 200 total matches DB | 200 | 200 | PASS | 200 |
| 123 | Dealer roles (Falcon Ridge) | ADMIN: purchaseCostFils visible | true | true | PASS | rows=50 withCost=28 |
| 124 | Dealer roles (Falcon Ridge) | ADMIN: POST vehicle (no cost) -> 201 | 201 | 201 | PASS | {"id":"94b84160-dee5-4252-a4b1-e40a4381aa87","tenantId":"bf040fe2-ad43-418d-85ed |
| 125 | Dealer roles (Falcon Ridge) | ADMIN: POST vehicle with purchaseCostFils -> 201 | 201 | 201 | PASS | {"id":"93869ee4-c28f-4b98-a90d-9063bb08cc93","tenantId":"bf040fe2-ad43-418d-85ed |
| 126 | Dealer roles (Falcon Ridge) | ADMIN: GET leads -> 200 | 200 | 200 | PASS |  |
| 127 | Dealer roles (Falcon Ridge) | ADMIN: GET appointments -> 200 | 200 | 200 | PASS |  |
| 128 | Dealer roles (Falcon Ridge) | ADMIN: privileged-management -> 200 | 200 | 200 | PASS |  |
| 129 | Dealer roles (Falcon Ridge) | ADMIN: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 130 | Dealer roles (Falcon Ridge) | ADMIN: admin route -> 403 | 403 | 403 | PASS |  |
| 131 | Dealer roles (Falcon Ridge) | SALES_MANAGER: GET context -> 200 callerRole echoed | SALES_MANAGER | SALES_MANAGER | PASS | 200 |
| 132 | Dealer roles (Falcon Ridge) | SALES_MANAGER: GET vehicles -> 200 total matches DB | 202 | 202 | PASS | 200 |
| 133 | Dealer roles (Falcon Ridge) | SALES_MANAGER: purchaseCostFils redacted | false | false | PASS | rows=50 withCost=0 |
| 134 | Dealer roles (Falcon Ridge) | SALES_MANAGER: POST vehicle (no cost) -> 201 | 201 | 201 | PASS | {"id":"594445c5-dfa6-4a9d-9ef4-084a5074b5f2","tenantId":"bf040fe2-ad43-418d-85ed |
| 135 | Dealer roles (Falcon Ridge) | SALES_MANAGER: POST vehicle with purchaseCostFils -> 403 | 403 | 403 | PASS | Forbidden |
| 136 | Dealer roles (Falcon Ridge) | SALES_MANAGER: GET leads -> 200 | 200 | 200 | PASS |  |
| 137 | Dealer roles (Falcon Ridge) | SALES_MANAGER: GET appointments -> 200 | 200 | 200 | PASS |  |
| 138 | Dealer roles (Falcon Ridge) | SALES_MANAGER: privileged-management -> 403 | 403 | 403 | PASS |  |
| 139 | Dealer roles (Falcon Ridge) | SALES_MANAGER: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 140 | Dealer roles (Falcon Ridge) | SALES_MANAGER: admin route -> 403 | 403 | 403 | PASS |  |
| 141 | Dealer roles (Falcon Ridge) | SALES_AGENT: GET context -> 200 callerRole echoed | SALES_AGENT | SALES_AGENT | PASS | 200 |
| 142 | Dealer roles (Falcon Ridge) | SALES_AGENT: GET vehicles -> 200 total matches DB | 203 | 203 | PASS | 200 |
| 143 | Dealer roles (Falcon Ridge) | SALES_AGENT: purchaseCostFils redacted | false | false | PASS | rows=50 withCost=0 |
| 144 | Dealer roles (Falcon Ridge) | SALES_AGENT: POST vehicle (no cost) -> 403 | 403 | 403 | PASS | Forbidden |
| 145 | Dealer roles (Falcon Ridge) | SALES_AGENT: GET leads -> 200 | 200 | 200 | PASS |  |
| 146 | Dealer roles (Falcon Ridge) | SALES_AGENT: GET appointments -> 200 | 200 | 200 | PASS |  |
| 147 | Dealer roles (Falcon Ridge) | SALES_AGENT: privileged-management -> 403 | 403 | 403 | PASS |  |
| 148 | Dealer roles (Falcon Ridge) | SALES_AGENT: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 149 | Dealer roles (Falcon Ridge) | SALES_AGENT: admin route -> 403 | 403 | 403 | PASS |  |
| 150 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: GET context -> 200 callerRole echoed | INVENTORY_MANAGER | INVENTORY_MANAGER | PASS | 200 |
| 151 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: GET vehicles -> 200 total matches DB | 203 | 203 | PASS | 200 |
| 152 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: purchaseCostFils visible | true | true | PASS | rows=50 withCost=26 |
| 153 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: POST vehicle (no cost) -> 201 | 201 | 201 | PASS | {"id":"3d6d4b81-c823-4839-b225-7a421c05d527","tenantId":"bf040fe2-ad43-418d-85ed |
| 154 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: POST vehicle with purchaseCostFils -> 201 | 201 | 201 | PASS | {"id":"e7335255-6391-40fa-92db-bc7532d5f709","tenantId":"bf040fe2-ad43-418d-85ed |
| 155 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: GET leads -> 403 | 403 | 403 | PASS |  |
| 156 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: GET appointments -> 403 | 403 | 403 | PASS |  |
| 157 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: privileged-management -> 403 | 403 | 403 | PASS |  |
| 158 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 159 | Dealer roles (Falcon Ridge) | INVENTORY_MANAGER: admin route -> 403 | 403 | 403 | PASS |  |
| 160 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: GET context -> 200 callerRole echoed | SERVICE_ADVISOR | SERVICE_ADVISOR | PASS | 200 |
| 161 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: GET vehicles -> 200 total matches DB | 205 | 205 | PASS | 200 |
| 162 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: purchaseCostFils redacted | false | false | PASS | rows=50 withCost=0 |
| 163 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: POST vehicle (no cost) -> 403 | 403 | 403 | PASS | Forbidden |
| 164 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: GET leads -> 403 | 403 | 403 | PASS |  |
| 165 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: GET appointments -> 403 | 403 | 403 | PASS |  |
| 166 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: privileged-management -> 403 | 403 | 403 | PASS |  |
| 167 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 168 | Dealer roles (Falcon Ridge) | SERVICE_ADVISOR: admin route -> 403 | 403 | 403 | PASS |  |
| 169 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: GET context -> 200 callerRole echoed | FINANCE_MANAGER | FINANCE_MANAGER | PASS | 200 |
| 170 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: GET vehicles -> 200 total matches DB | 205 | 205 | PASS | 200 |
| 171 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: purchaseCostFils visible | true | true | PASS | rows=50 withCost=25 |
| 172 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: POST vehicle (no cost) -> 403 | 403 | 403 | PASS | Forbidden |
| 173 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: GET leads -> 403 | 403 | 403 | PASS |  |
| 174 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: GET appointments -> 403 | 403 | 403 | PASS |  |
| 175 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: privileged-management -> 403 | 403 | 403 | PASS |  |
| 176 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 177 | Dealer roles (Falcon Ridge) | FINANCE_MANAGER: admin route -> 403 | 403 | 403 | PASS |  |
| 178 | Dealer roles (Falcon Ridge) | VIEWER: GET context -> 200 callerRole echoed | VIEWER | VIEWER | PASS | 200 |
| 179 | Dealer roles (Falcon Ridge) | VIEWER: GET vehicles -> 200 total matches DB | 205 | 205 | PASS | 200 |
| 180 | Dealer roles (Falcon Ridge) | VIEWER: purchaseCostFils redacted | false | false | PASS | rows=50 withCost=0 |
| 181 | Dealer roles (Falcon Ridge) | VIEWER: POST vehicle (no cost) -> 403 | 403 | 403 | PASS | Forbidden |
| 182 | Dealer roles (Falcon Ridge) | VIEWER: GET leads -> 403 | 403 | 403 | PASS |  |
| 183 | Dealer roles (Falcon Ridge) | VIEWER: GET appointments -> 403 | 403 | 403 | PASS |  |
| 184 | Dealer roles (Falcon Ridge) | VIEWER: privileged-management -> 403 | 403 | 403 | PASS |  |
| 185 | Dealer roles (Falcon Ridge) | VIEWER: cross-tenant context (Corniche) -> 403 | 403 | 403 | PASS |  |
| 186 | Dealer roles (Falcon Ridge) | VIEWER: admin route -> 403 | 403 | 403 | PASS |  |
| 187 | Dealer inventory rules (OWNER) | POST vehicle modelYear 1989 -> 400 | 400 | 400 | PASS |  |
| 188 | Dealer inventory rules (OWNER) | POST vehicle askingPriceFils 0 -> 400 | 400 | 400 | PASS |  |
| 189 | Dealer inventory rules (OWNER) | POST vehicle fractional fils -> 400 | 400 | 400 | PASS |  |
| 190 | Dealer inventory rules (OWNER) | POST vehicle with another tenant's branchId -> 400/404 | 400\|404 | 400 | PASS | Bad Request |
| 191 | Dealer inventory rules (OWNER) | duplicate stockNumber -> 409 | 409 | 409 | PASS | Conflict |
| 192 | Dealer inventory rules (OWNER) | vehicle create audited | true | true | PASS | audit=1 |
| 193 | Dealer inventory rules (OWNER) | tenantId in body ignored/rejected (no tenant hijack) | 201\|400 | 201 | PASS |  |
| 194 | Dealer inventory rules (OWNER) | GET another tenant's vehicle id via own tenant path -> 404 | 404 | 404 | PASS |  |
| 195 | Dealer inventory rules (OWNER) | PATCH another tenant's vehicle via own path -> 404 | 404 | 404 | PASS |  |
| 196 | Dealer inventory rules (OWNER) | PATCH own vehicle invalid stockStatus -> 400 | 400 | 400 | PASS |  |
| 197 | Dealer inventory rules (OWNER) | POST draft listing -> 201 | 201 | 201 | PASS | {"id":"d13eda55-9687-48e2-be23-c0305481fd29","tenantId":"bf040fe2-ad43-418d-85ed |
| 198 | Dealer inventory rules (OWNER) | POST draft listing twice keeps one DRAFT listing (idempotent 201 or 409) | true | true | PASS | status=201 |
| 199 | Dealer inventory rules (OWNER) | unpublish a DRAFT -> 400 | 400 | 400 | PASS |  |
| 200 | Dealer inventory rules (OWNER) | listing slug not public while DRAFT | 404 | 404 | PASS |  |
| 201 | Dealer inventory rules (OWNER) | submit draft without photos -> 400 (publish gate) | 400 | 400 | PASS | Bad Request |
| 202 | Dealer inventory rules (OWNER) | admin GET pending listing -> 200 | 200 | 200 | PASS | {"id":"25b8b113-12e7-49dd-af1b-15e72133fcf9","slug":"2026-chevrolet-tahoe-dubai- |
| 203 | Dealer inventory rules (OWNER) | admin reject without reason -> 400 | 400 | 400 | PASS |  |
| 204 | Dealer inventory rules (OWNER) | admin approve -> 200 PUBLISHED | PUBLISHED | PUBLISHED | PASS | 200 |
| 205 | Dealer inventory rules (OWNER) | approve twice -> 400/409 | 400\|409 | 409 | PASS |  |
| 206 | Dealer inventory rules (OWNER) | approved listing public -> 200 | 200 | 200 | PASS |  |
| 207 | Dealer inventory rules (OWNER) | moderation decision audited with admin actor | true | true | PASS | audit=1 |
| 208 | Dealer inventory rules (OWNER) | SALES_AGENT unpublish -> 403 | 403 | 403 | PASS |  |
| 209 | Dealer inventory rules (OWNER) | PATCH stockStatus SOLD -> 200 | 200 | 200 | PASS | {"id":"0dc7953e-fe42-4d97-9499-e7ead12fa9d0","tenantId":"bf040fe2-ad43-418d-85ed |
| 210 | Dealer inventory rules (OWNER) | listing auto-set to SOLD when vehicle sold | SOLD | SOLD | PASS |  |
| 211 | Dealer inventory rules (OWNER) | sold listing no longer public -> 404 | 404 | 404 | PASS |  |
| 212 | Dealer inventory rules (OWNER) | outbox unpublish event written on sale | true | true | PASS | outbox=1 |
| 213 | Dealer inventory rules (OWNER) | vehicle update audited in the same request | true | true | PASS | audit=1 |
| 214 | Dealer inventory rules (OWNER) | VIEWER PATCH vehicle -> 403 | 403 | 403 | PASS |  |
| 215 | Dealer inventory rules (OWNER) | media upload URL without storage configured -> honest 503/501/400, not 500 | 400\|501\|503 | 503 | PASS | Service Unavailable |
| 216 | Dealer inventory rules (OWNER) | media upload exe content type -> 400 | 400 | 400 | PASS |  |
| 217 | Dealer inventory rules (OWNER) | vehicles page=0/limit=1000 -> 400 or clamped 200 | 200\|400 | 400 | PASS | limit=undefined |
| 218 | Dealer inventory rules (OWNER) | stockStatus=SOLD filter total matches DB | 45 | 45 | PASS |  |
| 219 | Dealer leads rules | OWNER GET leads total matches DB | 118 | 118 | PASS | 200 |
| 220 | Dealer leads rules | revoked grant: buyerContact fields null, grantStatus REVOKED | REVOKED | REVOKED | PASS | phone=null email=null name=null |
| 221 | Dealer leads rules | name-only grant: phone and email null, name present | true | true | PASS | {"name":"Kareem Mahmoud","phone":null,"email":null,"grantStatus":"ACTIVE"} |
| 222 | Dealer leads rules | lead list never contains buyer identity subject or password fields | none | none | PASS |  |
| 223 | Dealer leads rules | SALES_AGENT PATCH lead status -> 200 | 200 | 200 | PASS | {"id":"af2195cb-b5ec-4c2b-b0da-efd697f90e6e","tenantId":"bf040fe2-ad43-418d-85ed |
| 224 | Dealer leads rules | PATCH lead status invalid enum -> 400 | 400 | 400 | PASS |  |
| 225 | Dealer leads rules | VIEWER PATCH lead status -> 403 | 403 | 403 | PASS |  |
| 226 | Dealer leads rules | WON -> NEW regression transition rejected (400/409) [policy check] | 400\|409 | 409 | PASS | won=409 back=409 |
| 227 | Dealer leads rules | SALES_AGENT assign lead -> 403 | 403 | 403 | PASS |  |
| 228 | Dealer leads rules | OWNER assign to own-tenant membership -> 200 | 200 | 200 | PASS | {"id":"af2195cb-b5ec-4c2b-b0da-efd697f90e6e","tenantId":"bf040fe2-ad43-418d-85ed |
| 229 | Dealer leads rules | assign to another tenant's membership -> 400/404 | 400\|404 | 400 | PASS | Bad Request |
| 230 | Dealer leads rules | unassign (null) -> 200 | 200 | 200 | PASS |  |
| 231 | Dealer leads rules | lead status/assignment changes audited | true | true | PASS | audit=4 |
| 232 | Dealer leads rules | GET another tenant's lead via own path -> 404 | 404 | 404 | PASS |  |
| 233 | Dealer leads rules | OWNER confirm appointment -> 200 | 200 | 200 | PASS |  |
| 234 | Dealer leads rules | appointment invalid status -> 400 | 400 | 400 | PASS |  |
| 235 | Dealer leads rules | VIEWER appointment status -> 403 | 403 | 403 | PASS |  |
| 236 | Dealer leads rules | leads status=NEW filter total matches DB | 42 | 42 | PASS |  |
| 237 | Membership and tenant state | inactive membership login -> 200 (identity ok) | 200 | 200 | PASS | redirect=/account/garage |
| 238 | Membership and tenant state | inactive membership tenant route -> 403 MEMBERSHIP_INACTIVE | 403 | 403 | PASS |  |
| 239 | Membership and tenant state | suspended-tenant owner login -> 200 with redirect to /access-suspended | /access-suspended?reason=tenant_suspended | /access-suspended?reason=tenant_suspended | PASS | 200 |
| 240 | Membership and tenant state | suspended-tenant owner tenant route -> 403 TENANT_INACTIVE | 403 | 403 | PASS |  |
| 241 | Membership and tenant state | multi-tenant user login redirect -> first membership (Falcon OWNER) /dealer | true | true | PASS | /dealer |
| 242 | Membership and tenant state | multi-tenant: both contexts 200 with distinct roles | OWNER/VIEWER | OWNER/VIEWER | PASS |  |
| 243 | Admin | no token -> 401 | 401 | 401 | PASS |  |
| 244 | Admin | tenants/summary total matches DB | 20 | 20 | PASS |  |
| 245 | Admin | users?status=SUSPENDED returns only suspended | true | true | PASS | n=3 |
| 246 | Admin | admin user list has no passwordHash | false | false | PASS |  |
| 247 | Admin | users invalid status -> 400 | 400 | 400 | PASS |  |
| 248 | Admin | users limit=1000 -> 400 or clamped | 200\|400 | 200 | PASS |  |
| 249 | Admin | self-suspend -> 400 CANNOT_MODIFY_OWN_ACCOUNT | 400 | 400 | PASS | Bad Request |
| 250 | Admin | suspend buyer -> 200 | 200 | 200 | PASS | {"id":"948a659f-276e-4337-ac64-754aadcec94d","email":"ali.al.balushi2@buyers.exa |
| 251 | Admin | suspended buyer login -> 403 | 403 | 403 | PASS | Forbidden |
| 252 | Admin | restore buyer -> 200 | 200 | 200 | PASS |  |
| 253 | Admin | user status changes audited with admin actor | true | true | PASS | audit=16 |
| 254 | Admin | PATCH user without reason -> 400 (or 200 if optional) | 200\|400 | 200 | PASS |  |
| 255 | Admin | revoke-sessions -> 200 | 200 | 200 | PASS | {"revokedCount":1,"success":true} |
| 256 | Admin | revoked buyer token -> 401 | 401 | 401 | PASS |  |
| 257 | Admin | demote second admin -> 200 | 200 | 200 | PASS | {"id":"a7424abf-453e-47e3-891b-5fcb5e818c39","email":"compliance.officer@automot |
| 258 | Admin | after demotion one fewer active admin remains | 2 | 2 | PASS |  |
| 259 | Admin | demote last admin (self) -> 400/409 | 400\|409 | 400 | PASS | Bad Request |
| 260 | Admin | re-promote second admin -> 200 | 200 | 200 | PASS |  |
| 261 | Admin | activate PENDING tenant with KYB NOT_SUBMITTED -> 409 | 409 | 409 | PASS | Conflict |
| 262 | Admin | suspend ACTIVE tenant -> 200 | 200 | 200 | PASS | {"id":"c21156de-f143-43f2-b9d6-6f4cdd20b759","slug":"hajar-mountain-motors","leg |
| 263 | Admin | suspension pauses all published listings | 0 | 0 | PASS | was 0 published; now paused=16 |
| 264 | Admin | suspended dealer vanishes from public dealers | 404 | 404 | PASS |  |
| 265 | Admin | suspended dealer has 0 public listings | 0 | 0 | PASS |  |
| 266 | Admin | same-status transition -> 409 | 409 | 409 | PASS | Conflict |
| 267 | Admin | reactivate tenant -> 200 | 200 | 200 | PASS | {"id":"c21156de-f143-43f2-b9d6-6f4cdd20b759","slug":"hajar-mountain-motors","leg |
| 268 | Admin | reactivation leaves listings PAUSED (dealer must republish) or restores PUBLISHED [record] | 0\|0 | 0 | PASS |  |
| 269 | Admin | CLOSED -> ACTIVE forbidden -> 409 | 409 | 409 | PASS |  |
| 270 | Admin | tenant status invalid enum -> 400 | 400 | 400 | PASS |  |
| 271 | Admin | tenant status changes audited | true | true | PASS | audit=10 |
| 272 | Admin | audit-logs -> 200 with items | true | true | PASS | status=200 n=20 keys=events,total,limit,offset |
| 273 | Admin | audit-logs limit=5000 -> 400 or clamped | 200\|400 | 200 | PASS |  |
| 274 | Admin | audit-logs offset=-1 -> 400 or clamped 200 | 200\|400 | 200 | PASS |  |
| 275 | Admin | outbox metrics pending matches DB | 14 | 14 | PASS |  |
| 276 | Admin | outbox retry-failed -> 200 | 200 | 200 | PASS | {"retriedCount":0} |
| 277 | Admin | outbox process -> 200 | 200 | 200 | PASS | {"processedCount":14,"metrics":{"pending":0,"processing":10,"sent":516,"failed": |
| 278 | Admin | GET verification of IN_REVIEW dealer -> 200 | 200 | 200 | PASS | status=ACTIVE |
| 279 | Admin | create dealer -> 201 PENDING with invitation | 200\|201 | 201 | PASS | {"id":"188b4fc2-2a89-4126-991c-3888c28709d6","slug":"qa-dealer-mw4myavo","legalN |
| 280 | Admin | create dealer duplicate slug -> 409 | 409 | 409 | PASS |  |
| 281 | Admin | invite dealer staff -> 201/200 | 200\|201 | 201 | PASS | {"success":true,"invitationId":"0e61bfd1-6ada-44c6-a40c-4cbc312b90cc","email":"n |
| 282 | Admin | invite response does not leak raw token | false | false | PASS |  |
| 283 | Admin | invite with bad role -> 400 | 400 | 400 | PASS |  |
| 284 | Admin | activate/verify bogus token -> 400/404 | 400\|404 | 400 | PASS |  |
| 285 | Admin | dealer OWNER on admin route -> 403 | 403 | 403 | PASS |  |
| 286 | Admin | delete user non-existent -> 404 | 404 | 404 | PASS |  |
| 287 | Rate limiting (last) | per-IP login limiter returns 429 within 12 attempts | true | true | PASS | first 429 at attempt 11 |

## Failures

None.
