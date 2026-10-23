# Cloudflare Staging Readiness & CF-00 Architecture Assessment

**Target Domain**: Automotive OS UAE Multi-Tenant Dealership SaaS & Marketplace  
**Document**: `docs/deployment/CLOUDFLARE_STAGING_READINESS.md`  
**Author**: Principal Cloud & DevOps Architect  
**Date**: October 23, 2026  
**Status**: DRAFTED FOR REVIEW (CF-00 PLANNING)  

---

## 1. Cloudflare Architecture Overview

Automotive OS is architected as a modular monorepo comprising three Next.js 15 frontends, a NestJS modular monolith API, a PostgreSQL database with defense-in-depth Row-Level Security (RLS), Redis caching/queues, and S3-compatible object storage.

```
                      [ UAE & Global Internet Users ]
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │    Cloudflare Edge Network & WAF     │
                 │   - TLS 1.3 Termination (AED / GST)  │
                 │   - DDoS & Bot Management            │
                 │   - Edge Cache (Static Assets)       │
                 │   - Fail-Closed CORS Governance      │
                 └──────────────────┬───────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Cloudflare Pages │       │ Cloudflare Pages │       │ Cloudflare Pages │
│  (Marketplace)   │       │   (Dealer DMS)   │       │ (Platform Admin) │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │ (Protected HTTPS API / Token Auth)
                                    ▼
                 ┌──────────────────────────────────────┐
                 │       Cloudflare Tunnel / Edge       │
                 └──────────────────┬───────────────────┘
                                    ▼
                 ┌──────────────────────────────────────┐
                 │         NestJS Modular API           │
                 │ (Containerized / Cloudflare Origin)  │
                 └──────────────────┬───────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  CF Hyperdrive   │       │   Redis/BullMQ   │       │  Cloudflare R2   │
│  (Postgres Pool) │       │   (Lead Queue)   │       │  (Vehicle Media) │
└────────┬─────────┘       └──────────────────┘       └──────────────────┘
         ▼
┌──────────────────┐
│  PostgreSQL 16   │
│   (Tenancy RLS)  │
└──────────────────┘
```

---

## 2. Cloudflare Component Readiness Matrix

| Workspace Component | Target Cloudflare Service | Current Compatibility | Readiness Status | Action Required |
|---|---|---|---|---|
| `apps/marketplace` | Cloudflare Pages (Next.js 15) | Edge / SSR compatible | **READY** | Configure `@cloudflare/next-on-pages` or OpenNext adapter |
| `apps/dealer` | Cloudflare Pages (Next.js 15) | Dynamic SSR + Client | **READY** | Verify `cache: "no-store"` headers on edge runtime |
| `apps/admin` | Cloudflare Pages (Next.js 15) | Dynamic SSR + Client | **READY** | Route through Cloudflare Zero Trust (Access) |
| `apps/api` | Cloudflare Tunnel → Containerized API | Node.js 22 LTS (NestJS) | **READY** | Host origin container behind Cloudflare Tunnel (cloudflared) |
| `@automotive-os/database` | Cloudflare Hyperdrive → PostgreSQL | Prisma ORM with RLS | **READY** | Bind Hyperdrive connection string to accelerate edge queries |
| Object Storage | Cloudflare R2 | S3 API Compatible | **READY** | Map `S3_ENDPOINT` and `S3_BUCKET` to R2 bucket credentials |

---

## 3. CF-00: Next Compatibility Step

The immediate prerequisite before executing Cloudflare staging deployments is **CF-00: Cloudflare Runtime & Edge Compatibility Audit**.

### Scope of CF-00
1. **Edge Runtime Validation**:
   - Verify that all server-side rendering logic in `apps/marketplace`, `apps/dealer`, and `apps/admin` operates cleanly without unpolyfilled Node.js-specific native binaries.
   - Confirm standard web APIs (`fetch`, `Request`, `Response`, `AbortSignal`, `crypto.subtle`) are strictly used across edge routes.
2. **Hyperdrive Integration Verification**:
   - Validate PostgreSQL connection string swapping to Cloudflare Hyperdrive in staging.
   - Verify Prisma client works transparently with Hyperdrive connection pooling without breaking composite tenant foreign keys or session-based RLS settings (`SET LOCAL app.current_tenant_id`).
3. **Cloudflare Zero Trust Access for Admin**:
   - Restrict `admin.staging.automotive-os.ae` behind Cloudflare Access with multi-factor authentication (MFA) and UAE IP geo-fencing.
4. **Wrangler Configuration Manifests**:
   - Generate environment-specific `wrangler.toml` files for staging deployments.

---

## 4. Environment Governance & Compliance Boundaries

* **No Production Deployments**: Destructive migrations, live production deployments, and external cloud provisioning remain gated until staging PR sign-off.
* **Third-Party Live Handshakes**: Integration truth flags for live UAE PASS OIDC and live bank escrow remain `false` by design until official government/banking onboarding.
* **Security & Audit Adherence**: All staging deployments must maintain strict HTTPS allowlists, fail-closed CORS, and zero default tenant fallbacks.
