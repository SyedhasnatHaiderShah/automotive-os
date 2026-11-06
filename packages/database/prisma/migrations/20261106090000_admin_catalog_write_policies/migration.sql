-- AD-20: platform administrators (app.is_platform_admin()) may write the shared
-- catalogue tables. Until now makes, car_models and subscription_plans only had
-- a public SELECT policy under FORCE ROW LEVEL SECURITY, so the application role
-- could never insert, update or delete a make, model or plan.
DROP POLICY IF EXISTS admin_catalog_makes_write ON public.makes;
CREATE POLICY admin_catalog_makes_write ON public.makes
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

DROP POLICY IF EXISTS admin_catalog_models_write ON public.car_models;
CREATE POLICY admin_catalog_models_write ON public.car_models
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

DROP POLICY IF EXISTS admin_plans_write ON public.subscription_plans;
CREATE POLICY admin_plans_write ON public.subscription_plans
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());
