# S0/S1 implementation plan — first verified vertical slice

## Sprint S0: foundation (assumes 2-week sprint, team capacity to confirm)

| ID | Task | Acceptance criterion |
|---|---|---|
| ARC-001 | Establish pnpm/Turborepo monorepo with `marketplace`, `dealer`, `admin`, `api` | CI builds all apps independently |
| ARC-002 | Set up PostgreSQL, Redis, local object-store emulator | Dev environment one command start |
| ARC-003 | Implement OIDC login + identity map | JWT issuer/audience validated; tokens rejected if expired |
| ARC-004 | Build membership-based tenant context | Wrong-tenant member receives 403; no tenant id from body trusted |
| ARC-005 | Prisma migrations for core catalog, tenants, inventory, listings | Migration up/down and seed pass |
| ARC-006 | Implement tenant RLS policy and isolation tests | Cross-tenant read/write denied even when ID known |
| ARC-007 | Create API OpenAPI contract, lint/test CI, health endpoints | Swagger export checked in and smoke-tested |
| ARC-008 | Implement UI shared tokens + shells | Mobile layouts work, English/Arabic skeleton |
| ARC-009 | Define event outbox and worker retry strategy | Event after transaction; no duplicates on replay |
| ARC-010 | Security threat model and ADR sign-off | Roles, trust boundary and public projection documented |

## Sprint S1: first marketplace loop

1. Tenant and branch onboarding + KYB review.
2. Make/model catalog and inventory CRUD with composite tenant checks.
3. Vehicle media signed-upload flow, scanning and MIME validation.
4. Listing draft → submit → admin approve → published public projection.
5. Public vehicle search + listing detail (redacted only).
6. Buyer identity, favorite and enquiry consent/grant.
7. Dealer CRM lead list and detail.
8. End-to-end test from dealer stock creation to buyer lead appearing in correct tenant CRM.

## Vertical-slice demo acceptance checklist

- [ ] Dealer A and Dealer B exist with independently authorized staff.
- [ ] Dealer A uploads one vehicle with sample images and asking price.
- [ ] Reviewer approves Dealer A; one listing becomes public and searchable.
- [ ] Buyer saves car and submits an enquiry, agreeing to explicit contact-field sharing.
- [ ] Dealer A receives only that buyer's granted fields.
- [ ] Dealer B cannot see vehicle, lead, consent grant, or media.
- [ ] Dealer A marks stock SOLD; listing disappears from public search quickly.
- [ ] Duplicate enquiry retries do not create multiple leads.
- [ ] Audit and correlation IDs connect the event chain.
- [ ] Manual UX test at mobile width and Arabic RTL layout.

## Explicit deferrals

Escrow, actual title transfer, government registration APIs, underwriting, multi-currency checkout, advanced DMS accounting, service/parts operations, AI pricing, private seller onboarding and native mobile apps.
