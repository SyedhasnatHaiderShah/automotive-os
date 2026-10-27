# CF-07: Railway Staging Deployment Guide

## 1. Overview & Service Architecture

Automotive OS runs on Railway as four discrete services under the `staging` environment:
1. `automotive-marketplace` (Next.js 15 App Router — Primary Edge Ingress)
2. `automotive-dealer` (Next.js 15 App Router — `basePath: /dealer`)
3. `automotive-admin` (Next.js 15 App Router — `basePath: /admin`)
4. `automotive-api` (NestJS 11 Modular Monolith — API Prefix `/api`)
5. `automotive-postgres` (PostgreSQL 16 with Row-Level Security)

In Mission CF-07, `automotive-marketplace` acts as the edge reverse-proxy for the single-domain topology. All public browser traffic enters via `automotive-marketplace-staging.up.railway.app`, which routes internal micro-frontend requests across the Railway private network.

---

## 2. Environment Variables Configuration

### 2.1 `automotive-marketplace` (Edge Ingress)
| Variable Name | Staging Value / Format | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and secure cookies |
| `PORT` | `3000` | Port for marketplace listener |
| `NEXT_PUBLIC_APP_URL` | `https://automotive-marketplace-staging.up.railway.app` | Canonical public origin |
| `API_SERVICE_URL` | `http://automotive-api.railway.internal:4000` | Railway private network internal rewrite target |
| `DEALER_SERVICE_URL` | `http://automotive-dealer.railway.internal:3001` | Railway private network internal rewrite target |
| `ADMIN_SERVICE_URL` | `http://automotive-admin.railway.internal:3002` | Railway private network internal rewrite target |

### 2.2 `automotive-dealer` (`basePath: /dealer`)
| Variable Name | Staging Value / Format | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `3001` | Port for dealer listener |
| `NEXT_PUBLIC_API_URL` | `/api` | Relative path on single domain (no CORS needed) |

### 2.3 `automotive-admin` (`basePath: /admin`)
| Variable Name | Staging Value / Format | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `3002` | Port for admin listener |
| `NEXT_PUBLIC_API_URL` | `/api` | Relative path on single domain (no CORS needed) |
| `JWT_SECRET` | *Strong 64-char secret* | Used by Edge Middleware to verify `ao_session` |

### 2.4 `automotive-api` (NestJS Monolith)
| Variable Name | Staging Value / Format | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode and secure cookies |
| `PORT` | `4000` | Port for API listener |
| `DATABASE_URL` | `postgresql://...` | Connection string for non-bypass app role |
| `JWT_SECRET` | *Strong 64-char secret* | Token signing and verification |
| `FRONTEND_URL` | `https://automotive-marketplace-staging.up.railway.app` | Trusted origin |

---

## 3. Deployment & Migration Runbook

### Step 1: Database Migration Execution
Before deploying the updated application code, run the Prisma migration against the PostgreSQL instance:

```bash
pnpm --filter @automotive-os/database run prisma:deploy
```
*Verification*: Check that `UserStatus` enum, additive columns on `users`, and new tables `sessions` and `user_invitations` exist with RLS enabled.

### Step 2: Deploy Backend & Micro-Frontends
Deploy services in the following order:
1. `automotive-api`
2. `automotive-dealer`
3. `automotive-admin`
4. `automotive-marketplace` (Edge Ingress)

### Step 3: Execute Platform Admin Bootstrap
Once the API is active, run the bootstrap script via Railway CLI or one-off task:

```bash
railway run pnpm exec tsx scripts/bootstrap-platform-admins.ts
```

The script will output activation links for:
- `hasnathaider332@gmail.com`
- `hasnatshah230@gmail.com`

Both administrators will navigate to their respective activation URLs to establish their high-entropy passwords and enroll in MFA.

---

## 4. Post-Deployment Verification Steps

1. **Verify Marketplace Root**:
   Navigate to `https://automotive-marketplace-staging.up.railway.app/`. Ensure homepage renders with no asset 404s.
2. **Verify `/auth` Portal**:
   Navigate to `https://automotive-marketplace-staging.up.railway.app/auth`. Verify tab switching between Login and Register.
3. **Verify Dealer Subpath Rewrite**:
   Navigate to `https://automotive-marketplace-staging.up.railway.app/dealer`. Verify request proxies to `automotive-dealer` without 502/504 errors.
4. **Verify Admin Subpath Rewrite**:
   Navigate to `https://automotive-marketplace-staging.up.railway.app/admin`. Verify request proxies to `automotive-admin`.
5. **Verify API Subpath Rewrite**:
   Send `GET https://automotive-marketplace-staging.up.railway.app/api/v1/health`. Ensure HTTP 200 `{ status: "ok" }` response.
