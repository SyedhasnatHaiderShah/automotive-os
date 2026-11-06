## 2026-10-26 - Non-Development Exception Sanitization & Cryptographic Correlation IDs

**Vulnerability:** Unhandled 500 exceptions only sanitized error messages when `process.env.NODE_ENV === "production"`, leaving staging and non-prod deployments susceptible to database/SQL driver disclosure. Correlation IDs were also generated using pseudo-random `Math.random()`.

**Learning:** Staging and pre-production environments often run real database schemas and should be sanitized equally against unexpected error leakage. NestJS global filters should check for non-development / non-test environments (`process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test"`) to redact internal messages while logging unhandled exceptions server-side with UUID correlation context.

**Prevention:** Use standard Node.js `node:crypto` `randomUUID()` for correlation tracking and ensure unhandled 500 error messages fail closed with opaque client responses across all non-development environments.

## 2026-10-31 - Public Media Storage Gateway Authorization & Multi-Tenant Lifecycle Gating

**Vulnerability:** Public vehicle media was streamed through `/api/v1/public/media/*` solely checking `isPublic: true`. This allowed unauthenticated retrieval of media belonging to suspended, closed, or unapproved dealers, media of archived or sold inventory, or private documents mistakenly flagged as public.

**Learning:** Public proxy endpoints that bypass database tenant RLS via administrative context (`runWithDbContext({ isAdmin: true }, ...)`) must explicitly verify lifecycle invariants (e.g., `tenant.status === 'ACTIVE'`, `vehicle.stockStatus === 'AVAILABLE'`, and `kind !== 'DOCUMENT'`).

**Prevention:** Always enforce domain-level status checks (tenant active state and vehicle available stock status) when resolving public assets in multi-tenant systems.

## 2026-11-06 - Unauthenticated Token Verification Route Rate Limiting

**Vulnerability:** While sensitive auth mutation endpoints (`/login`, `/signup`, `/verify-email`, `/resend-verification`, `/activate/complete`) enforced `AuthRateLimitGuard`, the GET `/activate/verify` endpoint lacked rate limiting. This allowed unauthenticated, automated enumeration and brute-force probing of invitation tokens and associated dealer/admin invitation metadata.

**Learning:** Any public endpoint that accepts and validates sensitive security tokens or invitations must be protected by the same per-IP fixed-window rate limiting (`AuthRateLimitGuard`) as token consumption endpoints, preventing brute-force token enumeration and email address harvesting.

**Prevention:** Always pair `@Public()` activation and verification endpoints with `@UseGuards(AuthRateLimitGuard)` and appropriate `@AuthRateLimit(...)` policies.
