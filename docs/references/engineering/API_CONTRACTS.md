# MVP REST API contracts — draft v0.1

All paths prefixed `/api/v1`. Error envelope `{error:{code,message,correlationId,details?}}`; pagination uses opaque cursors. Use `Idempotency-Key` for create commands that can retry. Sensitive fields never appear on public listing DTOs.

| Method | Path | Caller / scope | Behavior |
|---|---|---|---|
| GET | /public/listings | guest | Search/filter only published, eligible stock |
| GET | /public/listings/:slug | guest | Redacted listing details, dealership public summary |
| GET | /public/catalog/makes | guest | Make/model options |
| GET | /me | buyer/dealer | Authenticated identity summary |
| GET/PATCH | /me/buyer-profile | buyer | Own budget, interests, contact preferences |
| GET/POST | /me/favorites | buyer | Own bookmarked listings |
| DELETE | /me/favorites/:listingId | buyer | Remove bookmark |
| GET/POST | /me/saved-searches | buyer | Persist search and alerts |
| POST | /public/listings/:listingId/leads | buyer | Create enquiry + purpose-limited grant |
| GET | /me/enquiries | buyer | Enquiries created by this buyer |
| POST | /me/leads/:leadId/appointments | buyer | Propose test drive slot |
| GET | /tenants/:tenantId/dashboard | dealer member | Tenant-level metrics |
| GET/POST | /tenants/:tenantId/vehicles | dealer inventory role | Tenant stock read/create |
| PATCH | /tenants/:tenantId/vehicles/:id | dealer inventory role | Update stock, optimistic version |
| POST | /tenants/:tenantId/vehicles/:id/media | dealer inventory role | Signed upload request |
| POST | /tenants/:tenantId/vehicles/:id/listing | dealer inventory role | Create draft listing |
| POST | /tenants/:tenantId/listings/:id/submit | dealer inventory role | Submit for listing review |
| GET | /tenants/:tenantId/leads | dealer CRM role | Tenant leads, masked contact DTO |
| GET | /tenants/:tenantId/leads/:id | dealer CRM role | Grant-filtered buyer data |
| PATCH | /tenants/:tenantId/leads/:id/status | dealer CRM role | Authorized status transition |
| GET | /tenants/:tenantId/appointments | dealer | Tenant test drives |
| GET | /admin/verification/queue | authorized platform reviewer | Pending KYB |
| POST | /admin/verification/:tenantId/review | authorized platform reviewer | Approve/reject with reason |
| POST | /admin/listings/:id/decision | authorized platform moderator | Approve/reject, append audit |

### GET /api/v1/public/listings?emirate=Dubai&make=Toyota&maxPriceFils=12000000&cursor=...
```json
{
  "items": [{
    "id": "uuid", "slug": "toyota-rav4-xle-2024-abc123", "title": "Toyota RAV4 XLE 2024",
    "price": {"currency": "AED", "amountFils": "11200000"},
    "year": 2024, "mileageKm": 18500, "condition": "USED", "emirate": "Dubai",
    "seller": {"displayName": "Dealer Display Name", "verified": true},
    "media": [{"url": "signed-or-cdn-public-url", "alt": "Front view"}]
  }],
  "nextCursor": null
}
```

### POST /api/v1/public/listings/:listingId/leads
Authorization: buyer access token. Use explicit consent, NEVER infer marketing opt-in from enquiry submission.
```json
{
  "intent": "TEST_DRIVE", "preferredContact": "PHONE",
  "message": "I would like a Saturday test drive",
  "fieldsToShare": ["name", "phone"],
  "consentTextVersion": "buyer-lead-disclosure-en-AE-v1"
}
```
Success 201:
```json
{"id":"uuid","status":"NEW","listingId":"uuid","createdAt":"2026-10-20T10:00:00Z"}
```

### PATCH /api/v1/tenants/:tenantId/vehicles/:id
Authorization: authenticated user + active tenant membership + inventory.write. Business check: purchase cost may only be read by staff with inventory.cost.read.
```json
{"askingPriceFils":"11200000", "expectedVersion": 3, "stockStatus":"AVAILABLE"}
```
Conflict: 409 VERSION_CONFLICT. Errors: 403 TENANT_FORBIDDEN, 422 INVALID_VEHICLE_STATE.

## Acceptance tests for endpoints

- Tenant A member cannot GET / PATCH tenant B vehicle even when IDs are known.
- A buyer cannot receive dealership purchase price or full VIN from any public API.
- A seller cannot list unavailable/closed/expired-verification stock.
- Enquiries can only target currently published, eligible listings.
- An ungranted field is absent/masked, even if stored on global buyer profile.
- Replaying an enquiry with the same idempotency key does not duplicate leads.
- Listing publication writes one outbox event and recovers after worker retry.
- Suspending a seller removes public discoverability, independent of delayed index refresh.
