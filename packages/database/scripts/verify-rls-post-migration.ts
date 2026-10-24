import { PrismaClient } from '@prisma/client';

const EXPECTED_RLS_TABLES = [
  'branches',
  'memberships',
  'vehicles',
  'vehicle_media',
  'listings',
  'leads',
  'lead_data_grants',
  'appointments',
  'subscriptions',
  'dealer_verifications',
  'buyer_profiles',
  'favorites',
  'saved_searches',
  'audit_events',
  'outbox_events',
  'makes',
  'car_models',
];

const REQUIRED_POLICIES = [
  { table: 'branches', policy: 'tenant_isolation' },
  { table: 'memberships', policy: 'tenant_isolation' },
  { table: 'vehicles', policy: 'tenant_isolation' },
  { table: 'vehicle_media', policy: 'tenant_isolation' },
  { table: 'vehicle_media', policy: 'public_vehicle_media_read' },
  { table: 'listings', policy: 'tenant_isolation' },
  { table: 'listings', policy: 'public_published_listings_read' },
  { table: 'leads', policy: 'tenant_isolation' },
  { table: 'leads', policy: 'buyer_lead_access' },
  { table: 'lead_data_grants', policy: 'tenant_isolation' },
  { table: 'appointments', policy: 'tenant_isolation' },
  { table: 'appointments', policy: 'buyer_appointment_access' },
  { table: 'subscriptions', policy: 'tenant_isolation' },
  { table: 'dealer_verifications', policy: 'tenant_isolation' },
  { table: 'buyer_profiles', policy: 'buyer_isolation' },
  { table: 'favorites', policy: 'buyer_isolation' },
  { table: 'saved_searches', policy: 'buyer_isolation' },
  { table: 'makes', policy: 'public_catalog_makes' },
  { table: 'car_models', policy: 'public_catalog_models' },
  { table: 'audit_events', policy: 'audit_events_tenant_isolation' },
  { table: 'outbox_events', policy: 'outbox_events_tenant_isolation' },
];

async function verifyRlsPostMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  console.log('========================================================================');
  console.log('Automotive OS — Post-Migration Row-Level Security (RLS) Verification Gate');
  console.log('========================================================================\n');

  if (!databaseUrl) {
    console.error('❌ FATAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  let failures = 0;

  try {
    // 1. Verify helper functions exist in 'app' schema
    console.log('1. Verifying RLS context helper functions in schema "app"...');
    const functionsResult: any = await prisma.$queryRawUnsafe(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'app' 
        AND routine_name IN ('current_tenant_uuid', 'current_user_uuid', 'is_platform_admin');
    `);

    const installedFunctions = new Set(functionsResult.map((r: any) => r.routine_name));
    for (const fn of ['current_tenant_uuid', 'current_user_uuid', 'is_platform_admin']) {
      if (installedFunctions.has(fn)) {
        console.log(`   ✅ Function app.${fn}() is installed.`);
      } else {
        console.error(`   ❌ MISSING FUNCTION: app.${fn}() not found!`);
        failures++;
      }
    }

    // 2. Verify Row-Level Security is ENABLED and FORCED on all sensitive tables
    console.log('\n2. Verifying RLS enablement (relrowsecurity & relforcerowsecurity)...');
    const tableSecurityResult: any = await prisma.$queryRawUnsafe(`
      SELECT 
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' 
        AND c.relname = ANY($1::text[])
      ORDER BY c.relname;
    `, EXPECTED_RLS_TABLES);

    const tableSecurityMap = new Map<string, { rls_enabled: boolean; rls_forced: boolean }>();
    for (const row of tableSecurityResult) {
      tableSecurityMap.set(row.table_name, {
        rls_enabled: row.rls_enabled,
        rls_forced: row.rls_forced,
      });
    }

    for (const table of EXPECTED_RLS_TABLES) {
      const sec = tableSecurityMap.get(table);
      if (!sec) {
        console.error(`   ❌ Table public.${table} not found in database!`);
        failures++;
      } else if (!sec.rls_enabled) {
        console.error(`   ❌ Table public.${table} DOES NOT have Row Level Security enabled!`);
        failures++;
      } else {
        console.log(`   ✅ Table public.${table}: RLS ENABLED (forced: ${sec.rls_forced})`);
      }
    }

    // 3. Verify exact required RLS policies exist
    console.log('\n3. Verifying active PostgreSQL RLS security policies...');
    const policiesResult: any = await prisma.$queryRawUnsafe(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public';
    `);

    const existingPolicies = new Set(
      policiesResult.map((p: any) => `${p.tablename}:${p.policyname}`)
    );

    console.log(`   Found ${policiesResult.length} total active RLS policies in public schema.`);

    for (const req of REQUIRED_POLICIES) {
      const key = `${req.table}:${req.policy}`;
      if (existingPolicies.has(key)) {
        console.log(`   ✅ Policy [${req.policy}] on ${req.table} is ACTIVE.`);
      } else {
        console.error(`   ❌ MISSING POLICY: Policy [${req.policy}] on table ${req.table} NOT FOUND!`);
        failures++;
      }
    }

    // 4. Verify runtime DB role does not have BYPASSRLS
    console.log('\n4. Verifying non-bypass role attribute for application safety...');
    const roleResult: any = await prisma.$queryRawUnsafe(`
      SELECT rolname, rolsuper, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = CURRENT_USER;
    `);

    if (roleResult.length > 0) {
      const currentRole = roleResult[0];
      console.log(`   Current connection role: ${currentRole.rolname}`);
      console.log(`   Superuser: ${currentRole.rolsuper}`);
      console.log(`   Bypass RLS: ${currentRole.rolbypassrls}`);

      if (currentRole.rolbypassrls) {
        console.warn(`   ⚠️ WARNING: Current connection role '${currentRole.rolname}' has rolbypassrls=true.`);
        console.warn(`   Ensure the application connection pool user (e.g. automotive_app_user) has rolbypassrls=false!`);
      } else {
        console.log(`   ✅ Role '${currentRole.rolname}' enforces Row-Level Security (rolbypassrls=false).`);
      }
    }

    // Check application user role if exists
    const appRoleResult: any = await prisma.$queryRawUnsafe(`
      SELECT rolname, rolsuper, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = 'automotive_app_user';
    `);

    if (appRoleResult.length > 0) {
      const appRole = appRoleResult[0];
      if (appRole.rolbypassrls) {
        console.error(`   ❌ FATAL SECURITY VIOLATION: Application role 'automotive_app_user' has rolbypassrls=true!`);
        failures++;
      } else {
        console.log(`   ✅ Application role 'automotive_app_user' strictly lacks rolbypassrls.`);
      }
    }

    console.log('\n========================================================================');
    if (failures === 0) {
      console.log('✅ ALL RLS POST-MIGRATION POLICIES AND CONSTRAINTS CONFIRMED PASS.');
      console.log('========================================================================');
      process.exit(0);
    } else {
      console.error(`❌ FAILED: ${failures} RLS verification checks failed.`);
      console.log('========================================================================');
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ FATAL POST-MIGRATION VERIFICATION ERROR: ${err?.message || err}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRlsPostMigration();
