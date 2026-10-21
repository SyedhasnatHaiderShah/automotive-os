# Automotive OS — concise product brief (approved direction)

## Market & users
UAE-first (Dubai + Sharjah pilot, eventually all seven emirates), country-ready expansion. Verified licensed dealers sell new, used and certified pre-owned cars. Buyers are UAE residents, citizens or visitors. English/Arabic RTL, AED, UAE local time for display.

## Three applications
1. **Marketplace & Buyer:** home, faceted vehicle search, results, comparison, detailed listing, verified dealer storefront, buyer profile, favorites, saved searches/alerts, enquiries, test drives, offer/negotiation later, garage.
2. **Dealer SaaS/DMS:** KYB, branches, roles, VIN-based vehicle inventory, image/media, publish approvals, incoming leads & pipeline, assignments, appointments, sales; eventual workshop/service, parts, F&I, accounting, reporting, fleet.
3. **Platform Admin:** KYB verification, moderation, disputes, subscriptions, feature plans, analytics, audit.

## Differentiation and constraints
One dealer stock record → reviewed public listing → purpose-scoped buyer lead → CRM → appointment → transaction → ownership/aftersales. Trust-focused vehicle details and clear seller provenance; no misleading badges. Buyer account remains global, dealer CRM is tenant-private.

## MVP (P0)
Identity, dealer tenancy & permissions, KYB manual review, canonical inventory, moderated public listing, SEO/search, buyer sign-in/profile, favorites, enquiries with consent, dealer leads/appointments, platform moderation, audit/outbox, basic admin and monitoring. Follow the existing work backlog for ordering. Do not implement fully online vehicle sale, escrow, lender underwriting, government RTA integration, detailed GL, or full workshop at P0.

## UI direction
Premium **dark** consumer marketplace with restrained glossy/translucent panels (luxury automotive visual language); **light glass** dealer and admin dashboard surfaces with high information density. Inspired by modern premium hardware UI, not a copy of any proprietary OS. Strong typography and large vehicle photography; minimal ornamental blur; high contrast, keyboard focus, mobile-first and Arabic RTL.

## Open product decisions
Brand name AutoNexa is a placeholder; exact buyer consent language, paid plan pricing, third-party vehicle inspection tiers, financing/insurance partners, seller onboarding policy need approval. Mark these TBD, never invent contractual or regulatory guarantees.
