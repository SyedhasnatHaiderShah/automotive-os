# CF-02 — Cloudflare Staging Hardening & Preflight Readiness

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document ID:** `docs/deployment/CF02_READINESS.md`  
**Baseline Git Commit:** `main @ edd9c3956aa5733b07a92b54f570aad7d9ca2628`  
**Active Working Branch:** `feature/cf02-staging-hardening`  
**Date:** October 23, 2026  
**Auditor / Architect:** Automotive OS Cloudflare Release Architect  
**Status:** **PREFLIGHT AUDITED — READY FOR CLOUD_PROVISIONING_APPROVAL**

---

## 1. Executive Summary

CF-02 establishes the hardened, production-grade release architecture for Automotive OS on Cloudflare. All architectural components, CI/CD deployment definitions, edge manifests, and origin container configurations have been audited, remediated, and validated against actual local runtimes.

| Scope | Target Component | Architectural Decision | Verification Status |
| :--- | :--- | :--- | :--- |
| **CI / CD** | `.github/workflows/deploy.yml` | Remediated schema errors (run 39999144576); replaced container deploys with Workers | **PASS** |
| **Frontend 1** | `apps/marketplace` | Cloudflare Worker + Assets via OpenNext (`workerd:8788`) | **PASS** |
| **Frontend 2** | `apps/dealer` | Cloudflare Worker + Assets via OpenNext (`workerd:8789`) | **PASS** |
| **Frontend 3** | `apps/admin` | Cloudflare Worker + Assets via OpenNext (`workerd:8790`) | **PASS** |
| **Backend API** | `apps/api` | Node 22 Container + Cloudflare Tunnel (zero public host ports) | **PASS** |
| **Database** | PostgreSQL 16 | Direct connection pooling + transaction-scoped RLS (`me-central-1`) | **PASS** |
| **R2 CORS** | Vehicle Media & KYB | Validated against Cloudflare R2 schema (zero AWS S3 keys) | **PASS** |
| **Cache Safety** | Private Data Endpoints | Enforced `Cache-Control: private, no-cache, no-store` | **PASS** |
| **Data Residency**| Sovereign UAE Storage | Addressed global R2 boundaries; encrypted KYB storage in UAE | **PASS** |
| **Regulatory** | Live Financial Rails | All 10 live external rails locked to "Coming Soon" sandbox | **PASS** |
| **Release Gate** | Live Infrastructure | Halted at `CLOUD_PROVISIONING_APPROVAL` with cost audit | **HOLD (GATED)** |

---

## 2. CI/CD Diagnosis & Workflow Validation Autopsy (Run 39999144576)

### Root Cause Analysis
Workflow run `39999144576` failed on merged `main` (`edd9c39`) with `total_count: 0` (zero jobs executed) and conclusion `failure`.
Investigation of the workflow definition revealed three core issues:
1. **Dynamic Context in Job-Level Environment Name**:
   `database-migrations` and `deploy-infrastructure` declared:
   ```yaml
   environment:
     name: ${{ inputs.environment }}
   ```
   Under GitHub Actions workflow schema, `inputs` context is only valid within job steps and step-level conditionals. At the job definition level, `environment.name` only supports `github`, `needs`, `strategy`, `matrix`, and `vars` contexts. Referencing `inputs` at the job level triggers an immediate schema validation failure during repository workflow indexing on push.
2. **Obsolete Container-Based Deployments**:
   The workflow still retained legacy steps building Docker images for `marketplace`, `dealer`, and `admin` and attempting to apply Kubernetes manifests, contradicting ADR-CF01 where frontends are deployed to Cloudflare Workers.
3. **Misleading False-Success Reporting**:
   Legacy deployment scripts printed `[✓] Point-in-time recovery verified` and `Status: SUCCESSFUL ✅` even when database URLs or deployment SSH hosts were completely unset.

### Remediations Applied in CF-02:
- Removed invalid dynamic `environment: name:` job contexts; environment handling is parameterized cleanly within step runtime environment variables.
- Structured deployment into 6 distinct, sequential quality gates:
  1. `verify-gate`: Mandatory monorepo quality check (lint, typecheck, test, build).
  2. `build-api-container`: Builds and publishes container image for `apps/api` only.
  3. `database-migrations`: Machine-verifiable database pre-requisites and RLS deployment.
  4. `deploy-origin-api`: Deploys backend API container and Cloudflare Tunnel.
  5. `deploy-cloudflare-workers`: Matrix build and deploy of `marketplace`, `dealer`, `admin` to Cloudflare Workers via OpenNext & Wrangler.
  6. `health-probes`: Strict HTTP 200/302 verification that fails closed on unhealthy endpoints.
- Replaced printed claims with real machine assertions: absent credentials trigger immediate `exit 1`.

---

## 3. Cloudflare Workers Runtime Architecture (OpenNext)

Frontends are compiled into V8-compatible Cloudflare Workers bundles:
- **Build Output**: `.open-next/worker.js` (Server rendering logic) + `.open-next/assets` (Static JS, CSS, fonts).
- **Runtime Flag**: `nodejs_compat` enabled in `wrangler.staging.toml`.
- **Serverless Isolation**: `NEXT_PRIVATE_MINIMAL_MODE = "1"` supplied in worker `[vars]` to bypass Node middleware manifests.
- **Native Addon Shim**: Native `sharp` C++ binary replaced with unoptimized image loader and empty shim.
- **Cache Invalidation**: Private dealer and authenticated buyer routes strictly emit `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` to prevent edge cache leakage.

---

## 4. Origin & Database Isolation (RLS Boundaries)

- `apps/api` runs on sovereign UAE origin compute (`me-central-1`) inside a private Docker bridge network.
- **Zero Inbound Host Ports**: Host firewall blocks all public ingress; all traffic enters through outbound Cloudflare Tunnel (`cloudflared`).
- **PostgreSQL Connection Pooling**: Container-hosted API connects directly to PostgreSQL 16 on origin. Cloudflare Hyperdrive is neither required nor recommended for origin-hosted NestJS.
- **Multi-Tenancy RLS**: Enforced via Prisma interactive transactions:
  ```sql
  SELECT set_config('app.tenant_id', $1, true);
  ```
  The third parameter (`true`) scopes tenant context strictly to the transaction, resetting immediately upon commit or rollback and eliminating cross-tenant leakage.

---

## 5. Sovereign UAE Data Residency & R2 Storage Boundaries

- **Cloudflare R2**: Default R2 buckets are geographically distributed across Cloudflare's global edge network. Cloudflare does not currently offer a dedicated UAE data residency jurisdiction in the standard R2 product.
- **Public Vehicle Media**: `automotive-os-media-staging` utilizes R2 global edge caching freely for vehicle exterior/interior photos and marketing assets.
- **Confidential KYB / KYC Documents**: In compliance with UAE Federal Decree-Law No. 45/2021 (PDPL), sensitive dealer trade licenses, commercial registry filings, and Emirates ID records are encrypted client/server-side with sovereign AES-256 keys before upload, or persisted in UAE-local sovereign storage (`me-central-1` volume / MinIO), accessed via 900s pre-signed URLs.
