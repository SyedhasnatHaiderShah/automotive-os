const DEFAULT_DEV_SECRET = 'dev-jwt-secret-replace-in-production-min-32-chars-long';
const MIN_SECRET_LENGTH = 32;

/** True only for local development and automated tests. */
export function isLocalOrTestEnv(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

/**
 * Resolves the HS256 signing secret. The well-known development default is
 * only allowed when NODE_ENV is explicitly development or test; every other
 * environment (including an unset NODE_ENV) must provide a strong secret.
 */
export function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (isLocalOrTestEnv()) {
    return configured || DEFAULT_DEV_SECRET;
  }
  if (!configured || configured === DEFAULT_DEV_SECRET || configured.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `CRITICAL_SECURITY_ERROR: JWT_SECRET must be set to a non-default secret of at least ${MIN_SECRET_LENGTH} characters when NODE_ENV is '${process.env.NODE_ENV ?? 'unset'}'.`
    );
  }
  return configured;
}
