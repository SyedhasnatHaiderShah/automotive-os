# ADR-0001 Proposed technical baseline (approval pending)
Status: PROPOSED
- pnpm + Turborepo monorepo.
- Next.js App Router: apps/marketplace, apps/dealer, apps/admin.
- NestJS modular monolith: apps/api.
- Shared: packages/ui, packages/contracts, packages/config, packages/database.
- PostgreSQL + Prisma with explicit migrations reviewed in dev; RLS with non-bypass app role; Redis/BullMQ; S3-compatible private object store.
- OpenAPI and typed client; OIDC authentication; fine-grained tenant roles.
- Public catalogue via moderated redacted read model.
- CI gates: lint, typecheck, unit tests, integration tests, tenant isolation tests.
Do not lock framework versions until compatibility is checked; document versions once chosen.
