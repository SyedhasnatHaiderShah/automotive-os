# CF-01 — Cloudflare Staging Deployment & Operations Runbook

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document ID:** `docs/deployment/CF01_RUNBOOK.md`  
**Date:** October 23, 2026  
**Audience:** DevOps Engineers, Platform Administrators, Release Managers  
**Status:** STANDARD OPERATING PROCEDURE (SOP)

---

## 1. Prerequisites & Required Tooling

Ensure the following tools are available on the deployment workstation or CI runner:
- `node` ≥ 22.0.0 LTS
- `pnpm` ≥ 9.0.0
- `docker` ≥ 24.0.0 and `docker compose` ≥ 2.20.0
- `cloudflared` CLI (for tunnel initialization)
- `wrangler` CLI (`pnpm add -D wrangler` or via npx)
- Active Cloudflare API Token with `Workers:Edit`, `Pages:Edit`, `DNS:Edit`, `Access:Edit`, and `R2:Edit` permissions.

---

## 2. Phase 1: Edge Infrastructure & Storage Provisioning

### Step 1.1: Create Cloudflare R2 Buckets
```bash
# Authenticate wrangler
export CLOUDFLARE_ACCOUNT_ID="<your-account-id>"
export CLOUDFLARE_API_TOKEN="<your-api-token>"

# 1. Create Public Vehicle Media Bucket
wrangler r2 bucket create automotive-os-media-staging

# 2. Create Strict-Private KYB Document Bucket
wrangler r2 bucket create automotive-os-kyb-staging

# 3. Apply CORS policy to public media bucket
wrangler r2 bucket cors set automotive-os-media-staging --file deploy/cloudflare/r2-policies.json
```

### Step 1.2: Initialize Cloudflare Tunnel for Backend API
```bash
# 1. Create named tunnel
cloudflared tunnel create automotive-os-staging-tunnel

# 2. Route hostname to tunnel
cloudflared tunnel route dns automotive-os-staging-tunnel api.staging.automotive-os.ae

# 3. Store the generated tunnel credentials securely on the origin host at /etc/cloudflared/creds.json
```

### Step 1.3: Configure Zero Trust Access for Platform Admin
1. Navigate to **Cloudflare Zero Trust Dashboard** > **Access** > **Applications**.
2. Add Self-Hosted Application:
   - Application Name: `Automotive OS — Platform Admin Staging`
   - Application Domain: `admin.staging.automotive-os.ae`
   - Session Duration: `12 Hours`
3. Add Access Policy:
   - Action: `Allow`
   - Rule: Require corporate IdP login with MFA and UAE Geo-IP (`AE`).

---

## 3. Phase 2: Origin Backend & Database Provisioning

On the staging origin host (`me-central-1` VPS / VM):

### Step 2.1: Clone and Configure Environment
```bash
# Clone repository
git clone https://github.com/SyedhasnatHaiderShah/automotive-os.git /opt/automotive-os
cd /opt/automotive-os

# Copy and populate environment secrets
cp deploy/k8s/02-secret.yaml.template .env.staging
# (Populate DATABASE_URL, JWT_SECRET, CLOUDFLARE_TUNNEL_TOKEN, R2 credentials)
```

### Step 2.2: Apply Database Schema & RLS Policies
```bash
# Run Prisma schema migrations
pnpm --filter @automotive-os/database prisma migrate deploy

# Verify 28 RLS policies are active
pnpm --filter @automotive-os/database exec tsx scripts/verify-rls.ts
```

### Step 2.3: Launch Backend Origin Stack
```bash
# Launch postgres, redis, api, and cloudflared tunnel sidecar
docker compose -f deploy/cloudflare/docker-compose.staging.yml up -d

# Verify container health
docker compose -f deploy/cloudflare/docker-compose.staging.yml ps
```

---

## 4. Phase 3: Frontend Applications Deployment (Cloudflare Workers)

Execute the OpenNext build and Wrangler deployment for each frontend:

### Step 3.1: Deploy Buyer Marketplace
```bash
# 1. Build Next.js & bundle for Cloudflare Workers
pnpm --filter marketplace exec opennextjs-cloudflare build

# 2. Deploy Worker and Assets to Cloudflare Edge
pnpm --filter marketplace exec wrangler deploy .open-next/worker.js --config wrangler.staging.toml
```

### Step 3.2: Deploy Dealer DMS Cockpit
```bash
# 1. Build Next.js & bundle for Cloudflare Workers
pnpm --filter dealer exec opennextjs-cloudflare build

# 2. Deploy Worker and Assets to Cloudflare Edge
pnpm --filter dealer exec wrangler deploy .open-next/worker.js --config wrangler.staging.toml
```

### Step 3.3: Deploy Platform Admin Ops Command
```bash
# 1. Build Next.js & bundle for Cloudflare Workers
pnpm --filter admin exec opennextjs-cloudflare build

# 2. Deploy Worker and Assets to Cloudflare Edge
pnpm --filter admin exec wrangler deploy .open-next/worker.js --config wrangler.staging.toml
```

---

## 5. Phase 4: Post-Deployment Smoke Test Suite

Verify all public and private endpoints:

```bash
# 1. Backend API Health
curl -sSf https://api.staging.automotive-os.ae/health | jq .

# 2. Buyer Marketplace SSR & Headers
curl -i https://marketplace.staging.automotive-os.ae/ | grep -E "x-opennext|HTTP/1.1 200"

# 3. Dealer DMS SSR
curl -i https://dealer.staging.automotive-os.ae/ | grep -E "x-opennext|HTTP/1.1 200"

# 4. Admin Access Zero Trust Redirect (Should return HTTP 302 to Cloudflare Access login)
curl -i https://admin.staging.automotive-os.ae/ | grep -E "Location: https://.*cloudflareaccess.com"

# 5. R2 Public Media Custom Domain
curl -i https://media.staging.automotive-os.ae/health-check.txt
```

---

## 6. Phase 5: Rollback Procedures

### Frontend Worker Rollback
Cloudflare Workers supports instantaneous instant-rollback to any previous deployment version:
```bash
# List previous deployments
wrangler deployments list --config apps/marketplace/wrangler.staging.toml

# Rollback to prior known good deployment ID
wrangler rollback <deployment-id> --config apps/marketplace/wrangler.staging.toml
```

### Backend Origin Rollback
```bash
# Revert container image to previous tag
export APP_VERSION=staging-previous
docker compose -f deploy/cloudflare/docker-compose.staging.yml up -d api
```
