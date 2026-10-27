-- ==============================================================================
-- Migration: Add CF-07 Unified Authentication, User Status, Sessions & Invitations
-- ==============================================================================

-- 1. Create UserStatus Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION');
  END IF;
END $$;

-- 2. Add New Columns to Users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mfa_secret" TEXT,
  ADD COLUMN IF NOT EXISTS "mfa_enabled" BOOLEAN NOT NULL DEFAULT false;

-- 3. Create Sessions Table
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "user_agent" TEXT,
  "ip_address" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX IF NOT EXISTS "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- 4. Create User Invitations Table
CREATE TABLE IF NOT EXISTS "user_invitations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "tenant_id" UUID,
  "role" "MembershipRole",
  "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
  "invited_by_id" UUID,
  "invited_user_id" UUID,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "user_invitations_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_invitations_token_hash_key" ON "user_invitations"("token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "user_invitations_invited_user_id_key" ON "user_invitations"("invited_user_id");
CREATE INDEX IF NOT EXISTS "user_invitations_email_idx" ON "user_invitations"("email");
CREATE INDEX IF NOT EXISTS "user_invitations_tenant_id_idx" ON "user_invitations"("tenant_id");

-- 5. RLS & Permissions for automotive_app_user
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'automotive_app_user') THEN
    GRANT ALL PRIVILEGES ON TABLE public.sessions TO automotive_app_user;
    GRANT ALL PRIVILEGES ON TABLE public.user_invitations TO automotive_app_user;
  END IF;
END $$;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_user_isolation ON public.sessions;
CREATE POLICY sessions_user_isolation ON public.sessions
  FOR ALL
  USING (user_id = app.current_user_uuid() OR app.is_platform_admin())
  WITH CHECK (user_id = app.current_user_uuid() OR app.is_platform_admin());

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitations_tenant_isolation ON public.user_invitations;
CREATE POLICY invitations_tenant_isolation ON public.user_invitations
  FOR ALL
  USING (
    tenant_id = app.current_tenant_uuid() 
    OR app.is_platform_admin()
  )
  WITH CHECK (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin());
