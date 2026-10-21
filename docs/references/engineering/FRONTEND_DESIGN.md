# Frontend design system and route plan

Working name **AutoNexa** is only a UI placeholder; production name not chosen. Prototype: `frontend/preview.html`, open locally in a browser. Demo numbers and listing records are fictional. This is NOT a production Next.js build.

## UX goals

1. The marketplace should optimize trustworthy vehicle discovery and qualified enquiries, not deceptive urgency tactics.
2. Buyers should understand vehicle status, seller identity, condition, GCC specs, ownership claims, and exactly what their dealer contact action shares.
3. Dealer staff should not duplicate inventory between stock management and marketplace publishing.
4. Platform moderation should make approvals fast but traceable.
5. Mobile-first search and vehicle details, accessible input labels, keyboard focus, Arabic RTL support at launch.

## Application route map (Next.js App Router)

```
apps/marketplace/app/
  (public)/page.tsx                      # Landing + prominent search
  (public)/cars/page.tsx                 # Faceted search (server-rendered + client filters)
  (public)/cars/[slug]/page.tsx          # Vehicle details, media, trust disclosures
  (public)/dealers/[slug]/page.tsx       # Verified dealer storefront
  (buyer)/garage/page.tsx                # Buyer overview
  (buyer)/garage/saved/page.tsx          # Favorites/saved searches
  (buyer)/garage/enquiries/page.tsx      # Customer-to-dealer enquiry tracker
  (buyer)/garage/appointments/page.tsx   # Test-drive appointments
apps/dealer/app/
  (workspace)/dashboard/page.tsx
  (workspace)/inventory/page.tsx
  (workspace)/inventory/new/page.tsx
  (workspace)/inventory/[id]/page.tsx
  (workspace)/listings/page.tsx
  (workspace)/crm/leads/page.tsx
  (workspace)/appointments/page.tsx
  (workspace)/settings/team/page.tsx
apps/admin/app/
  (ops)/overview/page.tsx
  (ops)/dealers/verification/page.tsx
  (ops)/listings/moderation/page.tsx
  (ops)/trust/reports/page.tsx
```

## Screen inventory and acceptance

| Screen | Primary visible elements | Conversion / task |
|---|---|---|
| Marketplace home | Hero search, quick filters, dealer-listed cars, confidence explanations | Search cars |
| Search results | Filters: emirate, make/model, body, price, year, km, fuel, transmission, condition, GCC; sorting and map optional | Open listing |
| Vehicle detail | Gallery, condition disclosure, dealer verified status, vehicle attributes, price history source, location, enquiry/test drive | Qualified enquiry |
| Buyer profile | Purchase preferences, contact permissions, saved searches, favorites, enquiry history, appointments | Keep buyer informed |
| Dealer dashboard | Active inventory, live listings, moderation queue, leads and response times | Act on business |
| Dealer inventory editor | Canonical stock details, media, asking price, stock status, listing state | Publish reliably |
| Dealer CRM | Leads with consent-specific contact, owner, task, stage, appointment | Convert buyer |
| Platform operations | Dealer verification, reported listings, listing freshness, complaints, subscription status | Maintain integrity |

## Proposed design tokens

Colors: ink `#18212A`, dark blue `#122534`, action green `#147C64`, light mint `#E5F2EE`, background `#F7F8F9`, border `#E2E7EB`, warm accent `#ED8248`. Typography: Manrope headings, DM Sans body with system fallbacks. Radius: 12–20px; spacing increments: 4/8/12/16/24/32. AA contrast tests required before production. RTL typography, layout mirroring, numeric semantics and dir-specific icons need separate QA.

## First three user journeys to prototype in Next.js

1. Search → filter → detail → login (if needed) → consent → submit enquiry → confirmation.
2. Dealer login → create stock → upload 8+ images → submit listing → review → publish.
3. Platform reviewer → review dealer KYB → approve → moderate submitted listing → audit trail.

## Design questions to settle

- Launch brand and product name; UI currently uses a placeholder.
- Are private sellers allowed in a future release? Architecture currently dealer-first.
- Is inspection mandatory, optional, or a verified third-party tier?
- Does the buyer request a test drive without logging in? Baseline requires buyer login to reduce spam.
- Do we display listing price history or only current asking price in R1?
- Arabic content strategy: dealer-provided or human-reviewed translation?
