## 2026-10-26 - Non-Development Exception Sanitization & Cryptographic Correlation IDs

**Vulnerability:** Unhandled 500 exceptions only sanitized error messages when `process.env.NODE_ENV === "production"`, leaving staging and non-prod deployments susceptible to database/SQL driver disclosure. Correlation IDs were also generated using pseudo-random `Math.random()`.

**Learning:** Staging and pre-production environments often run real database schemas and should be sanitized equally against unexpected error leakage. NestJS global filters should check for non-development / non-test environments (`process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test"`) to redact internal messages while logging unhandled exceptions server-side with UUID correlation context.

**Prevention:** Use standard Node.js `node:crypto` `randomUUID()` for correlation tracking and ensure unhandled 500 error messages fail closed with opaque client responses across all non-development environments.
