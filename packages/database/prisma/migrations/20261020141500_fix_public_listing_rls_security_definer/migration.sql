-- ==============================================================================
-- Migration: Secure Public Listing Read Policy via Security Definer Helper
-- ==============================================================================

-- Security Definer function to check vehicle availability without exposing private vehicle ledger
CREATE OR REPLACE FUNCTION app.is_vehicle_available(p_vehicle_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE id = p_vehicle_id
      AND stock_status = 'AVAILABLE'
  );
$$;

GRANT EXECUTE ON FUNCTION app.is_vehicle_available(uuid) TO automotive_app_user;

-- Recreate public read policy using the security definer function
DROP POLICY IF EXISTS public_published_listings_read ON public.listings;
CREATE POLICY public_published_listings_read ON public.listings
  FOR SELECT
  USING (
    status = 'PUBLISHED'
    AND app.is_vehicle_available(vehicle_id)
  );
