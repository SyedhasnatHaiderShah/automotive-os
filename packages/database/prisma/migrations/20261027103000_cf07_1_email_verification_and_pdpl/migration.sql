-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token_hash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "buyer_profiles" ADD COLUMN IF NOT EXISTS "pdpl_consent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_email_verification_token_hash_idx" ON "users"("email_verification_token_hash");
