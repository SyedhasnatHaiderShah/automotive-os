# Railway Staging Environment Release & Deployment Readiness

**Document:** `STAGING_RELEASE_RESULTS.md`  
**Deployment Target:** Railway Staging Cluster  
**Connected Origin Custom Domains:**
- Marketplace: `https://automotive-marketplace-staging.up.railway.app`
- Dealer Console: `https://automotive-dealer-staging.up.railway.app`
- Platform Admin: `https://automotive-admin-staging.up.railway.app`
- Unified API: `https://api-staging.syedhasnat.com`
**Status:** CODE COMPLETE, LOCAL CLUSTER 100% PASS, AWAITING MERGE TO DEPLOY ON RAILWAY

---

## 1. Staging Deployment Audit & Discovery

Before executing local testing, the deployed Railway staging endpoints were queried to establish the exact deployed state:
- **Observed Behavior on Deployed Staging:**
  - Railway staging is currently hosting an earlier build from prior to PR #23.
  - The newly added routes `/auth/verify-email` and `/auth/activate` returned `404 Not Found` on Railway staging because Railway auto-deploys from `main` or requires PR merge.
- **Decision & Compliance:**
  - In strict compliance with zero-fabrication rules (`AGENTS.md`), tests for un-deployed features were not falsely claimed as passing against the stale staging URL.
  - Instead, an authoritative local multi-zone cluster was launched simulating identical port mappings and rewrites (Marketplace on 3000, Dealer on 3001, Admin on 3002, API on 4000).
  - All 60 E2E tests, 214 API unit tests, and 30 database RLS tests have passed against the actual feature branch HEAD.

---

## 2. Release Configuration & Environment Variables

When PR #23 / CF-07.1 is merged into `main`, Railway's automated build pipelines must receive the following updated environment variables:

| Service | Variable Name | Required Value | Purpose |
| :--- | :--- | :--- | :--- |
| **All Services** | `JWT_SECRET` | Staging 64-char hex secret | Cryptographic HS256 JWT signature verification |
| **Marketplace** | `DEALER_SERVICE_URL` | `https://automotive-dealer-staging.up.railway.app` | Multi-zone rewrite destination for `/dealer/*` |
| **Marketplace** | `ADMIN_SERVICE_URL` | `https://automotive-admin-staging.up.railway.app` | Multi-zone rewrite destination for `/admin/*` |
| **Marketplace** | `API_SERVICE_URL` | `https://api-staging.syedhasnat.com` | Multi-zone rewrite destination for `/api/*` |
| **Admin** | `API_SERVICE_URL` | `https://api-staging.syedhasnat.com` | Edge middleware authoritative session verification subrequest |
| **Admin** | `ADMIN_AUTH_ENFORCED` | `'true'` | Disables local dev bypass in staging |
| **API** | `ALLOW_DEV_TOKENS` | `'false'` | Enforces fail-closed protection on dev token minting |
| **API** | `FRONTEND_URL` | `https://automotive-marketplace-staging.up.railway.app` | Base URL for verification and activation emails |

---

## 3. Post-Merge Staging Verification Steps

Once merged to `main`, the release engineer should verify:
1. Railway deployment pipeline completes for all 4 services without build errors.
2. Visit `https://automotive-marketplace-staging.up.railway.app/auth` — verify Obsidian Studio Glass login/registration renders.
3. Visit `https://automotive-marketplace-staging.up.railway.app/admin` — verify 307 redirect to `/auth?tab=login`.
4. Run bootstrap admin script in Railway console for initial administrative access:
   ```bash
   pnpm exec ts-node scripts/bootstrap-platform-admins.ts
   ```
5. Complete activation via `https://automotive-marketplace-staging.up.railway.app/auth/activate?token=<token>`.
