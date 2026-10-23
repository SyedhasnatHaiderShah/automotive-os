# CF-01 — Environment & Secret Configuration Matrix

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document ID:** `docs/deployment/CF01_ENVIRONMENT_MATRIX.md`  
**Date:** October 23, 2026  
**Status:** ARCHITECTURAL SPECIFICATION

---

## 1. Overview & Classification

Automotive OS enforces strict environment separation across **Local Development**, **Staging**, and **Production**. 
Variables are classified into three sensitivity tiers:
1. **PUBLIC**: Safe to be exposed to client web browsers (prefixed with `NEXT_PUBLIC_`).
2. **RESTRICTED**: Internal operational values (service ports, URLs, timeouts) non-sensitive to public visibility.
3. **CONFIDENTIAL / SECRET**: High-value credentials (cryptographic keys, database passwords, API tokens, cloud access keys). **Never committed to version control.**

---

## 2. Environment Matrix by Application Tier

### A. Frontend Applications (Cloudflare Workers via OpenNext)
Deployed as Cloudflare Workers (`marketplace`, `dealer`, `admin`).

| Variable Name | Tier | Local Dev | Staging Value | Production Value | Purpose / Handling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NEXT_PRIVATE_MINIMAL_MODE` | RESTRICTED | `1` | `1` | `1` | Enforces serverless isolate mode for NextNodeServer |
| `NEXT_PUBLIC_APP_ENV` | PUBLIC | `development` | `staging` | `production` | Active environment identifier |
| `NEXT_PUBLIC_API_URL` | PUBLIC | `http://localhost:4000` | `https://api.staging.automotive-os.ae` | `https://api.automotive-os.ae` | NestJS backend ingress URL |
| `NEXT_PUBLIC_STORAGE_URL` | PUBLIC | `http://localhost:9000/media` | `https://media.staging.automotive-os.ae` | `https://media.automotive-os.ae` | Cloudflare R2 public vehicle media CDN |
| `NEXT_PUBLIC_MARKETPLACE_URL` | PUBLIC | `http://localhost:3000` | `https://marketplace.staging.automotive-os.ae` | `https://automotive-os.ae` | Canonical marketplace URL |
| `NEXT_PUBLIC_DEALER_URL` | PUBLIC | `http://localhost:3001` | `https://dealer.staging.automotive-os.ae` | `https://dealer.automotive-os.ae` | Dealer cockpit portal URL |
| `NEXT_PUBLIC_ADMIN_URL` | PUBLIC | `http://localhost:3002` | `https://admin.staging.automotive-os.ae` | `https://admin.automotive-os.ae` | Platform ops portal URL |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | PUBLIC | `en` | `en` | `en` | Default UI language |
| `NEXT_PUBLIC_SUPPORTED_LOCALES`| PUBLIC | `en,ar` | `en,ar` | `en,ar` | Supported locales for UAE marketplace |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | PUBLIC | `AED` | `AED` | `AED` | Sovereign currency standard |

---

### B. Backend API Container (`apps/api` via Cloudflare Tunnel)
Hosted on origin Node 22 container.

| Variable Name | Tier | Staging Specification | Production Specification | Secret Storage Target |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | RESTRICTED | `production` | `production` | ConfigMap / Compose Env |
| `PORT` | RESTRICTED | `4000` | `4000` | ConfigMap / Compose Env |
| `DATABASE_URL` | SECRET | Direct Postgres pooled connection string | Sovereign Postgres connection string | Secret Manager / Compose Env |
| `DIRECT_URL` | SECRET | Postgres direct migration URL | Sovereign Postgres direct migration URL | Secret Manager / Compose Env |
| `REDIS_URL` | SECRET | `redis://redis:6379` | Dedicated Redis cluster URL | Secret Manager / Compose Env |
| `JWT_SECRET` | SECRET | Cryptographically generated (≥256-bit) | Cryptographically generated (≥256-bit) | Secret Manager / Compose Env |
| `CORS_ORIGINS` | RESTRICTED | Staging frontends (exact HTTPS domains) | Production frontends (exact HTTPS domains)| ConfigMap / Compose Env |
| `R2_ACCESS_KEY_ID` | SECRET | Cloudflare R2 staging token ID | Cloudflare R2 production token ID | Secret Manager / Compose Env |
| `R2_SECRET_ACCESS_KEY` | SECRET | Cloudflare R2 staging secret key | Cloudflare R2 production secret key | Secret Manager / Compose Env |
| `R2_BUCKET_NAME` | RESTRICTED | `automotive-os-media-staging` | `automotive-os-media-prod` | ConfigMap / Compose Env |
| `R2_ENDPOINT` | RESTRICTED | `https://<account_id>.r2.cloudflarestorage.com` | `https://<account_id>.r2.cloudflarestorage.com` | ConfigMap / Compose Env |
| `R2_PUBLIC_URL` | RESTRICTED | `https://media.staging.automotive-os.ae` | `https://media.automotive-os.ae` | ConfigMap / Compose Env |
| `RATE_LIMIT_TTL` | RESTRICTED | `60` | `60` | ConfigMap / Compose Env |
| `RATE_LIMIT_MAX` | RESTRICTED | `100` | `100` | ConfigMap / Compose Env |

---

## 3. GitHub Actions CI/CD Secrets Inventory

The following secrets must be registered under **GitHub Repository Secrets** or environment-specific secret vaults prior to executing `.github/workflows/deploy.yml`:

| Secret Name | Scope | Required For |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Staging / Prod | Deploying Workers frontends via Wrangler CLI (`wrangler deploy`) |
| `CLOUDFLARE_ACCOUNT_ID` | Staging / Prod | Identifying Cloudflare tenant account for Workers & R2 |
| `CLOUDFLARE_TUNNEL_TOKEN` | Staging / Prod | Authenticating `cloudflared` container sidecar to Edge Tunnel |
| `STAGING_HOST` | Staging | Target SSH origin host IP / domain for backend deployment |
| `STAGING_USER` | Staging | Deployer user on staging origin host |
| `STAGING_SSH_KEY` | Staging | Private SSH key for automated deployment pipeline |
| `PROD_HOST` | Production | Target SSH origin host IP / domain for production backend |
| `PROD_USER` | Production | Deployer user on production origin host |
| `PROD_SSH_KEY` | Production | Private SSH key for automated production pipeline |
| `R2_ACCESS_KEY_ID` | Staging / Prod | S3-compatible credentials for R2 bucket operations |
| `R2_SECRET_ACCESS_KEY` | Staging / Prod | S3-compatible secret key for R2 bucket operations |

---

## 4. Fail-Closed Security Policy

1. If any required `SECRET` variable is missing or empty at container/worker startup, the application **must immediately terminate** with exit code 1.
2. Under no circumstance may development fallback keys (such as `dev-secret-change-in-prod`) be utilized in Staging or Production environments.
3. CORS configuration must fail closed if `CORS_ORIGINS` is unset, refusing all cross-origin requests.
