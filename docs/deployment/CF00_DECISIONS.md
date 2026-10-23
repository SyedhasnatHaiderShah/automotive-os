# CF-00 — Architecture Decision Records (ADRs) for Cloudflare Staging Adoption

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document:** `docs/deployment/CF00_DECISIONS.md`  
**Status:** ACCEPTED (ARCHITECTURAL GOVERNANCE)  
**Date:** October 23, 2026  

---

## ADR-CF01: Frontend Deployment Target — Cloudflare Pages via OpenNext

### Status
**ACCEPTED**

### Context
Automotive OS features three frontends (`marketplace`, `dealer`, `admin`) built with Next.js 15.1.7 and React 19. The legacy deployment architecture packaged these as Docker containers running in Kubernetes with NGINX ingress. This incurred high pod memory overhead, cold starts, and complex SSL ingress maintenance.

### Decision
Deploy all three Next.js 15 frontends to **Cloudflare Pages / Workers** using the official **`@opennextjs/cloudflare`** adapter with `nodejs_compat` runtime flags.
- `apps/marketplace` -> `marketplace.staging.automotive-os.ae`
- `apps/dealer` -> `dealer.staging.automotive-os.ae`
- `apps/admin` -> `admin.staging.automotive-os.ae`

### Consequences
- **Positive**: Sub-50ms edge rendering across the UAE, automatic global SSL, zero container orchestration for frontend apps, instant preview deployments on staging PRs.
- **Negative / Risks**: Must avoid Node.js native binary addons in frontends. Authenticated dealer queries must strictly pass `cache: "no-store"` to prevent edge caching of private operational data.

---

## ADR-CF02: Backend API Hosting — Node 22 Container behind Cloudflare Tunnel

### Status
**ACCEPTED**

### Context
`apps/api` is a NestJS 10 modular monolith using `@nestjs/platform-express`, Prisma ORM, and BullMQ background workers (`ioredis`). Direct execution on Cloudflare Workers is blocked because Workers isolates do not support long-running background processes or persistent Redis TCP connections.

### Decision
Retain `apps/api` as a **containerized Node.js 22 LTS service** hosted in a sovereign UAE VPS or private Kubernetes cluster (`me-central-1`), exposed to the internet exclusively through an outbound **Cloudflare Tunnel (`cloudflared`)**.

### Consequences
- **Positive**: Zero open inbound ports on the origin server; immunity to direct-to-IP DDoS attacks; complete compatibility with NestJS, BullMQ, and full Prisma features; edge security policies (WAF, TLS 1.3, DDoS) applied transparently by Cloudflare.
- **Negative**: Origin compute infrastructure remains required for the API and database.

---

## ADR-CF03: Database Pooling & RLS Safety — Transaction-Scoped Hyperdrive

### Status
**ACCEPTED**

### Context
Automotive OS relies on 28 PostgreSQL Row-Level Security (RLS) policies enforcing dealer multi-tenancy and buyer data isolation. Tenant context is set per transaction:
`SELECT set_config('app.tenant_id', :tenantId, true);`
Improper connection pooling could allow session leakage across tenants.

### Decision
1. All database access for authenticated dealer and buyer operations must continue flowing through `apps/api` using Prisma's interactive transaction wrapper (`$transaction`).
2. Any edge worker accessing PostgreSQL via Cloudflare Hyperdrive must operate under strict **Transaction Pooling Mode** and target only public read projections (`status = 'PUBLISHED'`).

### Consequences
- **Positive**: Complete defense against cross-tenant data leakage while benefiting from connection pooling and reduced latency.
- **Negative**: Edge functions are prohibited from executing raw non-transactional tenant writes.

---

## ADR-CF04: Object Storage — Cloudflare R2 for Vehicle Media & Dossiers

### Status
**ACCEPTED**

### Context
The platform stores high-resolution vehicle exterior/interior photos, inspection PDFs, dealer trade licenses, and Emirates ID verification documents. Traditional cloud storage incurs significant bandwidth/egress costs.

### Decision
Use **Cloudflare R2** for all object storage requirements via its native S3-compatible API.
- Vehicle public media served via custom domain `https://media.staging.automotive-os.ae`.
- Private documents (trade licenses, KYC/KYB dossiers) accessed via short-lived pre-signed URLs or backend streaming.

### Consequences
- **Positive**: Zero egress bandwidth fees; native integration with Cloudflare Edge CDN caching; standard S3 client SDK compatibility.

---

## ADR-CF05: Platform Admin Security — Cloudflare Zero Trust (Access) Gating

### Status
**ACCEPTED**

### Context
`apps/admin` provides platform-wide superpowers (Article 99 dispute resolution, KYB dealer verification, listing moderation). Exposing the login surface to the public internet presents credential-stuffing risks.

### Decision
Gate `admin.staging.automotive-os.ae` behind **Cloudflare Zero Trust Access**:
- Mandatory multi-factor authentication (MFA) with identity provider (IdP).
- Geo-fencing restricted to UAE IP ranges (`AE`).
- Device posture checks where applicable.

### Consequences
- **Positive**: Zero-trust defense-in-depth; unauthenticated requests are blocked at the Cloudflare edge before reaching the application.

---

## ADR-CF06: Kubernetes Frontend & Ingress Decommissioning Strategy

### Status
**ACCEPTED**

### Context
With frontends moved to Cloudflare Pages and the API routed through Cloudflare Tunnel, the existing Kubernetes manifests (`06-marketplace.yaml`, `07-dealer.yaml`, `08-admin.yaml`, `09-ingress.yaml`) are redundant.

### Decision
1. Retain existing manifests in `deploy/k8s` for legacy validation until staging sign-off.
2. In subsequent phase CF-01, deprecate frontend deployments and ingress controller from the cluster manifest set, leaving only `api`, `postgres`, and `redis`.

---

## 4. Prerequisites for Phase CF-01 Execution

Before any live Cloudflare resources are provisioned or deployed:
1. **GitHub Pull Request Sign-Off**: PR containing AG-20 CI repair and deployment safety changes must be reviewed and merged.
2. **Cloudflare Credentials Setup**:
   - `CLOUDFLARE_API_TOKEN` configured in repository secrets with Pages and Workers permissions.
   - `CLOUDFLARE_ACCOUNT_ID` configured.
   - `CLOUDFLARE_TUNNEL_TOKEN` provisioned for the origin API server.
3. **Domain Delegation**: Zone `automotive-os.ae` active on Cloudflare DNS.
4. **Approval Gate**: In accordance with workspace rules, no cloud resources will be created or modified without explicit user authorization.
