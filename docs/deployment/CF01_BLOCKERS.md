# CF-01 — Deployment Blockers & Resolution Log

**Project:** Automotive OS (UAE Multi-Tenant SaaS & Car Marketplace)  
**Document ID:** `docs/deployment/CF01_BLOCKERS.md`  
**Date:** October 23, 2026  
**Status:** ACTIVE TRACKING REGISTER

---

## 1. Resolved Blockers (Preflight Phase)

The following release-blocking defects were identified, analyzed, and successfully remediated during the CF-01 preflight cycle:

| Blocker ID | Affected Component | Root Cause | Remediation Applied | Resolution Status |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-01** | `.github/workflows/deploy.yml` | GitHub Actions parser error on run `39992368139` due to `${{ inputs.environment }}` in job names and top-level concurrency group evaluated during push events. | Normalized job names to static identifiers; replaced top-level concurrency with safe workflow ref; gated pipeline behind manual `workflow_dispatch`. | **RESOLVED** |
| **BLK-02** | Frontend Worker Bundling | Cloudflare Workers V8 isolates rejected loading platform-native `.node` binary files (`@img/sharp-win32-x64.node`). | Configured `images: { unoptimized: true }` across all frontends and aliased `sharp` to an empty shim in `open-next.config.ts`. | **RESOLVED** |
| **BLK-03** | OpenNext Windows Builder | `@opennextjs/aws` AST regex matchers failed on Windows backslash path separators (`\`). | Applied POSIX relative path normalization in builder hooks. | **RESOLVED** |
| **BLK-04** | Next.js 15 App Router Workerd Runtime | `NextNodeServer.getMiddlewareManifest()` called `require(this.middlewareManifestPath)`, which threw `Dynamic require is not supported` in workerd. | Added `NEXT_PRIVATE_MINIMAL_MODE = "1"` to worker variables, informing Next.js to bypass Node middleware manifests in serverless isolates. | **RESOLVED** |
| **BLK-05** | Database Tooling | CI failed on `tsx` not found during `prisma/seed.ts` execution. | Pinned `tsx` directly in `packages/database/package.json` devDependencies. | **RESOLVED** |

---

## 2. Active External & Governance Blockers (Requiring Human Approval)

The following items are active blockers that gate live staging deployment. Per repository safety rules (`AGENTS.md`), autonomous agents are prohibited from provisioning live cloud resources or running destructive cloud actions without explicit authorization.

### BLK-ACT-01: `CLOUD_PROVISIONING_APPROVAL` (Gating Live Deployment)
- **Status:** **BLOCKED ON OPERATOR APPROVAL**
- **Impact:** Live Cloudflare API calls, R2 bucket creation, and Worker deployment are held.
- **Action Required:** Operator review of the itemized resource and cost list in the PR, followed by providing explicit confirmation (`I_UNDERSTAND_THIS_ALTERS_INFRASTRUCTURE`).

### BLK-ACT-02: Cloudflare API Credentials & Account Injection
- **Status:** **BLOCKED ON SECRETS REGISTRATION**
- **Impact:** GitHub Actions cannot authenticate to Cloudflare without secrets.
- **Required Secrets in GitHub Repository:**
  - `CLOUDFLARE_API_TOKEN` (Workers, Pages, DNS, Access, R2 permissions)
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_TUNNEL_TOKEN`

### BLK-ACT-03: UAE DNS Delegation (`staging.automotive-os.ae`)
- **Status:** **PENDING REGISTRAR NAMESERVER DELEGATION**
- **Impact:** Custom subdomains (`marketplace.staging.automotive-os.ae`, etc.) will not resolve until the domain's NS records are delegated to Cloudflare authoritative nameservers.
- **Workaround for Staging Testing:** Developers can test against `*.workers.dev` staging routes prior to DNS zone activation.

### BLK-ACT-04: External UAE Government Integrations (UAE PASS & RTA)
- **Status:** **MOCKED / CONTROLLED IN STAGING (PER INTEGRATION TRUTH TABLE)**
- **Impact:** UAE PASS OIDC and Dubai RTA inspection certificate APIs require production government accreditations.
- **Resolution Strategy:** Staging operates with verified test fixtures and controlled sandbox interfaces as documented in `docs/implementation/INTEGRATION_TRUTH_TABLE.md`. No live claims are simulated.
