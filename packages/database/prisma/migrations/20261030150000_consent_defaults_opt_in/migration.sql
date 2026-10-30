-- MK-09: WhatsApp and AECB-refresh consent must be opt-in.
-- The previous column defaults were TRUE, and no consent timestamp exists, so
-- stored TRUE values cannot be told apart from real opt-ins. Per product
-- decision (2026-10-30) every existing value is reset to FALSE; buyers opt in
-- again from account settings.
ALTER TABLE "buyer_profiles" ALTER COLUMN "whatsapp_comms_consent" SET DEFAULT false;
ALTER TABLE "buyer_profiles" ALTER COLUMN "aecb_refresh_consent" SET DEFAULT false;

UPDATE "buyer_profiles"
SET "whatsapp_comms_consent" = false,
    "aecb_refresh_consent" = false,
    "updated_at" = NOW()
WHERE "whatsapp_comms_consent" = true OR "aecb_refresh_consent" = true;
