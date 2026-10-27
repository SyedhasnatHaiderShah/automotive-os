# CF-07: Threat Model & Security Posture Analysis

## 1. Scope & Objective

This document analyzes the threat surface for the unified authentication, authorization, session management, and single-domain routing system implemented in Mission CF-07.

The methodology adheres to the **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) threat modeling methodology and evaluates mitigations against the **OWASP Top 10:2021** and **OWASP API Security Top 10:2023**.

---

## 2. Threat Vector Evaluation & Mitigations

### 2.1 Threat Vector 1: Credential Brute-Forcing & Password Spraying
- **Threat Category**: Spoofing / Denial of Service
- **Risk**: An attacker attempts automated password guessing against designated admin emails or user accounts.
- **Mitigation Architecture**:
  1. **Account Lockout Policy**: Failed attempts are tracked in `users.failed_login_attempts`. Upon 5 consecutive failed logins, the account is locked for 15 minutes (`users.locked_until = now() + 15m`).
  2. **Memory-Hard Hashing**: Passwords are hashed using `scrypt` (N=16384, r=8, p=1), requiring 16MB of memory per hash evaluation, making GPU/ASIC offline attacks economically infeasible.
  3. **Zero Plaintext Fallbacks**: Passwords are never logged, echoed, or included in error traces.

### 2.2 Threat Vector 2: Privilege Escalation via Public Registration
- **Threat Category**: Elevation of Privilege
- **Risk**: A malicious user submits a registration payload with elevated parameters (`isPlatformAdmin: true`, `role: "OWNER"`, `tenantId: "..."`) at `/auth?tab=register`.
- **Mitigation Architecture**:
  1. **Strict DTO Filtering**: `CustomerSignupDto` validates only `email`, `password`, `fullName`, and `consentPdpl`.
  2. **Hardcoded Role Assignment**: `AuthService.signupCustomer` explicitly assigns `isPlatformAdmin: false`, creates a `BuyerProfile`, and performs zero tenant membership bindings.
  3. **Backend Independence**: The backend completely ignores client-provided role fields.

### 2.3 Threat Vector 3: Last Platform Admin Lockout / Self-Demotion
- **Threat Category**: Denial of Service
- **Risk**: An administrator accidentally or maliciously deletes their account, suspends their account, or revokes `isPlatformAdmin` when no other active platform administrators exist.
- **Mitigation Architecture**:
  1. **Active Admin Count Guard**: `AdminService.updateUser` and `deleteUser` query:
     ```typescript
     const activeAdminCount = await this.prisma.user.count({
       where: { isPlatformAdmin: true, status: 'ACTIVE' }
     });
     ```
  2. **Fail-Closed Protection**: If `activeAdminCount <= 1` and the target user is an active platform admin, demotion or deactivation is aborted with `400 Bad Request` (`CANNOT_DEMOTE_LAST_ADMIN`).

### 2.4 Threat Vector 4: Cross-Tenant Data Access (BOLA / IDOR)
- **Threat Category**: Information Disclosure / Tampering
- **Risk**: An authenticated user belonging to Dealership A manipulates URL parameters to query or mutate records belonging to Dealership B.
- **Mitigation Architecture**:
  1. **TenantAccessGuard**: Verifies active membership for the requested `tenantId`.
  2. **Defense-in-Depth PostgreSQL RLS**: Every query executed by `automotive_app_user` enforces `tenant_id = current_setting('app.current_tenant_id')`.
  3. **Composite Foreign Keys**: Tables enforce composite foreign keys `(id, tenant_id)`, ensuring records cannot reference entities across tenant boundaries.

### 2.5 Threat Vector 5: Session Hijacking & Fixation
- **Threat Category**: Spoofing
- **Risk**: An attacker steals an active session token via network interception, XSS, or retains access after user logout.
- **Mitigation Architecture**:
  1. **HTTP-Only Cookies**: `ao_session` is marked `HttpOnly: true`, preventing JavaScript extraction via XSS.
  2. **SameSite=Lax & Secure**: Restricts cookie transmission on cross-origin requests, blocking CSRF.
  3. **Database-Backed Session Ledger**: Every JWT contains a `sessionId`. When a user logs out or an admin invokes `POST /api/v1/admin/users/:id/revoke-sessions`, the session is purged from PostgreSQL, immediately invalidating the JWT across all nodes.

### 2.6 Threat Vector 6: Insecure Admin Bootstrap
- **Threat Category**: Spoofing / Elevation of Privilege
- **Risk**: Bootstrap scripts initialize administrative accounts with known default passwords or send credentials over insecure channels.
- **Mitigation Architecture**:
  1. **Zero Default Passwords**: `scripts/bootstrap-platform-admins.ts` sets `passwordHash = null` and `status = PENDING_VERIFICATION`.
  2. **High-Entropy Activation Tokens**: Generates 256-bit cryptographically secure random tokens (`crypto.randomBytes(32).toString('hex')`).
  3. **Hashed Token Storage**: The database only stores a SHA-256 hash of the activation token (`tokenHash`).
  4. **Strict 24-Hour Expiry**: Unused tokens expire automatically after 24 hours.
  5. **Audit Logging**: Emits immutable `PLATFORM_ADMIN_BOOTSTRAP` event records into `audit_logs`.

---

## 3. Compliance Matrix

| Regulation / Standard | Requirement | CF-07 Implementation Evidence |
| :--- | :--- | :--- |
| **UAE PDPL (Law No. 45/2021)** | Explicit consent for consumer data intake | Affirmative `consentPdpl: true` required on customer signup |
| **UAE PDPL (Law No. 45/2021)** | Purpose-limited data access | Dealerships receive only consent-scoped buyer lead fields |
| **OWASP ASVS 4.0 (V2)** | Strong password hashing | Native `scrypt` (N=16384, r=8, p=1, 16-byte random salt) |
| **OWASP ASVS 4.0 (V3)** | Secure session management | `ao_session` HttpOnly, SameSite=Lax, Secure with instant revocation |
| **OWASP ASVS 4.0 (V4)** | Access control defense-in-depth | Multi-layer guards + PostgreSQL Row-Level Security |
