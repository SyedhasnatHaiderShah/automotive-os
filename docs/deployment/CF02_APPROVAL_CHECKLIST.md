# CF-02 — Cloud Provisioning Approval Checklist

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document ID:** `docs/deployment/CF02_APPROVAL_CHECKLIST.md`  
**Date:** October 23, 2026  
**Auditor / Architect:** Automotive OS Cloudflare Release Architect  
**Gate Status:** **HALTED AT CLOUD_PROVISIONING_APPROVAL GATE**

---

## 1. Approval Gate Purpose & Governance

Per repository safety rules (`AGENTS.md`), autonomous agents are strictly forbidden from provisioning live cloud resources, modifying live DNS zones, running destructive database migrations, or activating billable cloud services without affirmative, auditable human authorization.

This checklist must be reviewed, confirmed, and executed by an authorized Release Manager or Platform Administrator before triggering live deployment.

---

## 2. Itemized Pre-Deployment Checklist

### A. Pre-Deployment Code & Architecture Verification
- [x] **Monorepo Lint & Typecheck**: All 10 packages passed (`pnpm lint`, `pnpm typecheck`).
- [x] **Automated Test Suite**: 12 test suites, 133 unit/integration tests passed (`pnpm test`).
- [x] **Multi-Tenancy & RLS Integrity**: 16/16 RLS security test cases passed.
- [x] **OpenNext Workerd Runtime Tests**: Marketplace, Dealer DMS, and Admin Ops passed local Cloudflare Workers runtime verification.
- [x] **CI/CD Schema Syntax**: `.github/workflows/deploy.yml` verified with Node `yaml.parse`.
- [x] **R2 CORS Documents**: `r2-media-cors.json` and `r2-kyb-cors.json` validated against Cloudflare R2 schema with zero AWS S3 keys.

### B. Secret & Credential Readiness (To be verified in GitHub Secrets)
- [ ] `CLOUDFLARE_API_TOKEN` registered with Workers, DNS, Access, and R2 permissions.
- [ ] `CLOUDFLARE_ACCOUNT_ID` registered.
- [ ] `CLOUDFLARE_TUNNEL_TOKEN` registered for outbound origin tunnel.
- [ ] `STAGING_DATABASE_URL` registered pointing to sovereign PostgreSQL 16 database.
- [ ] `DEPLOY_SSH_HOST` and `DEPLOY_SSH_KEY` registered for origin container stack deployment.
- [ ] `JWT_SECRET` generated with high-entropy cryptographic key (≥256-bit).

### C. Sovereign UAE Infrastructure Readiness
- [ ] Sovereign UAE Origin Host (`me-central-1` VPS / VM) running Docker ≥24.0.0.
- [ ] PostgreSQL 16 instance accessible inside internal origin network with RLS capability.
- [ ] Redis 7 instance running with AOF persistence.
- [ ] Verified database snapshot / PITR backup completed prior to schema migration.

### D. DNS & Cloudflare Edge Services
- [ ] Domain `automotive-os.ae` nameservers active on Cloudflare.
- [ ] Subdomains configured:
  - `api.staging.automotive-os.ae` -> Tunnel CNAME
  - `marketplace.staging.automotive-os.ae` -> Worker Custom Domain
  - `dealer.staging.automotive-os.ae` -> Worker Custom Domain
  - `admin.staging.automotive-os.ae` -> Worker Custom Domain + Access Application
  - `media.staging.automotive-os.ae` -> R2 Custom Domain
- [ ] Cloudflare Access application created with UAE Geo-fencing (`AE`) + MFA.

### E. Regulatory & Financial Compliance
- [x] All 10 external live third-party rails marked as "Coming Soon" (`INTEGRATION_TRUTH_TABLE.md`).
- [x] Zero simulated live financial balances or fake inspection certificates.
- [x] Confidential dealer KYB documents encrypted before object storage or isolated to UAE local storage.

---

## 3. Affirmative Approval Execution Token

To authorize live execution of the deployment pipeline in GitHub Actions:

1. Navigate to **GitHub Actions** > **CD - Approval-Gated Release Deployment Pipeline**.
2. Click **Run workflow**.
3. Select Environment: `staging`.
4. Provide Confirmation Token:
   ```
   DEPLOY
   ```
5. If running database migrations:
   - Check `run_database_migrations: true`
   - Provide `backup_verification_token` (e.g. `RDS-SNAP-STAGING-20261023`)
6. Review execution logs and observe mandatory health probe certification.
