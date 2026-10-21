-- ==============================================================================
-- Migration: Enable Row-Level Security (RLS) & Application Role
-- ==============================================================================

-- 1. Create Non-Bypass Application Database Role for Runtime Operations
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'automotive_app_user') THEN
    CREATE ROLE automotive_app_user WITH LOGIN PASSWORD 'app_secure_dev_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO automotive_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO automotive_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO automotive_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO automotive_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO automotive_app_user;

-- 2. Context Schema and Helper Functions
CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO automotive_app_user;

CREATE OR REPLACE FUNCTION app.current_tenant_uuid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;
GRANT EXECUTE ON FUNCTION app.current_tenant_uuid() TO automotive_app_user;

CREATE OR REPLACE FUNCTION app.current_user_uuid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;
GRANT EXECUTE ON FUNCTION app.current_user_uuid() TO automotive_app_user;

CREATE OR REPLACE FUNCTION app.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.is_admin', true), '')::boolean, false);
$$;
GRANT EXECUTE ON FUNCTION app.is_platform_admin() TO automotive_app_user;

-- 3. Enable and Force RLS on Dealer Operational Tables
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
    
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', dealer_table);
    
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I FOR ALL USING (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin()) WITH CHECK (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin())',
      dealer_table
    );
  END LOOP;
END $$;

-- 4. Enable and Force RLS on Buyer Resources (Global Identity Domain)
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

-- 5. Public Marketplace Read Projection Policies
-- Enforce: only PUBLISHED listings whose underlying vehicle is AVAILABLE are visible publicly
DROP POLICY IF EXISTS public_published_listings_read ON public.listings;
CREATE POLICY public_published_listings_read ON public.listings
  FOR SELECT
  USING (
    status = 'PUBLISHED'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = listings.vehicle_id
        AND v.stock_status = 'AVAILABLE'
    )
  );

DROP POLICY IF EXISTS public_vehicle_media_read ON public.vehicle_media;
CREATE POLICY public_vehicle_media_read ON public.vehicle_media
  FOR SELECT
  USING (is_public = true);

-- Catalog Taxonomy
ALTER TABLE public.makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_catalog_makes ON public.makes;
CREATE POLICY public_catalog_makes ON public.makes FOR SELECT USING (true);

DROP POLICY IF EXISTS public_catalog_models ON public.car_models;
CREATE POLICY public_catalog_models ON public.car_models FOR SELECT USING (true);

-- 6. Audit & Outbox Events RLS
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_events_tenant_isolation ON public.audit_events;
CREATE POLICY audit_events_tenant_isolation ON public.audit_events
  FOR SELECT
  USING (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin());

DROP POLICY IF EXISTS audit_events_insert ON public.audit_events;
CREATE POLICY audit_events_insert ON public.audit_events
  FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outbox_events_tenant_isolation ON public.outbox_events;
CREATE POLICY outbox_events_tenant_isolation ON public.outbox_events
  FOR ALL
  USING (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin())
  WITH CHECK (tenant_id = app.current_tenant_uuid() OR app.is_platform_admin());
