-- PF-07: indexes for public listing search filters (make, model, branch/emirate, price).
-- Additive only; no data changes.
CREATE INDEX IF NOT EXISTS "vehicles_make_id_idx" ON "vehicles"("make_id");
CREATE INDEX IF NOT EXISTS "vehicles_model_id_idx" ON "vehicles"("model_id");
CREATE INDEX IF NOT EXISTS "vehicles_tenant_id_branch_id_idx" ON "vehicles"("tenant_id", "branch_id");
CREATE INDEX IF NOT EXISTS "listings_status_asking_price_fils_idx" ON "listings"("status", "asking_price_fils");
