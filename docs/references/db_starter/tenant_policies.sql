-- Defense-in-depth RLS starter. Do not apply unchanged without a threat-model review.
-- Application roles MUST NOT be superuser, table owner or BYPASSRLS.
-- Important: use these policies only with a verified membership/role check in the API.
-- set_config('app.tenant_id', tenantId, true) must run INSIDE the transaction
-- and every query in that request must use the SAME transaction connection.
-- Audit events and payment/identity flows need explicit service-role policy design.

CREATE SCHEMA IF NOT EXISTS app;
CREATE OR REPLACE FUNCTION app.current_tenant_uuid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'branches', 'memberships', 'vehicles', 'vehicle_media', 'listings',
    'leads', 'lead_data_grants', 'appointments', 'subscriptions'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I FOR ALL USING (tenant_id = app.current_tenant_uuid()) WITH CHECK (tenant_id = app.current_tenant_uuid())',
      table_name
    );
  END LOOP;
END $$;

-- IMPORTANT: This isolates dealer operational writes, but public marketplace
-- search must NOT run with privileged access to private stock or lead tables.
-- Serve public browse from a separately designed, redacted published-listing
-- projection/read model with read-only permissions. Buyer resources need distinct
-- owner policies; cross-tenant reporting needs a separately audited service role.
-- Do not make dealer membership verification dependent on a tenant RLS query
-- before the tenant context has been set: resolve authorized membership using
-- a separately secured authentication service/query, then begin tenant transaction.
