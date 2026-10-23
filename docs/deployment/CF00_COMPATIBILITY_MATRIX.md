# CF-00 — Cloudflare Runtime & Infrastructure Compatibility Matrix

**System:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document:** `docs/deployment/CF00_COMPATIBILITY_MATRIX.md`  
**Author:** Principal Cloud & Application Security Architect  
**Date:** October 23, 2026  
**Status:** ARCHITECTURAL SPECIFICATION & COMPATIBILITY ASSESSMENT  

---

## 1. System Inventory & Cloudflare Mapping

| Workspace Target | Runtime / Framework | Primary Workload | Target Cloudflare Service | Compatibility Level |
|---|---|---|---|---|
| `apps/marketplace` | Next.js 15.1.7, React 19 | Public vehicle search, VIP enquiry, comparison matrix, buyer portal | Cloudflare Pages / Workers (`@opennextjs/cloudflare`) | **COMPATIBLE (EDGE SSR)** |
| `apps/dealer` | Next.js 15.1.7, React 19 | Multi-tenant dealership SaaS, inventory grid, sales, workshop, F&I | Cloudflare Pages / Workers (`@opennextjs/cloudflare`) | **COMPATIBLE (DYNAMIC SSR)** |
| `apps/admin` | Next.js 15.1.7, React 19 | Platform operations command, KYB dealership verification, moderation | Cloudflare Pages + Zero Trust Access | **COMPATIBLE (ZERO TRUST GATED)** |
| `apps/api` | NestJS 10.4.15, Express, Node 22 | Modular monolith backend, auth, RBAC, outbox processor, OpenAPI | Node 22 Container behind Cloudflare Tunnel | **ORIGIN REQUIRED (TUNNEL TERMINATION)** |
| `packages/database` | Prisma ORM 6.4.1, PostgreSQL 16 | Relational data, composite FKs, 28 PostgreSQL RLS policies | PostgreSQL 16 via Cloudflare Hyperdrive | **COMPATIBLE (TX POOLING ONLY)** |
| Queue / Cache | Redis 7, BullMQ | Transactional outbox, search indexing, rate limiting | Managed Redis behind Tunnel / Sovereign VPC | **ORIGIN REQUIRED (TCP PROTOCOL)** |
| Vehicle Media | S3-compatible Blob Storage | Vehicle high-res photography, inspection PDFs, dealer trade licenses | Cloudflare R2 (S3 API Compatible) | **100% COMPATIBLE (ZERO EGRESS)** |

---

## 2. Frontend Applications: Next.js 15 Edge Runtime Evaluation

### 2.1 Next.js 15 & React 19 Architecture Profile
All three frontends (`marketplace`, `dealer`, `admin`) are built on:
- Next.js `15.1.7` with App Router
- React `19.0.0`
- Zero C++ native Node addons
- Zero direct database connections (all communications flow via protected HTTPS API)
- Client/server separation using standard `fetch`, Web `Request`, Web `Response`, `Headers`, and `crypto.subtle`.

### 2.2 Edge Adapter Evaluation
| Adapter Technology | Next.js 15 Compatibility | React 19 Support | Async Request APIs (`headers()`, `cookies()`) | Verdict |
|---|---|---|---|---|
| **`@opennextjs/cloudflare`** | **EXCELLENT** | Supported natively | Fully supported via Cloudflare Workers `nodejs_compat` | **RECOMMENDED & CHOSEN** |
| `@cloudflare/next-on-pages` | DEPRECATED / LIMITED | Partial | Incompatible with Next 15 Async Request APIs | REJECTED |
| `vinext` | EXPERIMENTAL | Early | Lacks enterprise ecosystem support | REJECTED |
| Static Export (`output: 'export'`) | N/A | N/A | Does not support Dynamic Server Components or SSR | INSUFFICIENT FOR SAAS |

### 2.3 Application Runtime Profiles
1. **`apps/marketplace`**:
   - Mixed workload: ISR/Edge Cache for public catalog, dynamic SSR for buyer account dossier (`/account/profile/dossier`), comparisons, and enquiries.
   - Cache tags and stale-while-revalidate enabled on edge.
2. **`apps/dealer`**:
   - Dealership backoffice SaaS: Dynamic SSR and interactive client tables.
   - Requires strict `cache: "no-store"` on all authenticated dealer queries to prevent cross-tenant response leakage.
3. **`apps/admin`**:
   - Super-admin operations console.
   - Gated behind **Cloudflare Zero Trust (Access)** with corporate email SSO and UAE IP geo-fencing.

---

## 3. Backend API (`apps/api`): NestJS Monolith Hosting Evaluation

### 3.1 Can NestJS 10 run directly inside Cloudflare Workers?
**NO.** Direct execution inside Cloudflare Workers V8 isolates is fundamentally blocked by the following constraints:
1. **HTTP Server Core**: NestJS runs on top of `@nestjs/platform-express` (Express 4), which tightly couples to Node.js `http.Server`, native event loop sockets, and streams.
2. **Persistent TCP Sockets (BullMQ & Redis)**: The API hosts background consumers (`outbox.service.ts`, `listing-search-sync.service.ts`) using BullMQ and `ioredis`. Cloudflare Workers isolates have a maximum execution time and prohibit long-running background polling loops or persistent TCP client listeners.
3. **Prisma Engine Binary**: Standard Prisma Client on Node utilizes the Rust query engine binary. While Prisma Accelerate / `@prisma/adapter-pg` exists, the complex transaction-scoped RLS queries (`set_config('app.tenant_id', ...)`) are designed for persistent connection pools.

### 3.2 Hosting Decision: Node 22 Container + Cloudflare Tunnel
- **Architecture**: The NestJS API container runs in a sovereign UAE VPS or Kubernetes cluster (`me-central-1`) with **zero open public ports**.
- **Ingress**: A Cloudflare Tunnel daemon (`cloudflared`) connects outbound to Cloudflare Edge.
- **Edge Capabilities**:
  - Global TLS 1.3 termination.
  - Fail-closed CORS headers managed at the Cloudflare WAF.
  - DDoS mitigation and Cloudflare Rate Limiting.
  - Mutual TLS (mTLS) or Cloudflare Access service tokens between Edge frontends and API origin.

---

## 4. PostgreSQL Database & Row-Level Security (RLS) under Cloudflare Hyperdrive

### 4.1 Cloudflare Hyperdrive Overview
Cloudflare Hyperdrive accelerates database queries from Cloudflare Workers by establishing a global connection pool with latency-optimized routing back to the origin PostgreSQL database.

### 4.2 Critical Architectural Analysis: RLS Context & Connection Pooling
Automotive OS enforces multi-tenancy using transaction-scoped PostgreSQL session settings:
```sql
SELECT set_config('app.tenant_id', $1, true);
SELECT set_config('app.user_id', $2, true);
SELECT set_config('app.is_admin', $3, true);
```
The third parameter `true` marks the setting as **local to the transaction**.

| Pooling Mode | Behavior with `set_config(..., true)` | Risk Level | Mitigation |
|---|---|---|---|
| **Transaction Pooling** | Variable automatically clears on `COMMIT` or `ROLLBACK`. | **SAFE (ZERO LEAKAGE)** | **MANDATORY**: Hyperdrive / PgBouncer must operate in Transaction Mode. |
| **Session Pooling** | Variable persists across subsequent queries on the same connection. | **CRITICAL (CROSS-TENANT LEAK)** | **PROHIBITED**: Session pooling without transactional scoping would breach tenant boundaries. |

### 4.3 Hyperdrive Configuration Rules
1. Frontends do not execute direct multi-tenant database queries. All tenant operations are brokered by `apps/api`.
2. Any public read queries executed from edge workers via Hyperdrive must target only the public schema projections (`listings` with `status = 'PUBLISHED'`), without tenant modification rights.
3. In `apps/api`, all multi-tenant queries must continue using interactive transactions (`tx.$executeRawUnsafe`) to guarantee session isolation.

---

## 5. Caching, Queues & Object Storage

### 5.1 Redis & BullMQ
- **Constraint**: BullMQ is required for transactional outbox pattern event dispatching, guaranteed message ordering, and retry backoff.
- **Decision**: Keep Redis 7 as a dedicated managed service within the private origin VPC alongside NestJS API. Do not migrate BullMQ to Cloudflare KV or Durable Objects in this phase.

### 5.2 Cloudflare R2 (Vehicle Media & Dossiers)
- **Evaluation**: Cloudflare R2 is 100% S3 API compatible and incurs zero egress fees.
- **Configuration**:
  - `S3_ENDPOINT = https://<account_id>.r2.cloudflarestorage.com`
  - `S3_BUCKET = automotive-os-media-staging`
  - Public images served via Cloudflare CDN custom domain: `https://media.staging.automotive-os.ae`
  - Signed private upload URLs generated using `@aws-sdk/s3-request-presigner` work seamlessly with R2.

---

## 6. Redundant Kubernetes Resources Post-Cloudflare Adoption

When the three Next.js 15 frontends are hosted on Cloudflare Pages and the NestJS API is published via Cloudflare Tunnel, the following resources in `deploy/k8s` become redundant:

| K8s Resource File | Components | Post-Cloudflare Status | Rationale |
|---|---|---|---|
| `deploy/k8s/06-marketplace.yaml` | Deployment, Service (Marketplace) | **REDUNDANT** | Replaced by Cloudflare Pages (`apps/marketplace/wrangler.staging.toml`). |
| `deploy/k8s/07-dealer.yaml` | Deployment, Service (Dealer) | **REDUNDANT** | Replaced by Cloudflare Pages (`apps/dealer/wrangler.staging.toml`). |
| `deploy/k8s/08-admin.yaml` | Deployment, Service (Admin) | **REDUNDANT** | Replaced by Cloudflare Pages (`apps/admin/wrangler.staging.toml`). |
| `deploy/k8s/09-ingress.yaml` | NGINX Ingress, TLS Certs | **REDUNDANT** | Replaced by Cloudflare Edge routing and Cloudflare Tunnel (`cloudflared`). |
| `deploy/k8s/05-api.yaml` | Service NodePort/LoadBalancer | **SIMPLIFIED** | Internal ClusterIP only; ingress provided solely by `cloudflared` sidecar. |
