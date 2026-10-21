# Automotive OS — workspace rules

- Product: UAE-first, internationalization-ready, multi-tenant dealership SaaS + verified-dealer car marketplace. English and Arabic (RTL). AED initially.
- Apps: Next.js marketplace/buyer, dealer DMS, platform admin; NestJS modular-monolith API. PostgreSQL + Prisma, Redis/BullMQ, object storage. Prefer Turborepo + pnpm + shared packages.
- Source order: approved `docs/design/DESIGN_HANDOFF.md` for visuals; `docs/PRODUCT_BRIEF.md` for product baseline; `docs/references/FRD_v2.1_UAE.docx` for full requirements; `docs/references/engineering/ARCHITECTURE.md` and `docs/references/db_starter/schema.prisma` as NON-PRODUCTION DRAFTS. Accepted ADRs override proposals. If conflict, ask before changing contracts.
- Deliver incrementally. Read only files relevant to task; inspect repo before edits. Do not re-read entire FRD without explicit need. Do not regenerate finished modules, change tech stack, or refactor unrelated files.
- Domain rules: dealer `tenant_id` on all private operational rows; enforce auth + active membership + fine-grained role permissions in API; defense-in-depth Postgres RLS; composite tenant-safe FKs. Never trust body-provided tenant ID for permissions. Test cross-tenant denial.
- Global buyer identity is not dealer-owned. Dealer gets only consent/purpose-scoped lead fields, only for authorized leads. Redact public listings; never expose stock costs, full buyer contacts, or private notes.
- Dealer stock is canonical; public listing is an approved moderated projection. Sold/suspended stock unpublishes reliably. Audit sensitive changes and record outbox events in same transaction.
- Financial amounts: smallest currency unit in integers, currency code; timestamps UTC, display Asia/Dubai. Privacy and UAE compliance require external legal review; do not claim certification.
- UI: implement approved Stitch screen and tokens without redesigning. Component-based, mobile responsive, RTL, accessible labels/focus/contrast; no placeholder or mock API in a finished flow unless explicitly tagged as demo.
- After each task: changed files, executed checks with PASS/FAIL, remaining risks, next suggested action. If command cannot run, say NOT RUN. No fabricated test results.
- Never run destructive database migrations, deployments, purchases, or publish external assets without explicit approval. Never print or commit secrets, including Stitch API keys.
