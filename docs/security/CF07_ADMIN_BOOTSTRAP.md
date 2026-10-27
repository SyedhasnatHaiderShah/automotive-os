# CF-07: Platform Administrator Provisioning & Zero-Trust Bootstrap Specification

**Status:** Approved & Implemented  
**Date:** 2026-10-27  
**Branch:** `feature/cf07-unified-auth-rbac`  
**Security Classification:** Highly Confidential / Operational Security Standard

---

## 1. Designated Administrator Identities

Under Mission CF-07, platform administrator privileges (`User.isPlatformAdmin = true`) are strictly restricted to two designated email identities:
1. `hasnathaider332@gmail.com`
2. `hasnatshah230@gmail.com`

---

## 2. Zero-Trust Bootstrap Principles

### 2.1 Zero Default Passwords
At no point does the system assign a default, hardcoded, or temporary password. Default passwords are a primary vector for credential theft and automated scanning attacks.

### 2.2 Unverified Self-Registration Defense
Public registration endpoints (`POST /api/v1/auth/signup` and `/auth`) strictly create accounts with `isPlatformAdmin = false`. 
Even if an unauthenticated user enters one of the designated administrator email addresses during public registration:
1. The request will fail or remain unverified.
2. Under no circumstance will public registration elevate an account or grant admin privileges.

### 2.3 Cryptographic Single-Use Activation Tokens
1. **Entropy**: 256 bits of cryptographically secure pseudo-random entropy generated via Node.js `crypto.randomBytes(32)`.
2. **Storage**: Only the SHA-256 digest (`tokenHash`) is persisted in PostgreSQL table `user_invitations`. If the database is compromised, plaintext activation tokens cannot be recovered.
3. **Lifespan**: 24-hour strict expiry (`expiresAt = now() + 24 hours`).
4. **Invalidation**: Any subsequent bootstrap execution deletes prior pending tokens. Upon successful password and MFA setup, `acceptedAt` is marked and the token is invalidated.

---

## 3. Operational Execution

### Running the Bootstrap Script
The script connects to the configured database (local development or Railway staging via `DATABASE_URL`):

```bash
pnpm exec tsx scripts/bootstrap-platform-admins.ts
```

### Execution Output
The script outputs:
1. Confirmation of user record creation or elevation.
2. Single-use activation URL with raw token query parameter.
3. Confirmation of audit log creation in `audit_events`.

---

## 4. Activation Workflow

1. The designated administrator clicks the secure activation URL:
   `https://automotive-marketplace-staging.up.railway.app/auth/activate?token=<256_BIT_TOKEN>`
2. The user establishes their initial master password complying with platform password policy:
   - Minimum 10 characters
   - Uppercase, lowercase, numeric, and special characters
3. Mandatory Multi-Factor Authentication (MFA) setup is completed.
4. The user's account status transitions from `PENDING_VERIFICATION` to `ACTIVE`.
5. Audit event `PLATFORM_ADMIN_ACTIVATED` is logged in the append-only outbox/audit trail.
