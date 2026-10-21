-- ==============================================================================
-- Automotive OS — Defense-in-Depth PostgreSQL Row-Level Security (RLS)
-- ==============================================================================
-- IMPORTANT ARCHITECTURAL CONSTRAINTS:
-- 1. Application database role MUST NOT be superuser, table owner, or BYPASSRLS.
-- 2. Context variables must be set INSIDE the transaction using transaction-local settings:
--      SELECT set_config('app.tenant_id', :tenantId, true);
--      SELECT set_config('app.user_id', :userId, true);
-- 3. Never execute these policies blindly without application-level membership checks.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS app;

-- Function: Resolve current tenant UUID from transaction local context
CREATE OR REPLACE FUNCTION app.current_tenant_uuid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- Function: Resolve current user UUID (for buyer and audit context)
CREATE OR REPLACE FUNCTION app.current_user_uuid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;

-- Function: Check if current execution context is platform admin
CREATE OR REPLACE FUNCTION app.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.is_admin', true), '')::boolean, false);
$$;

-- ------------------------------------------------------------------------------
-- 1. Dealer Operational Tables (Strict Tenant Boundary Isolation)
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  dealer_table text;
BEGIN
  FOREACH dealer_table IN ARRAY ARRAY[
    'branches',
    'memberships',
    'vehicles',
    'vehicle_media',
    'listings',
    'leads',
    'lead_data_grants',
    'appointments',
    'subscriptions',
    'dealer_verifications'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', dealer_table);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', dealer_table);
    
    -- Drop existing isolation policy if exists for idempotent re-runs
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', dealer_table);
    
    -- Tenant isolation: enforces dealer context on SELECT, INSERT, UPDATE, DELETE
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I FOR ALL USING (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin()) WITH CHECK (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin())',
      dealer_table
    );
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Buyer Resource Authorization (Global Identity Domain)
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  buyer_table text;
BEGIN
  FOREACH buyer_table IN ARRAY ARRAY[
    'buyer_profiles',
    'favorites',
    'saved_searches'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', buyer_table);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', buyer_table);
    
    EXECUTE format('DROP POLICY IF EXISTS buyer_isolation ON public.%I', buyer_table);
    
    -- Buyer isolation: strictly ensures users only access their own resources
    EXECUTE format(
      'CREATE POLICY buyer_isolation ON public.%I FOR ALL USING (user_id = app.current_user_uuid() OR app.is_platform_admin()) WITH CHECK (user_id = app.current_user_uuid() OR app.is_platform_admin())',
      buyer_table
    );
  END LOOP;
END $$;

-- Buyer Read Access to their own submitted Leads and Appointments
DROP POLICY IF EXISTS buyer_lead_access ON public.leads;
CREATE POLICY buyer_lead_access ON public.leads
  FOR SELECT
  USING (buyer_user_id = app.current_user_uuid());

DROP POLICY IF EXISTS buyer_appointment_access ON public.appointments;
CREATE POLICY buyer_appointment_access ON public.appointments
  FOR SELECT
  USING (buyer_user_id = app.current_user_uuid());

-- ------------------------------------------------------------------------------
-- 3. Public Marketplace Projection Policies (Read-Only)
-- ------------------------------------------------------------------------------

-- Allow public read access strictly to APPROVED & PUBLISHED listings
DROP POLICY IF EXISTS public_published_listings_read ON public.listings;
CREATE POLICY public_published_listings_read ON public.listings
  FOR SELECT
  USING (status = 'PUBLISHED');

-- Allow public read access to public vehicle media assets
DROP POLICY IF EXISTS public_vehicle_media_read ON public.vehicle_media;
CREATE POLICY public_vehicle_media_read ON public.vehicle_media
  FOR SELECT
  USING (is_public = true);

-- Catalog Taxonomy (Makes & Models): Globally accessible for reading
ALTER TABLE public.makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_catalog_makes ON public.makes;
CREATE POLICY public_catalog_makes ON public.makes FOR SELECT USING (true);

DROP POLICY IF EXISTS public_catalog_models ON public.car_models;
CREATE POLICY public_catalog_models ON public.car_models FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 4. Audit & Outbox Events Security
-- ------------------------------------------------------------------------------

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_events_tenant_isolation ON public.audit_events;
CREATE POLICY audit_events_tenant_isolation ON public.audit_events
  FOR SELECT
  USING (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin());

ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outbox_events_tenant_isolation ON public.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON public.outbox_events
  FOR ALL
  USING (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin())
  WITH CHECK (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin());
