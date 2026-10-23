-- AlterTable
ALTER TABLE "buyer_profiles"
  ADD COLUMN IF NOT EXISTS "corporate_affiliation" TEXT,
  ADD COLUMN IF NOT EXISTS "trn" TEXT,
  ADD COLUMN IF NOT EXISTS "settlement_currency" TEXT NOT NULL DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS "escrow_iban" TEXT,
  ADD COLUMN IF NOT EXISTS "garage_visibility" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "aecb_refresh_consent" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "whatsapp_comms_consent" BOOLEAN NOT NULL DEFAULT true;
